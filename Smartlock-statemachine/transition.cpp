#include <string>
#include "state.h"
#include "transition.h"

class Transition {
    std::string event;
    State target = State("");

    std::string operationName;
    int operationValue;

    std::string conditionName;
    bool conditionValue;

    enum OperationType { NONE_OP, SET };
    enum ConditionType { NONE_CON, LOCK, DOOR };

    OperationType operationType = NONE_OP;
    ConditionType conditionType = NONE_CON;

    public:
        Transition(std::string event) {
            this->event = event;
        }

        std::string getEvent() {
            return event;
        }

        State getTarget() {
            return target;
        }

        void setTarget(State target) {
            this->target = target;
        }

        void setOperation(std::string name, int i) {
            this->operationName = name;
            this->operationValue = i;
            this->operationType = SET;
        }

        bool hasOperation() {
            if (operationType != NONE_OP) return true;
            return false;  
        }

        std::string getOperationName() {
            return this->operationName;
        }

        int getOperationValue() {
            return this->operationValue;
        }

        void lockCondition(std::string sensor, bool state) {
            this->conditionName = sensor;
            this->conditionValue = state;
            this->conditionType = LOCK;
        }

        void doorCondition(std::string sensor, bool state) {
            this->conditionName = sensor;
            this->conditionValue = state;
            this->conditionType = DOOR;
        }

        bool isConditional() {
            if (conditionType != NONE_CON) return true;
            return false;
        }

        ConditionType getConditionType() {
            return this->conditionType;
        }

        std::string getConditionName() {
            return this->conditionName;
        }
        
        bool getConditionValue() {
            return this->conditionValue;
        }
};