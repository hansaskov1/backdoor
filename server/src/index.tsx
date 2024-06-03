import { Elysia, t } from 'elysia';
import { html } from '@elysiajs/html';
import { BaseHtml } from './base';
import { connect } from 'mqtt';
import { jwt } from "@elysiajs/jwt";
import { Login } from "./base";
import { db } from './db/sqlite';
import * as schema from './db/schema';
import { eq } from 'drizzle-orm/sql';


type EnumState = "locked" | "unlocked" | "locking" | "unlocking" | "error"
let secondsLeft = 9;
const clientId = `mqtt_client_${Math.random().toString(16).slice(3)}`;
console.log(db.select().from(schema.users).all())

const client = connect('mqtt://localhost:8883', {
    username: 'backdoor',
    password: '1234'
});

client.on('connect', () => {
    client.subscribe('B3E2/command', err => {
        if (!err) {
            console.log("Subscribed to 'B3E2/command' topic");
        }
    });

    client.subscribe('B3E2/status', err => {
        if (!err) {
            console.log("Subscribed to 'B3E2/status' topic");
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

const ErrorMessage = () => (
    <p id="message">
        error
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

        /*if (authCookie) {
            set.redirect = "/home"
            return
        }*/

        return <Login />;
    })
    .post(
        "/login",
        async ({ jwt, body, set, cookie: { auth } }) => {
            const { password, username } = body;

            const user = db.select().from(schema.users).where(eq(schema.users.username, username)).get()

            if (user && (await Bun.password.verify(password, user.password))) {
                const token = await jwt.sign({ username, apartment: user.apartment, role: user.role });

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
        return <Login />;
    })
    .get('/home', async ({ redirect, jwt, cookie: { auth } }) => {
        const authCookie = await jwt.verify(auth.value);
        if (!authCookie) {
            return redirect("/"); // Redirect to login page if user is not authenticated
        }
    
        const username = authCookie.username.toString();
        const apartment = authCookie.apartment ? authCookie.apartment.toString() : undefined;
        const role = authCookie.role.toString();
    
        const roleComponents = {
            resident: (
                <>
                    <BaseHtml username={username} apartment={apartment} role={role}>
                        <div id="countdown" hx-ext="ws" ws-connect="/ws" hx-trigger="click from:#command">
                            <State state='locked' />
                            <EmptyMessage />
                        </div>
                        <div>
                            <button class="btn btn-primary py--6 px-12 text-2xl mb-3" hx-post="/send_command" hx-swap="none" hx-trigger="click">
                                Unlock Main door
                            </button>
                            <button class="btn btn-primary py--6 px-12 text-2xl mb-3" hx-post="/send_command" hx-swap="none" hx-trigger="click">
                                Unlock Back door
                            </button>
                            <button class="btn btn-primary py--6 px-12 text-2xl mb-3" hx-post="/send_command" hx-swap="none" hx-trigger="click">
                                Unlock Garage door
                            </button>
                        </div>
                    </BaseHtml>
                </>
            ),
            admin: (
                <>
                    <BaseHtml username={username} apartment={apartment} role={role}>
                        <div id="countdown" hx-ext="ws" ws-connect="/ws" hx-trigger="click from:#command">
                            <State state='locked' />
                            <EmptyMessage />
                        </div>
                        <div>
                            <button class="btn btn-primary py--6 px-12 text-2xl mb-3" hx-post="/send_command" hx-swap="none" hx-trigger="click">
                                Unlock Main door
                            </button>
                            <button class="btn btn-primary py--6 px-12 text-2xl mb-3" hx-post="/send_command" hx-swap="none" hx-trigger="click">
                                Unlock Back door
                            </button>
                            <button class="btn btn-primary py--6 px-12 text-2xl mb-3" hx-post="/send_command" hx-swap="none" hx-trigger="click">
                                Unlock Garage door
                            </button>
                            <button class="btn btn-primary py--6 px-12 text-2xl mb-3" hx-post="/send_command" hx-swap="none" hx-trigger="click">
                                Unlock Service door
                            </button>
                        </div>
                    </BaseHtml>
                </>
            ),
            service_personnel: (
                <>
                    <BaseHtml username={username} apartment={apartment} role={role}>
                        <div id="countdown" hx-ext="ws" ws-connect="/ws" hx-trigger="click from:#command">
                            <State state='locked' />
                            <EmptyMessage />
                        </div>
                        <div>
                            <button class="btn btn-primary py--6 px-12 text-2xl" hx-post="/send_command" hx-swap="none" hx-trigger="click">
                                Unlock Service door
                            </button>
                        </div>
                    </BaseHtml>
                </>
            ),
            default: (
                <>
                    <BaseHtml username={username} apartment={apartment} role={role}>
                        <div id="countdown" hx-ext="ws" ws-connect="/ws" hx-trigger="click from:#command">
                            <State state='locked' />
                            <EmptyMessage />
                        </div>
                        <div>
                            <button class="btn btn-primary py--6 px-12 text-2xl" hx-post="/send_command" hx-swap="none" hx-trigger="click">
                                Unlock door
                            </button>
                        </div>
                    </BaseHtml>
                </>
            )
        } as {
            [key: string]: JSX.Element;
        };
        
        const content = roleComponents[role] || roleComponents.default;
        return content;
        
    })
    
    .ws('/ws', {
        open(ws) {
            console.log('WebSocket connection opened');
            //let heartbeatTimer : Timer; // Variable to hold the heartbeat timer
        
            // Function to handle the heartbeat timeout
            const handleHeartbeatTimeout = () => {
                // Send an error message to the UI if no new message received within 15 seconds
                ws.send(<ErrorMessage/>);
            };
 
            client.on('message', (topic, message, packet) => {

                if (topic === "B3E2/command") {
                    console.log(`Received message on 'B3E2/command' topic: ${message.toString()}`);
    
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
                            //console.log('unidentified message');
                    }
                }

                if (topic === "B3E2/status") {
                    console.log(`Received message on 'B3E2/status' topic: ${message.toString()}`)
                    if (message.toString() === "ESP32 Disconnected with ID: Building 3 ESP 2") {
                        ws.send(<State state="error" />)
                    }
                }

            });
        },
    })
    .post('/send_command', () => {
        publishMessage('OpenDoor'); // Publish "OpenDoor" command
    });


function publishMessage(command: string) {
    console.log("Publishing Opendoor")
    client.publish('B3E2/command', command, { qos: 1 }, error => {
        if (error) {
            console.error(`Error publishing message: ${error}`);
        } else {
            console.log(`Published message: ${command}`);
        }
    });
}

app.listen(3000)