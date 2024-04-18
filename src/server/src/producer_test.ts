import { connect } from 'mqtt';

const client = connect('mqtt://localhost:1883');

const clientId = `mqtt_client_${Math.random().toString(16).slice(3)}`;

client.on('connect', () => {
	console.log(`Connected to MQTT broker with client ID: ${clientId}`);

	setInterval(() => {
		const message = `Unlocked`;
		client.publish('hello', message, { qos: 1 }, error => {
			if (error) {
				console.log(`error ${error}`);
			} else {
				console.log(`published message ${message}`);
			}
		});
	}, 5000);
});
