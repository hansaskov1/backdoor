#ifndef MACHINE_H
#define MACHINE_H

#include <string>
#include <vector>
#include <unordered_map>

#include "state.h"

class Machine {
    std::vector<State> states;
    State initialState;
    std::unordered_map<std::string, bool> conditions;

    public:
        void addState(State state);

        std::vector<State> getStates();

        void setInitialState(State state);

        State getInitialState();

        bool stateExists(std::string name);

        State& getState(std::string name);

        void setCondition(std::string name, bool value);

        bool getCondition(std::string name);

        int numberOfConditions();
};

#endif