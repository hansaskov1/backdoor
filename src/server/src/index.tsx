import { Elysia, t } from 'elysia'
import { html } from '@elysiajs/html'
import { BaseHtml } from './base'

const app = new Elysia()
	.use(html())
	.get('/', () => {
		return (
		<BaseHtml >
			Hello World
		</BaseHtml>)
	})
	.ws('/ws', {
		message(ws, message) {
			ws.send(message)
		}
	})
	.listen(3000)




console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
