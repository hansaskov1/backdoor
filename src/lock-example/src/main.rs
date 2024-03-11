use fluent_state_machine::StateMachineBuilder;
use lock_example::component::Component;
use lock_example::sensor_states::{DoorState, LockState};
use std::time::{Duration, Instant};

use esp_idf_hal::delay::FreeRtos;
use esp_idf_hal::gpio::*;
use esp_idf_hal::peripherals::Peripherals;

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
    duration_in_state: Instant,
}


fn main() -> anyhow::Result<()> {
    esp_idf_hal::sys::link_patches();

    // Bind the log crate to the ESP Logging facilities
    esp_idf_svc::log::EspLogger::initialize_default();

    log::info!("Starting up!");

    let peripherals = Peripherals::take()?;

    let store = Store {
        lock: Component::new(peripherals.pins.gpio18, peripherals.pins.gpio33)?,
        door: Component::new(peripherals.pins.gpio4, peripherals.pins.gpio14)?,
        duration_in_state: Instant::now(),
    };

    // Construct state machine.
    let mut state_machine = StateMachineBuilder::new(store, States::Locked)
        .set_global_action(|store, state, _| {
            store.duration_in_state = Instant::now();
            log::info!("State: {:?}", state);
        })
        .state(States::Locked)
            .on(Event::OpenDoor)
                .go_to(States::Unlocking)
        .state(States::Unlocking)
            .on(Event::Step)
                .go_to(States::Unlocked)
                .only_if(|store| store.lock.state == LockState::Unlocked)
            .on(Event::Step)
                .go_to(States::Locked)
                .only_if(|store| store.duration_in_state.elapsed() > Duration::from_secs(10))
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


    log::info!("State: {:?}", state_machine.state);
    state_machine.trigger(Event::OpenDoor);
    

    loop {
        FreeRtos::delay_ms(10);

        state_machine.store.lock.step()?;
        state_machine.store.door.step()?;
        state_machine.trigger(Event::Step);
    }
}
