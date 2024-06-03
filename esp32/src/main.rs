use core::convert::TryInto;
use embedded_svc::wifi::{AuthMethod, ClientConfiguration, Configuration};
use esp_idf_hal::delay::FreeRtos;
use std::sync::mpsc;
use std::time::{Duration, Instant};

use esp_idf_hal::gpio::{Gpio14, Gpio18, Gpio33, Gpio4};

use esp_idf_svc::hal::prelude::Peripherals;
use esp_idf_svc::log::EspLogger;
use esp_idf_svc::mqtt::client::{
    Details, EspMqttClient, EventPayload, MqttClientConfiguration, QoS, LwtConfiguration
};
use esp_idf_svc::wifi::{BlockingWifi, EspWifi};
use esp_idf_svc::{eventloop::EspSystemEventLoop, nvs::EspDefaultNvsPartition};
use fluent_state_machine::{StateMachine, StateMachineBuilder};
use sem::component::Component;
use sem::sensor_states::{DoorState, LockState};
use log::info;

type Lock<'a> = Component<'a, LockState, Gpio18, Gpio33>;
type Door<'a> = Component<'a, DoorState, Gpio4, Gpio14>;

#[derive(Debug, Clone, Copy, PartialEq)]
enum States {
    Locked,
    Unlocked,
    Locking,
    Unlocking,
}

#[derive(PartialEq)]
enum Event {
    OpenDoor,
    Step,
}

impl Event {
    fn from_str(s: &str) -> Option<Event> {
        match s {
            "OpenDoor" => Some(Event::OpenDoor),
            _ => None,
        }
    }
}

struct Store<'a> {
    lock: Lock<'a>,
    door: Door<'a>,
    mqtt_client: EspMqttClient<'a>,
    time_at_statechange: Instant,
    time_at_sendstate: Instant
}

// NOTICE: Change this to your WiFi network SSID
const SSID: &str = "04935792";
const PASSWORD: &str = "07281803";

// NOTICE: Change this to your MQTT broker URL, make sure the broker is on the same network as you
const MQTT_URL: &str = "mqtt://192.168.87.160:8883";
const MQTT_TOPIC: &str = "B3E2/command";

const MQTT_USERNAME: Option<&str> = Some("backdoor");
const MQTT_PASSWORD: Option<&str> = Some("1234");

fn main() -> anyhow::Result<()> {
    esp_idf_svc::sys::link_patches();
    EspLogger::initialize_default();

    let peripherals = Peripherals::take()?;
    let sys_loop = EspSystemEventLoop::take()?;
    let nvs = EspDefaultNvsPartition::take()?;

    // Configure Wifi
    let mut wifi = BlockingWifi::wrap(
        EspWifi::new(peripherals.modem, sys_loop.clone(), Some(nvs))?,
        sys_loop,
    )?;
    // Establish connection to WiFi network
    connect_wifi(&mut wifi)?;

    // Configure MQTT client
    info!("About to start the MQTT client");

    let esp_id = "Building 3 ESP 2";
    // Create the payload string with the ESP ID
    let payload_str = format!("ESP32 Disconnected with ID: {}", esp_id);

    let mqtt_config = MqttClientConfiguration {
        lwt: Some(LwtConfiguration {
            topic: "B3E2/status", 
            payload: payload_str.as_bytes(), 
            qos: QoS::ExactlyOnce, 
            retain: false,
        }),
        keep_alive_interval: Some(Duration::from_secs(5)),
        username: MQTT_USERNAME,
        password: MQTT_PASSWORD,
        ..Default::default()
    };

    let (mqtt_client, mut mqtt_conn) =
        EspMqttClient::new(MQTT_URL, &mqtt_config)?;
    info!("MQTT client connected");

    // Crate IO components
    let lock = Component::new(peripherals.pins.gpio18, peripherals.pins.gpio33)?;
    let door = Component::new(peripherals.pins.gpio4, peripherals.pins.gpio14)?;

    // Run event loop
    std::thread::scope(|scope| {
        let mut state_machine = construct_lock_state_machine(lock, door, mqtt_client)?;

        let (tx, rx) = mpsc::channel();

        std::thread::Builder::new()
            .stack_size(6000)
            .spawn_scoped(scope, move || loop {
                while let Ok(event) = mqtt_conn.next() {
                    if let EventPayload::Received {
                        id,
                        topic: Some(topic),
                        data,
                        details: Details::Complete,
                    } = event.payload()
                    {
                        let message = String::from_utf8(data.to_vec()).unwrap();
                        info!("Received event: {id:#?}, topic: {topic:#?}, data: {message:#?}");

                        let open_door = Event::from_str(message.as_str());
                        if let Some(open_door) = open_door {
                            tx.send(open_door).unwrap();
                        }
                    }
                }
            })
            .unwrap();

        state_machine
            .store
            .mqtt_client
            .subscribe(MQTT_TOPIC, QoS::ExactlyOnce)?;

        info!("Subscribed to {MQTT_TOPIC}");
        std::thread::sleep(Duration::from_millis(500));
        info!("Running Event loop");
        info!("Send \"OpenDoor\" to unlock the lock");
        loop {
            // Check messages from MQTT
            let message = rx.try_recv();

            // Trigger MQTT if message is received
            if message == Ok(Event::OpenDoor) {
                state_machine.trigger(Event::OpenDoor);
            }

            if state_machine.store.time_at_sendstate.elapsed().as_secs() > 10 {

                let message = format!("{:?}", state_machine.state);

                state_machine.store
                    .mqtt_client
                    .publish(MQTT_TOPIC, QoS::ExactlyOnce, false, message.as_bytes())
                    .unwrap();
    
                state_machine.store.time_at_sendstate = Instant::now();
            }

            // Iterate one step in state machine
            state_machine.store.lock.step()?;
            state_machine.store.door.step()?;
            state_machine.trigger(Event::Step);

            // we are sleeping here to make sure the watchdog isn't triggered
            FreeRtos::delay_ms(10);
        }
    })
}

fn connect_wifi(wifi: &mut BlockingWifi<EspWifi<'static>>) -> anyhow::Result<()> {
    wifi.set_configuration(&Configuration::Client(ClientConfiguration {
        ssid: SSID.try_into().unwrap(),
        auth_method: AuthMethod::WPA2Personal,
        password: PASSWORD.try_into().unwrap(),
        ..Default::default()
    }))?;

    wifi.start()?;
    log::info!("Wifi started");

    log::info!("Connecting WiFi...");
    wifi.connect()?;
    log::info!("Wifi connected");

    wifi.wait_netif_up()?;
    log::info!("Wifi netif up");

    Ok(())
}
fn construct_lock_state_machine<'a>(
    lock: Lock<'a>,
    door: Door<'a>,
    mqtt_client: EspMqttClient<'a>,
) -> anyhow::Result<StateMachine<Event, States, Store<'a>>> {
    let store = Store {
        lock,
        door,
        mqtt_client,
        time_at_statechange: Instant::now(),
        time_at_sendstate: Instant::now()
    };

    info!("Created Store");

    let global_action = |store: &mut Store, state: &States, _: &Event| {
        // Publish state
        let message = format!("{:?}", state);
        store
            .mqtt_client
            .publish(MQTT_TOPIC, QoS::ExactlyOnce, false, message.as_bytes())
            .unwrap();

        store.time_at_sendstate = Instant::now();

        // Update duration
        store.time_at_statechange = Instant::now();
        log::info!("State: {:?}", state);
    };
    info!("Created global action");

    #[rustfmt::skip]
    let state_machine = StateMachineBuilder::new(store, States::Locked)
        .set_global_action(global_action)
        .state(States::Locked)
            .on(Event::OpenDoor)
                .go_to(States::Unlocking)
        .state(States::Unlocking)
            .on(Event::Step)
                .go_to(States::Unlocked)
                .only_if(|store| store.lock.state == LockState::Unlocked)
            .on(Event::Step)
                .go_to(States::Locked)
                .only_if(|store| {
                    store.time_at_statechange.elapsed() > Duration::from_secs(10)
                    && store.door.state == DoorState::Closed})
        .state(States::Unlocked)
            .on(Event::Step)
                .go_to(States::Locking)
                .only_if(|store| {
                    store.door.state == DoorState::Closed
                    && store.time_at_statechange.elapsed() > Duration::from_secs(10)
                })
        .state(States::Locking)
            .on(Event::Step)
                .go_to(States::Locked)
                .only_if(|store| store.lock.state == LockState::Locked)
        .build()
        .unwrap();

    info!("Created state machine");

    Ok(state_machine)
}
