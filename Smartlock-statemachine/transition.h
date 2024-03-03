#ifndef TRANSITION_H
#define TRANSITION_H

#include <string>
#include "state.h"

class Transition {
private:
    std::string event;
    State target;

    std::string operationName;
    int operationValue;

    std::string conditionName;
    int conditionValue;

    enum OperationType { NONE_OP, SET };
    enum ConditionType { NONE_COND, EQUALS, GREATER, LESS };

    OperationType operationType = NONE_OP;
    ConditionType conditionType = NONE_COND;

public:
    Transition(std::string event);

    std::string getEvent();

    State getTarget();

    void setTarget(State target);

    void setOperation(std::string name, int i);

    bool hasOperation();

    std::string getOperationName();

    int getOperationValue();

    void lockCondition(std::string sensor, bool state);

    void doorCondition(std::string sensor, bool state);

    bool isConditional();

    ConditionType getConditionType();

    std::string getConditionName();
        
    bool getConditionValue();
};

#endif