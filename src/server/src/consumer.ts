import { connect } from "mqtt"

const client = connect("mqtt://localhost:1883");

client.on("connect", () => {
  client.subscribe("hello", (err) => {
    if (!err) {
      console.log("Subscribed to 'hello' topic");
    }
  });
});

client.on("message", (topic, message) => {
  if (topic === "hello") {
    console.log(`Received message on 'hello' topic: ${message.toString()}`);
  }
});