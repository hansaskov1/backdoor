
#[derive(PartialEq, Copy, Clone)]
pub enum DoorState {
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
pub enum LockState {
    Locked,
    Unlocked,
}

impl From<bool> for LockState {
    fn from(sensor: bool) -> Self {
        match sensor {
            true => LockState::Locked,
            false => LockState::Unlocked,
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

