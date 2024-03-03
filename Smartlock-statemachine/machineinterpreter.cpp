#include <string>
#include <vector>
#include "machine.h"
#include "state.h"
#include "transition.h"

class MachineInterpreter {
    Machine m;
    State currentState;

    public:
        void run(Machine m) {
            this->m = m;
            currentState = m.getInitialState();
        }

        State getCurrentState() {
            return currentState;
        }

        bool getState(std::string name) {
            return m.getCondition(name);
        }

        bool canTransition(Transition transition) {
            if (!transition.isConditional()) {
                return true;
            }
            if (transition.getConditionName() == "door") {
                if (m.getCondition("door") == transition.getConditionValue()) {
                    return true;
                }
            }
            if (transition.getConditionName() == "lock") {
                if (m.getCondition("lock") == transition.getConditionValue()) {
                    return true;
                }
            }
            return false;
        }

        void processEvent(std::string event) {
            std::vector<Transition> transitions = currentState.getTransitions();
            std::vector<Transition> filteredTransitions;

            for (auto& transition : transitions) {
                if (transition.getEvent() == event) {
                    filteredTransitions.push_back(transition);
                }
            }

            for (auto& transition : filteredTransitions) {
                if (canTransition(transition)) {
                    if (transition.hasOperation()) {

                    }
                    currentState = transition.getTarget();
                    break;
                }
            }

        }
};