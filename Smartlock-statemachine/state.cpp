#include <string>
#include <vector>
#include "transition.h"
#include "state.h"

class State {
    std::string name;
    std::vector<Transition> transitions;

    public:
        State(std::string name) {
            this->name = name;
        }

        std::string getName() {
            return this->name;
        }

        std::string setName(std::string name) {
            this->name = name;
        }

        void addTransition(Transition transition) {
            transitions.push_back(transition);
        }

        std::vector<Transition> getTransitions() {
            return transitions;
        }

};