import { Elysia, t } from 'elysia';
import { html } from '@elysiajs/html';
import { BaseHtml } from './base';
import { connect } from 'mqtt';
import { stdin, stdout } from 'process';

enum State {
	locked,
	unlocked,
}

let currentState = State.locked;

const clientId = `mqtt_client_${Math.random().toString(16).slice(3)}`;

const client = connect('mqtt://localhost:1883');

const app = new Elysia()
	.use(html())
	.get('/', () => {
		return (
			<BaseHtml>
				<div
					id="state"
					hx-get="/update-state"
					hx-trigger="every 2 seconds"
				>
					Hello
				</div>
				<div>
					<button
						id="command"
						class="btn btn-primary"
						hx-post="/send_command"
						hx-trigger="click"
					>
						Unlock Door
					</button>
				</div>
			</BaseHtml>
		);
	})
	.get('update-state', () => {
		return updateState();
	})
	.post('send_command', () => {
		publishMessage();
		return (
			<button id="command" hx-post="/send_command" hx-trigger="click">
				Unlock Door
			</button>
		);
	});

function updateState() {
	if (currentState === State.locked) {
		return (
			<div id="state" hx-get="/update-state" hx-trigger="every 2 seconds">
				Locked
			</div>
		);
	} else {
		return (
			<div id="state" hx-get="/update-state" hx-trigger="every 2 seconds">
				Unlocked
			</div>
		);
	}
}

function connectToBroker() {
	client.on('error', err => {
		console.log('Error: ', err);
		client.end();
	});

	client.on('reconnect', () => {
		console.log('Reconnecting...');
	});

	client.on('connect', () => {
		client.subscribe('hello', err => {
			if (!err) {
				console.log("Subscribed to 'hello' topic");
			}
		});
	});

	// Received
	client.on('message', (topic, message, packet) => {
		console.log(
			'Received Message: ' + message.toString() + ' On topic: ' + topic
		);
		switch (message.toString().toLowerCase()) {
			case 'locked':
				currentState = State.locked;
				break;
			case 'unlocked':
				currentState = State.unlocked;
				break;
			default:
				console.log('message not important');
		}
	});
}

function publishMessage() {
	client.publish('hello', 'OpenDoor', { qos: 1 }, error => {
		if (error) {
			console.error(`Error publishing message: ${error}`);
		} else {
			console.log(`Published message: OpenDoor`);
		}
	});
}

const start = () => {
	connectToBroker();
	app.listen(3000);
	console.log(
		`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
	);
};

start();
