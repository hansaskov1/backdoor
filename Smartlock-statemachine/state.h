#ifndef STATE_H
#define STATE_H

#include <string>
#include <vector>
#include "transition.h"

class State {
    private:
        std::string name;
        std::vector<Transition> transitions;
};

#endif