#ifndef STATE_H
#define STATE_H

#include <string>
#include <vector>
#include "transition.h"

class State {
    std::string name;
    std::vector<Transition> transitions;

    public:
        State(std::string name);
        
        std::string getName();

        std::string setName(std::string name);

        void addTransition(Transition transition);

        std::vector<Transition> getTransitions();
};

#endif