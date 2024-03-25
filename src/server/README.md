# Elysia with Bun runtime

## Getting Started
Start by installing bun for linux, a windows beta version is also available on their website
```bash
curl -fsSL https://bun.sh/install | bash
```

Then install the required dependencies
```bash
bun install
```

## Development
To start the development server run:
```bash
bun run dev
```

Open http://localhost:3000/ with your browser to see the result.

docker run -d --hostname my-rabbit --name some-rabbit -e RABBITMQ_DEFAULT_USER=user -e RABBITMQ_DEFAULT_PASS=password rabbitmq:3-management