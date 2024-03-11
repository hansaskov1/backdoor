
use esp_idf_hal::gpio::*;

pub struct Component<'a, S, P1, P2>
where
    S: From<bool> + std::ops::Not<Output = S> + Copy,
    P1: OutputPin,
    P2: InputPin,
{
    previous_reading: bool,
    pub state: S,
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
        let mut led = PinDriver::output(led_pin)?;
        let mut button = PinDriver::input(button_pin)?;

        led.set_high()?;
        button.set_pull(Pull::Down)?;

        Ok(Self {
            previous_reading: led.is_set_high(),
            state: led.is_set_high().into(),
            led,
            button,
        })
    }

    pub fn step(&mut self) -> anyhow::Result<()> {
        let current_reading = self.button.is_high();

        if self.previous_reading != current_reading && current_reading == true {

            self.led.toggle()?;
            self.state = self.led.is_set_high().into();
        }

        self.previous_reading = current_reading;

        Ok(())
    }
}