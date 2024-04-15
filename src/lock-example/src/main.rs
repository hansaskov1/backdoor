use core::convert::TryInto;
use std::time::{Duration, Instant};
use embedded_svc::mqtt::client::Publish;
use embedded_svc::wifi::{AuthMethod, ClientConfiguration, Configuration};

use esp_idf_hal::gpio::{Gpio14, Gpio18, Gpio33, Gpio4};
use esp_idf_hal::sys::EspError;
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
    Step
}

struct Store<'a> {
    lock: Lock<'a>,
    door: Door<'a>,
    duration_in_state: Instant,
}


// NOTICE: Change this to your WiFi network SSID
const SSID: &str = "hansaskov";
const PASSWORD: &str = "hansaskov";

// NOTICE: Change this to your MQTT broker URL, make sure the broker is on the same network as you
const MQTT_URL: &str = "mqtt://192.168.112.193:1883";
const MQTT_TOPIC: &str = "hello";

fn main() -> anyhow::Result<()> {
    esp_idf_svc::sys::link_patches();
    EspLogger::initialize_default();

    let peripherals = Peripherals::take()?;
    let sys_loop = EspSystemEventLoop::take()?;
    let nvs = EspDefaultNvsPartition::take()?;

    let mut lock: Lock = Component::new(peripherals.pins.gpio18, peripherals.pins.gpio33)?;
    let mut door: Door = Component::new(peripherals.pins.gpio4, peripherals.pins.gpio14)?;

    // Configure Wifi
    let mut wifi = BlockingWifi::wrap(
        EspWifi::new(peripherals.modem, sys_loop.clone(), Some(nvs))?,
        sys_loop,
    )?;

    // Establish connection to WiFi network
    connect_wifi(&mut wifi)?;

    // Configure MQTT client
    info!("About to start the MQTT client");
    let (mut mqtt_client, mut mqtt_conn) = EspMqttClient::new(
        MQTT_URL,
        &MqttClientConfiguration::default() ,
    )?;

    // Run event loop
    run(&mut mqtt_client, &mut mqtt_conn, MQTT_TOPIC, lock, door)?;
    Ok(())
}


fn run(
    client: &mut EspMqttClient<'_>,
    connection: &mut EspMqttConnection,
    topic: &str,
    lock: Lock,
    door: Door
) -> Result<(), EspError> {
    std::thread::scope(|scope| {
        let message = "Hello from esp!";
        let message_bytes = message.as_bytes();
    
        // Values will be accesable within the state machine.
        let store = Store {
            lock,
            door, 
            duration_in_state: Instant::now(),
        };

        let global_action = |store: &mut Store, state: &States, _: &Event| {
            // Reset the duration in state.
            store.duration_in_state = Instant::now();
    
            // Log when the state changes
            log::info!("State: {:?}", state);
        };
    
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

        std::thread::Builder::new()
            .stack_size(6000)
            .spawn_scoped(scope, || loop {
                while let Ok(_event) = connection.next() {}
            })
            .unwrap();

        client.subscribe(topic, QoS::AtMostOnce)?;
        std::thread::sleep(Duration::from_millis(500));

        loop {
            state_machine.store.lock.step().unwrap();
            state_machine.store.door.step().unwrap();
            state_machine.trigger(Event::Step);
            client.enqueue(topic, QoS::AtMostOnce, false, message_bytes)?;
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