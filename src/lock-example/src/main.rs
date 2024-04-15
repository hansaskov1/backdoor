use core::convert::TryInto;
use std::io::Read;
use embedded_svc::wifi::{AuthMethod, ClientConfiguration, Configuration};
use std::time::{Duration, Instant};

use esp_idf_hal::gpio::{Gpio14, Gpio18, Gpio33, Gpio4};

use esp_idf_svc::hal::prelude::Peripherals;
use esp_idf_svc::log::EspLogger;
use esp_idf_svc::mqtt::client::{EspMqttClient, EspMqttConnection, MqttClientConfiguration, QoS};
use esp_idf_svc::wifi::{BlockingWifi, EspWifi};
use esp_idf_svc::{eventloop::EspSystemEventLoop, nvs::EspDefaultNvsPartition};
use fluent_state_machine::{StateMachine, StateMachineBuilder};
use lock_example::component::Component;
use lock_example::sensor_states::{DoorState, LockState};
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

struct Store<'a> {
    lock: Lock<'a>,
    door: Door<'a>,
    mqtt_client: EspMqttClient<'a>,
    duration_in_state: Instant,
}

// NOTICE: Change this to your WiFi network SSID
const SSID: &str = "hansaskov";
const PASSWORD: &str = "hansaskov";

// NOTICE: Change this to your MQTT broker URL, make sure the broker is on the same network as you
const MQTT_URL: &str = "mqtt://192.168.0.48:1883";
const MQTT_TOPIC: &str = "hello";

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
    let (mqtt_client, mut mqtt_conn) =
        EspMqttClient::new(MQTT_URL, &MqttClientConfiguration::default())?;
    info!("MQTT client connected");

    // Run event loop
    std::thread::scope(|scope| {
        // Values will be accesable within the state machine.

        let store = Store {
            lock: Component::new(peripherals.pins.gpio18, peripherals.pins.gpio33)?,
            door: Component::new(peripherals.pins.gpio4, peripherals.pins.gpio14)?,
            mqtt_client: mqtt_client,
            duration_in_state: Instant::now(),
        };
        info!("Created Store");

        let global_action = |store: &mut Store, state: &States, _: &Event| {
            // Publish state
            let message = format!("{:?}", state);
            store
                .mqtt_client
                .publish(MQTT_TOPIC, QoS::AtMostOnce, false, message.as_bytes())
                .unwrap();

            // Update duration
            store.duration_in_state = Instant::now();
            log::info!("State: {:?}", state);
        };
        info!("Created global action");

        #[rustfmt::skip]
    let mut state_machine = StateMachineBuilder::new(store, States::Locked)
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
                    store.duration_in_state.elapsed() > Duration::from_secs(10) 
                    && store.door.state == DoorState::Closed})
        .state(States::Unlocked)
            .on(Event::Step)
                .go_to(States::Locking)
                .only_if(|store| {
                    store.door.state == DoorState::Closed
                    && store.duration_in_state.elapsed() > Duration::from_secs(5)
                })
        .state(States::Locking)
            .on(Event::Step)
                .go_to(States::Locked)
                .only_if(|store| store.lock.state == LockState::Locked)
        .build()
        .unwrap();
        info!("Created state machine");

        std::thread::Builder::new()
            .stack_size(6000)
            .spawn_scoped(scope, || loop {
                while let Ok(event) = mqtt_conn.next() {
                    let payload = event.payload();
                    match payload {
                        esp_idf_svc::mqtt::client::EventPayload::Received {
                            id,
                            topic,
                            data,
                            details,
                        } => {
                            match details {
                                esp_idf_svc::mqtt::client::Details::Complete => {

                                    let message = String::from_utf8(data.to_vec()).unwrap();
                                    info!(
                                        "Received event: {:#?}, topic: {:#?}, data: {:#?}, details: {:#?}",
                                        id, topic, message, details
                                    );


                                },
                                _ => {}
                            }
                        }
                        _ => {}
                    }
                }
            })
            .unwrap();

        state_machine
            .store
            .mqtt_client
            .subscribe(MQTT_TOPIC, QoS::AtMostOnce)?;

        info!("Subscribed to {MQTT_TOPIC}");
        std::thread::sleep(Duration::from_millis(500));
        info!("Running Event loop");
        loop {
            state_machine.store.lock.step().unwrap();
            state_machine.store.door.step().unwrap();
            state_machine.trigger(Event::Step);
            std::thread::sleep(Duration::from_millis(10));
        }
    })
}

fn connect_wifi(wifi: &mut BlockingWifi<EspWifi<'static>>) -> anyhow::Result<()> {
    wifi.set_configuration(&Configuration::Client(ClientConfiguration {
        ssid: SSID.try_into().unwrap(),
        auth_method: AuthMethod::WPA2WPA3Personal,
        password: PASSWORD.try_into().unwrap(),
        ..Default::default()
    }))?;

    wifi.start()?;
    info!("Wifi started");

    info!("Connecting WiFi...");
    wifi.connect()?;
    info!("Wifi connected");

    wifi.wait_netif_up()?;
    info!("Wifi netif up");

    Ok(())
}
