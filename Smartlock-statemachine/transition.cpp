#include <string>
#include "state.h"
#include "transition.h"

class Transition {
    std::string event;
    //State target;

    std::string operationName;
    int operationValue;

    std::string conditionName;
    int conditionValue;

    enum OperationType { NONE, SET, INCREMENT, DECREMENT };
    enum ComparisonType { NONE, EQUALS, GREATER, LESS };

    public:
    Transition(const std::string event) {
        this->event = event;
    }
};