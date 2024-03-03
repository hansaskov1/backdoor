#include <string>

#include "machine.h"
#include "state.h"
#include "transition.h"
#include "statemachine.h"

class StateMachine {
    Machine machine;
    State currentState;
    Transition currentTransition;

    public:
        // StateMachine() {
		//     this->machine;
	    // }

        Machine build() {
            machine.setInitialState(machine.getStates()[0]);
            return machine;
        }

        StateMachine& state(std::string name) {
            currentState = machine.getState(name);
            if (currentState.getName() != name) {
                currentState = State(name);
                machine.addState(currentState);
            }
            return *this;
        }

        StateMachine& state(std::string name) {
            currentState = machine.getState(name);
            if (currentState.getName() != name) {
                currentState = State(name);
                machine.addState(currentState);
            }
            return *this;
        }

        StateMachine& initial() {
            machine.setInitialState(currentState);
            return *this;
        }

        StateMachine& when(std::string name) {
            currentTransition = Transition(name);
            currentState.addTransition(currentTransition);
            return *this;
        }

        StateMachine& to(std::string targetName) {
            bool stateExist = machine.stateExists(targetName);
            if (!stateExist) {
                State targetState = State(targetState);
                machine.addState(targetState);
            }

            State targetState = machine.getState(targetName);
            currentTransition.setTarget(targetState);
            return *this;
        }

        StateMachine& condition(std::string name) {
            machine.setCondition(name,false);
            return *this;
        }

        StateMachine& set(std::string name, int i) {
            currentTransition.setOperation(name, i);
            return *this;
        }

        StateMachine& lockCondition(std::string sensor, bool state) {
            currentTransition.lockCondition(sensor,state);
            return *this;
        }

        StateMachine& doorCondition(std::string sensor, bool state) {
            currentTransition.doorCondition(sensor,state);
            return *this;
        }
};