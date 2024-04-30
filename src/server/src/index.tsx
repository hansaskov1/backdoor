import { Elysia, t } from 'elysia';
import { html } from '@elysiajs/html';
import { BaseHtml } from './base';
import { connect } from 'mqtt';
import { jwt } from "@elysiajs/jwt";
import { Logged, Login } from "./base";
import { db } from './db/sqlite';
import * as schema from './db/schema';
import { eq } from 'drizzle-orm/sql';


type EnumState = "locked" | "unlocked" | "locking" | "unlocking"
let secondsLeft = 9;
const clientId = `mqtt_client_${Math.random().toString(16).slice(3)}`;

const client = connect('mqtt://192.168.45.62:1883');
client.on('connect', () => {
    client.subscribe('hello', err => {
        if (!err) {
            console.log("Subscribed to 'hello' topic");
        }
    });
});



const CountdownMessage = ({ count }: { count: number }) => (
    <p id="message">
        Time to lock: {count}
    </p>
)

const EmptyMessage = () => (
    <p id="message">
       
    </p>
)

const State = ({ state }: { state: EnumState }) => (
    <p id="state">
        Current state: {state}
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
    .get("/", async ({ set, jwt, cookie: { auth } }) => {
        const authCookie = await jwt.verify(auth.value);

        if (authCookie) {
            set.redirect = "/home"
            return
        }

        return <Login />;
    })
    .post(
        "/login",
        async ({ jwt, body, set, cookie: { auth } }) => {
            const { password, username } = body;

            const user = db.select().from(schema.users).where(eq(schema.users.username, username)).get()

            if (user && (await Bun.password.verify(password, user.password))) {
                const token = await jwt.sign({ username, apartment: user.apartment });

                auth.set({
                    value: token,
                    httpOnly: true,
                });

                set.headers = {
                    "Hx-redirect": "/home", // Redirect to home page after successful login
                };
                set.status = "Accepted"
            }
            set.status = "Unauthorized"
        },
        {
            body: t.Object({
                username: t.String(),
                password: t.String(),
            }),
        }
    )
    .get("/logout", ({ redirect, cookie: { auth } }) => {
        auth.remove();
        return redirect("/");
    })
    .get('/home', async ({ redirect, jwt, cookie: { auth } }) => {
        const authCookie = await jwt.verify(auth.value);
        if (!authCookie) {
            return redirect("/"); // Redirect to login page if user is not authenticated
        }
        const username = authCookie.username.toString();
        const apartment = authCookie.apartment ? authCookie.apartment.toString() : undefined;
        return (
            <BaseHtml username={username} apartment={apartment}>
                <div
                    id="countdown"
                    hx-ext="ws"
                    ws-connect="/ws"
                    hx-trigger="click from:#command"
                >
                    <State state='locked' />
                    <EmptyMessage/>
                </div>
                <div>
                    <button
                        id="command"
                        class="btn btn-primary py--6 px-12 text-4xl"
                        hx-post="/send_command"
                        hx-swap="none"
                        hx-trigger="click"
                    >
                        Unlock Door
                    </button>
                </div>
            </BaseHtml>
        );
    })
    .ws('/ws', {
        open(ws) {
            console.log('WebSocket connection opened');

            // When a message is recieved from MQTT do something. 
            client.on('message', (topic, message, packet) => {
                console.log(
                    'Received Message: ' + message.toString() + ' On topic: ' + topic
                );
                switch (message.toString().toLowerCase()) {
                    case 'locked':
                        ws.send(<State state='locked' />)
                        break;
                    case 'unlocking':
                        ws.send(<State state='unlocking' />)
                        break;
                    case 'locking': 
                        ws.send(<State state="locking" />)
                        secondsLeft=9;
                        break;
                    case 'unlocked':
                        ws.send(<State state='unlocked' />)

                        if (secondsLeft!=0){
                            const interval = setInterval(() => {
                                ws.send(<CountdownMessage count={secondsLeft} />)
                                secondsLeft -= 1
                                console.log("Send interval")
                            }, 1000)
                        
                            setTimeout(() => {
                                ws.send(<EmptyMessage/>)
                                clearInterval(interval)
                            }, 10000)
                        }
                        break;
                    default:
                     //   console.log('message not important');
                }
            });
        },
    })
    .post('/send_command', () => {
        publishMessage('OpenDoor'); // Publish "OpenDoor" command
    });


function publishMessage(command: string) {
    console.log("Publishing Opendoor")
    client.publish('hello', command, { qos: 1 }, error => {
        if (error) {
            console.error(`Error publishing message: ${error}`);
        } else {
            console.log(`Published message: ${command}`);
        }
    });
}

app.listen(3000)