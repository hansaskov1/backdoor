import { connect } from "mqtt";
import { stdin, stdout } from "process";

const client = connect("mqtt://localhost:1883");

const clientId = `mqtt_client_${Math.random().toString(16).slice(3)}`;

client.on("connect", () => {
  console.log(`Connected to MQTT broker with client ID: ${clientId}`);

  // Listen for the "data" event on stdin (user input)
  stdin.setEncoding("utf8");
  stdin.on("data", (key) => {
    const keyString = key.toString().trim().toLowerCase(); // Convert input to lowercase

    if (keyString === "go") {
      // Publish "OpenDoor" message to the "hello" topic
      client.publish("hello", "OpenDoor", { qos: 1 }, (error) => {
        if (error) {
          console.error(`Error publishing message: ${error}`);
        } else {
          console.log(`Published message: OpenDoor`);
        }
      });
    }
  });
});

client.on("error", (error) => {
  console.error(`MQTT error: ${error}`);
});