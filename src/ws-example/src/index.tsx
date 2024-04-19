import { html } from "@elysiajs/html";
import { Elysia } from "elysia";
import { BaseHtml } from "./base";

const Message = ({ count }: { count: number }) => (
	<p id="message">
		Hello person number {count}
	</p>
)

const app = new Elysia()
	.use(html())
	.get('/', ({ html }) => {
		return html(
			<BaseHtml>
				<div hx-ext="ws" ws-connect="/ws">
					<Message count={0} />
				</div>
			</BaseHtml>
		)
	}
	)
	.ws('/ws', {
		open(ws) {
			console.log('WebSocket connection opened');
			let count = 0;
			const interval = setInterval(() => {
				ws.send(<Message count={count} />);
				count++;
			}, 1000);
		},
	}).listen(3000);


console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
