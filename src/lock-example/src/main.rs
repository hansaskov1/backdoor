use fluent_state_machine::StateMachineBuilder;
use std::time::{Duration, Instant};

use esp_idf_hal::delay::FreeRtos;
use esp_idf_hal::gpio::*;
use esp_idf_hal::peripherals::Peripherals;


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

#[derive(PartialEq, Copy, Clone)]
enum DoorState {
    Open,
    Closed,
}

impl From<bool> for DoorState {
    fn from(sensor: bool) -> Self {
        match sensor {
            true => DoorState::Closed,
            false => DoorState::Open,
        }
    }
}

// Implement the not trait so we can use the `!` operator to invert the state.
impl std::ops::Not for DoorState {
    type Output = Self;

    fn not(self) -> Self::Output {
        match self {
            DoorState::Open => DoorState::Closed,
            DoorState::Closed => DoorState::Open,
        }
    }
}


#[derive(PartialEq, Copy, Clone)]
enum LockState {
    Locked,
    Unlocked,
}

impl From<bool> for LockState {
    fn from(sensor: bool) -> Self {
        match sensor {
            true => LockState::Unlocked,
            false => LockState::Locked,
        }
    }
}

// Implement the not trait so we can use the `!` operator to invert the state.
impl std::ops::Not for LockState {
    type Output = Self;

    fn not(self) -> Self::Output {
        match self {
            LockState::Locked => LockState::Unlocked,
            LockState::Unlocked => LockState::Locked,
        }
    }
}

struct Component<'a, S, P1, P2>
where
    S: From<bool> + std::ops::Not<Output = S> + Copy,
    P1: OutputPin,
    P2: InputPin,
{
    previous_reading: bool,
    state: S,
    led: PinDriver<'a, P1, Output>,
    button: PinDriver<'a, P2, Input>,
}

impl<'a, S, P1, P2> Component<'a, S, P1, P2>
where
    S: From<bool> + std::ops::Not<Output = S> + Copy,
    P1: OutputPin,
    P2: InputPin + esp_idf_hal::gpio::OutputPin,
{
    pub fn new(led_pin: P1, button_pin: P2) -> anyhow::Result<Self> {
        let led = PinDriver::output(led_pin)?;
        let mut button = PinDriver::input(button_pin)?;

        button.set_pull(Pull::Down)?;

        Ok(Self {
            previous_reading: button.is_high(),
            state: button.is_high().into(),
            led,
            button,
        })
    }

    pub fn step(&mut self) -> anyhow::Result<()> {
        let current_reading = self.button.is_high();

        if self.previous_reading != current_reading && current_reading == true {
            self.led.toggle()?;
            self.state = !self.state;
        }

        self.previous_reading = current_reading;

        Ok(())
    }
}


type Lock<'a> = Component<'a, LockState, Gpio18, Gpio33>;
type Door<'a> = Component<'a, DoorState, Gpio4, Gpio14>;



struct Store<'a> {
    lock: Lock<'a>,
    door: Door<'a>,
    duration_in_state: Instant,
}

fn main() -> anyhow::Result<()> {
    esp_idf_hal::sys::link_patches();

    let peripherals = Peripherals::take()?;

    let store = Store {
        lock: Component::new(peripherals.pins.gpio18, peripherals.pins.gpio33)?,
        door: Component::new(peripherals.pins.gpio4, peripherals.pins.gpio14)?,
        duration_in_state: Instant::now(),
    };

    // Construct state machine.
    let mut state_machine = StateMachineBuilder::new(store, States::Locked)
        .set_global_action(|store| {
            store.duration_in_state = Instant::now();
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

    loop {
        FreeRtos::delay_ms(10);

        state_machine.store.lock.step()?;
        state_machine.store.door.step()?;


    }
}
