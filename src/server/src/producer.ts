import { connect } from "mqtt"

const client = connect("mqtt://localhost:1883");

const clientId = `mqtt_client_${Math.random().toString(16).slice(3)}`;

client.on("connect", () => {
  console.log(`Connected to MQTT broker with client ID: ${clientId}`);

  // Publish messages to the "hello" topic every 5 seconds
  setInterval(() => {
    const message = `Hello from ${clientId} at ${new Date().toISOString()}`;
    client.publish("hello", message, { qos: 1 }, (error) => {
      if (error) {
        console.error(`Error publishing message: ${error}`);
      } else {
        console.log(`Published message: ${message}`);
      }
    });
  }, 5000);
});

client.on("error", (error) => {
  console.error(`MQTT error: ${error}`);
});