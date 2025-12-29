# Protein Tracking Agent

AI agent that tracks daily protein intake from natural language meal descriptions.

## Setup

1. Create `.env` file:
```
OPENAI_API_KEY=your-openai-api-key-here
DATABASE_URL=postgresql://protein_user:protein_password@postgres:5432/protein_agent
REDIS_URL=redis://redis:6379
AUTHENTICATION_API_KEY=your-evolution-api-key-here
EVOLUTION_API_BASE_URL=http://evolution-api:8080
SERVER_URL=http://localhost:8080
WEBHOOK_GLOBAL_URL=http://app:3000/webhooks
```

2. Start services:
```bash
docker-compose up --build
```

3. Initialize database:
```bash
docker exec -it protein-agent-app npx prisma migrate dev
docker exec -it protein-agent-app npx prisma generate
docker exec -it protein-agent-app npm run seed:dev
```

## Usage

Start the server:
```bash
docker exec -it protein-agent-app npm run server
```

Start the worker (in a separate terminal):
```bash
docker exec -it protein-agent-worker npm run worker
```

Or use docker-compose which starts both automatically.

## Commands

- `npm run server` - Start the webhook server
- `npm run server:dev` - Start the server in watch mode
- `npm run worker` - Start the webhook worker
- `npm run worker:dev` - Start the worker in watch mode
- `npm test` - Run tests
- `npm run seed:dev` - Seed database
