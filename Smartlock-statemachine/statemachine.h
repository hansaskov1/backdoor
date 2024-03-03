#ifndef STATEMACHINE_H
#define STATEMACHINE_H

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

        Machine build();

        StateMachine& state(std::string name);

        StateMachine& state(std::string name);

        StateMachine& initial();

        StateMachine& when(std::string name);

        StateMachine& to(std::string targetName);

        StateMachine& condition(std::string name);

        StateMachine& set(std::string name, int i);

        StateMachine& lockCondition(std::string sensor, bool state);

        StateMachine& doorCondition(std::string sensor, bool state);
};

#endif