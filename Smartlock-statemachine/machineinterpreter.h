#ifndef MACHINEINTERPRETER_H
#define MACHINEINTERPRETER_H

#include <string>
#include <vector>
#include "machine.h"
#include "state.h"
#include "transition.h"

class MachineInterpreter {
    Machine m;
    State currentState;

    public:
        void run(Machine m);

        State getCurrentState();

        bool getState(std::string name);

        bool canTransition(Transition transition);

        void processEvent(std::string event);
};

#endif