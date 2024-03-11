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

struct Door<'a> {
    previous_reading: bool,
    state: DoorState,
    led: PinDriver<'a, Gpio4, Output>,
    button: PinDriver<'a, Gpio14, Input>,
}

impl<'a> Door<'a> {
    pub fn new() -> anyhow::Result<Self> {
        let peripherals = Peripherals::take()?;
        let led = PinDriver::output(peripherals.pins.gpio4)?;
        let mut button = PinDriver::input(peripherals.pins.gpio14)?;

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

struct Lock<'a> {
    previous_reading: bool,
    state: LockState,
    led: PinDriver<'a, Gpio18, Output>,
    button: PinDriver<'a, Gpio33, Input>,
}

impl<'a> Lock<'a> {
    pub fn new() -> anyhow::Result<Self> {
        let peripherals = Peripherals::take()?;
        let led = PinDriver::output(peripherals.pins.gpio18)?;
        let mut button = PinDriver::input(peripherals.pins.gpio33)?;

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

struct Store<'a> {
    lock: Lock<'a>,
    door_sensor: DoorState,
    duration_in_state: Instant,
}

fn main() -> anyhow::Result<()> {
    esp_idf_hal::sys::link_patches();

    let store = Store {
        lock: Lock::new()?,
        door_sensor: DoorState::Closed,
        duration_in_state: Instant::now(),
    };

    // Construct state machine.
    StateMachineBuilder::new(store, States::Locked)
        .set_global_action(|store| store.duration_in_state = Instant::now())
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
            store.door_sensor == DoorState::Closed
                && store.duration_in_state.elapsed() > Duration::from_secs(5)
        })
        .state(States::Locking)
        .on(Event::Step)
        .go_to(States::Locked)
        .only_if(|store| store.lock.state == LockState::Locked)
        .build()
        .unwrap();

    let mut lock = Lock::new()?;

    loop {
        FreeRtos::delay_ms(10);

        lock.step()?; // Change this line to use a mutable reference to `lock`
    }
}
