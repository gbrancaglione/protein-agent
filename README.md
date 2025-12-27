# Protein Tracking Agent

AI agent that tracks daily protein intake from natural language meal descriptions.

## Setup

1. Create `.env` file:
```
OPENAI_API_KEY=your-openai-api-key-here
USER_ID=1
REDIS_URL=redis://redis:6379
AUTHENTICATION_API_KEY=your-evolution-api-key-here
SERVER_URL=http://localhost:8080
CACHE_REDIS_URI=redis://redis:6379/0
DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://protein_user:protein_password@postgres:5432/protein_agent
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

Interactive mode:
```bash
docker exec -it protein-agent-app npm start
```

Single command:
```bash
docker exec -it protein-agent-app npm start "I had 200g of chicken breast"
```

## Commands

- `npm start` - Interactive mode
- `npm test` - Run tests
- `npm run seed:dev` - Seed database
