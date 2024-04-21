import { Elysia, t } from 'elysia';
import { html } from '@elysiajs/html';
import { BaseHtml } from './base';
import { connect } from 'mqtt';
import { stdin, stdout } from 'process';
import { jwt } from "@elysiajs/jwt";
import { Protected, NotLogged, Logged, Login } from "./base";

enum State {
	locked,
	unlocked,
}

let currentState = State.locked;

const clientId = `mqtt_client_${Math.random().toString(16).slice(3)}`;

const client = connect('mqtt://localhost:1883');

// this is sample users, we should use a database in production
const users = [
	{
	  username: "admin",
	  password: await Bun.password.hash("admin"),
	  apartment: "2TH"
	},
	{
	  username: "user",
	  password: await Bun.password.hash("user"),
	  apartment: "4ST"
	},
	{
	  username: "simone",
	  password: await Bun.password.hash("simone"),
	  apartment: "4ST"
	},
	{
		username: "hans",
		password: await Bun.password.hash("hans"),
		apartment: "4ST"
	  }
  ];

const Message = ({ count }: { count: number }) => (
	<p id="message">
		Time to lock: {count}
	</p>
)

const app = new Elysia()
    .use(html())
    .use(
        jwt({
            name: "jwt",
            // This is a secret key, you should change it in production
            secret: "your secret",
        })
    )
    .get("/", async ({ jwt, cookie: { auth } }) => {
        const authCookie = await jwt.verify(auth.value);
        return authCookie ? <Logged /> : <Login />;
    })
    .get("/protected", async ({ jwt, cookie: { auth } }) => {
        const authCookie = await jwt.verify(auth.value);
        return authCookie ? (
            <Protected username={authCookie.username.toString()} />
        ) : (
            <NotLogged />
        );
    })
    .post(
        "/login",
        async ({ jwt, body, set, cookie: { auth } }) => {
            const { password, username } = body;

            const user = users.find((user) => user.username === username);

            if (user && (await Bun.password.verify(password, user.password))) {
                const token = await jwt.sign({ username, apartment: user.apartment });

                auth.set({
                    value: token,
                    httpOnly: true,
                });

                set.headers = {
                    "Hx-redirect": "/home", // Redirect to home page after successful login
                };
                return "Login successful!";
            }
            return "Invalid credentials";
        },
        {
            body: t.Object({
                username: t.String(),
                password: t.String(),
            }),
        }
    )
    .get("/logout", ({ set, cookie: { auth } }) => {
        auth.remove();
        set.redirect = "/";
    })
    .get('/home', async ({ jwt, cookie: { auth } }) => {
    const authCookie = await jwt.verify(auth.value);
    if (!authCookie) {
        return <Login />; // Redirect to login page if user is not authenticated
    }
    const username = authCookie.username.toString();
    const apartment = authCookie.apartment ? authCookie.apartment.toString() : undefined;
    return (
        <BaseHtml username={username} apartment={apartment}>
            <div
                id="state"
                hx-get="/update-state"
                hx-trigger="every 2 seconds"
            >
            </div>
            <div 
                id="countdown" 
                hx-ext="ws"
                ws-connect="/ws"
                hx-trigger="click from:#command"
            >
                    <Message count={10} />
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
    .ws('/ws', {
        open(ws) {
            console.log('WebSocket connection opened');
            let count = 10;
            const interval = setInterval(() => {
                if (count >= 0) {
                    ws.send(<Message count={count} />);
                    count--;
                } else {
                    clearInterval(interval); // Stop the interval when count reaches 0
                    count = 10;
                    ws.send(<Message count={count} />);
                }
            }, 1000);
        },
    })
    .listen(3000)
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
