//! Blinks an LED
//!
//! This assumes that a LED is connected to GPIO4.
//! Depending on your target and the board you are using you should change the pin.
//! If your board doesn't have on-board LEDs don't forget to add an appropriate resistor.
//!

use esp_idf_hal::delay::FreeRtos;
use esp_idf_hal::gpio::*;
use esp_idf_hal::peripherals::Peripherals;

fn main() -> anyhow::Result<()> {
    esp_idf_hal::sys::link_patches();

    esp_idf_svc::wifi::

    let peripherals = Peripherals::take()?;
    let mut led = PinDriver::output(peripherals.pins.gpio4)?;
    let mut button = PinDriver::input(peripherals.pins.gpio33)?;


    let mut prev_state = false;

    button.set_pull(Pull::Down)?;

    loop {
        FreeRtos::delay_ms(10);
        let current_state = button.is_high();

        if prev_state != current_state && current_state == true {
            led.toggle()?;
        } 

        prev_state = current_state
    }
}