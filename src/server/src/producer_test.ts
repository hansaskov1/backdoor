import { getRandomSeed } from 'bun:jsc';
import { connect } from 'mqtt';

const client = connect("mqtt://localhost:8883", {
  username: 'backdoor',
  password: '1234'
});

const clientId = `mqtt_client_${Math.random().toString(16).slice(3)}`;

client.on('connect', () => {
	console.log(`Connected to MQTT broker with client ID: ${clientId}`);

	setInterval(() => {
		let count = Math.random() * 100;
		let message = "OpenDoor";
		
		client.publish('B3E2/command', message, { qos: 1 }, error => {
			if (error) {
				console.log(`error ${error}`);
			} else {
				console.log(`published message ${message}`);
			}
		});
	}, 5000);
});
