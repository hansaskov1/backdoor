#include <string>
#include <vector>
#include <unordered_map>
#include <stdexcept>

#include "state.h"
#include "machine.h"

class Machine {
    std::vector<State> states;
    State initialState;
    std::unordered_map<std::string, bool> conditions;

    public:
        void addState(State state) {
            states.push_back(state);
        }

        std::vector<State> getStates() {
            return states;
        }

        void setInitialState(State state) {
            this->initialState = state;
        }

        State getInitialState() {
            return initialState;
        }

        bool stateExists(std::string name) {
            for (State& state : states) {
                if (state.getName() == name)
                {
                    return true;
                }
            }
            return false;
        }

        //Only call getState if state exists, check with stateExists first
        State& getState(std::string name) {
            for (State& state : states) {
                if (state.getName() == name)
                {
                    return state;
                }
            }
        }

        void setCondition(std::string name, bool value) {
            conditions[name] = value;
        }

        bool getCondition(std::string name) {
            return conditions[name];
        }

        int numberOfConditions() {
            int i = 0;
            for (const auto& pair : conditions) {
                i++;
            }
            return i;
        }
};