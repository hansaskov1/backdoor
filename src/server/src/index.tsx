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

let countdownStarted = false;

const app = new Elysia()
	.use(html())
	.get('/', ({html}) => {
		return (
			<BaseHtml>
				<div
					id="state"
					hx-get="/update-state"
					hx-trigger="every 2 seconds"
				>
				</div>
				<div 
					id="countdown" 
					hx-get="/countdown" 
					hx-trigger="state:unlocked from:body"
				>
				</div>
				<div>
					<button
						id="command"
						class="btn btn-primary py--6 px-12 text-4xl"
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
	.get('countdown', () => {

	})
	.post('send_command', () => {
		publishMessage('OpenDoor'); // Publish "OpenDoor" command
		let timeTaken = Math.random() * 1000;
		console.log("Time taken: ", timeTaken);
		setTimeout(() => {
			// Update the state immediately after sending the command
			currentState = State.unlocked;
			startCountdown(10); // Start the countdown from 10 seconds
		}, timeTaken); // Wait for a random time before updating the state
	
		setTimeout(() => {
			// go back to the locked state after 10 s
			currentState = State.locked;
			publishMessage('CloseDoor'); // Publish "CloseDoor" command
		}, 10000);
	
		return (
			<button id="command" hx-post="/send_command" hx-trigger="click" hx-vals="true" disabled={currentState === State.unlocked}>
				Unlock Door
			</button>
		);
	});

let countdownInterval: number | Timer;

const startCountdown = (remainingTime: number) => {
    if (remainingTime >= 0) {
        console.log(`Time remaining: ${remainingTime}`);
        setTimeout(() => {
            startCountdown(remainingTime - 1);
        }, 1000); // Wait for 1 second
    } else {
        console.log("Countdown finished");
    }
};


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

function publishMessage(command: string) {
    client.publish('hello', command, { qos: 1 }, error => {
        if (error) {
            console.error(`Error publishing message: ${error}`);
        } else {
            console.log(`Published message: ${command}`);
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
