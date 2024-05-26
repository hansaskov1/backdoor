import { connect } from "mqtt"

const client = connect("mqtt://localhost:1883");

client.on("connect", () => {
  client.subscribe("B3E2/command", (err) => {
    if (!err) {
      console.log("Subscribed to 'command' topic");
    }
  });

  client.subscribe("B3E2/status", (err) => {
    if (!err) {
      console.log("Subscribed to 'status' topic");
    }
  });
});

client.on("message", (topic, message) => {
  if (topic === "B3E2/command") {
    console.log(`Received message on 'command' topic: ${message.toString()}`);
  }

  if (topic === "B3E2/status") {
    console.log(`Received message on 'status' topic: ${message.toString()}`);
  }
});