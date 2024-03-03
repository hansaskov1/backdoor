#include <string>
#include "machineinterpreter.h"
#include "statemachine.h"
#include "machine.h"

void init() {

}

int main() {
    Machine m = StateMachine().state("locked").initial()
                    .when("open_door").to("unlocking")


    return 0;
}