# Protein Tracking Agent 🍗

An AI-powered agent built with LangChain to help you track your daily protein intake. The agent estimates protein content from meal descriptions and maintains a daily log of your consumption.

## Features

- **Smart Protein Estimation**: Uses OpenAI's LLM to estimate protein from natural language meal descriptions
- **Daily Tracking**: Automatically tracks protein consumption per day with timestamps
- **Progress Monitoring**: Check your daily progress toward your protein goal
- **Complete History**: View all your consumption records across all dates
- **Entry Management**: Delete specific entries by ID when you make mistakes
- **Multi-User Support**: Database-backed user system with per-user tracking
- **Context-Aware**: Agent receives today's consumption data automatically to avoid unnecessary tool calls
- **Interactive Chat**: Natural conversation interface (Portuguese interface, but works in English too)

## Prerequisites

- Docker and Docker Compose
- OpenAI API key

## Installation

1. Create `.env` file in the root directory:
```
OPENAI_API_KEY=your-openai-api-key-here
USER_ID=1  # Optional, defaults to 1
```

2. Start the services:
```bash
docker-compose up --build
```

3. For initial setup, run migrations and generate Prisma Client:
```bash
# Run migrations
docker exec -it protein-agent-app npx prisma migrate dev --name init

# Generate Prisma Client
docker exec -it protein-agent-app npx prisma generate
```

4. (Optional) Seed with default user for development:
```bash
docker exec -it protein-agent-app npm run seed:dev
```

The application will run with hot reload enabled. Any changes to files in `src/` will automatically restart the application.

### Entering the Container

You can enter the container's shell to run commands interactively:

```bash
docker exec -it protein-agent-app sh
```

Once inside the container, you can run any npm commands directly (e.g., `npm start`, `npm test`, etc.).

## Usage

### Interactive Session

```bash
docker exec -it protein-agent-app npm start
```

Type your messages naturally. Type `exit`, `quit`, or `bye` to end the session.

**Example:**
```
You: Comi 200g de peito de frango no almoço
Agent: Ótimo trabalho! Os 200g de peito de frango forneceram aproximadamente 60 gramas de proteína...

You: Quanto de proteína me falta hoje?
Agent: Você consumiu 60 gramas até agora hoje, e ainda faltam 100 gramas para atingir sua meta diária...
```

### Single Command Mode

```bash
docker exec -it protein-agent-app npm start "I had 200g of chicken breast for lunch"
docker exec -it protein-agent-app npm start "How much protein have I had today?"
```

### Programmatic Usage

```typescript
import { createProteinAgent } from './src/index.js';
import { HumanMessage } from '@langchain/core/messages';

const agent = await createProteinAgent(1);
const response = await agent.invoke({
  messages: [new HumanMessage("Comi 150g de salmão no jantar")]
});

console.log(response.messages[response.messages.length - 1].content);
```

## How It Works

1. The agent receives your meal description as text
2. Context is automatically injected (today's consumption, user target, recent entries) to avoid unnecessary tool calls
3. The LLM estimates protein content based on food items, portion sizes, and nutritional knowledge
4. Data is stored in PostgreSQL with Prisma ORM (repository pattern with services layer)
5. You can query progress at any time - the agent has immediate access to today's data

## Project Structure

```
src/
├── agent/proteinAgent.ts          # Main agent configuration
├── tools/proteinTools.ts          # LangChain tools
├── repositories/proteinRepository.ts   # Data persistence layer
├── services/                      # Context management services
├── types/protein.ts               # TypeScript definitions
└── index.ts                       # Entry point
prisma/schema.prisma               # Database schema
```

## Scripts

Run these commands inside the Docker container using `docker exec -it protein-agent-app <command>`:

- `npm start` - Run interactive mode
- `npm run dev` - Run with watch mode (automatically running in container)
- `npm run build` - Compile TypeScript
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run seed:dev` - Seed database with default user

## Testing

The project includes comprehensive test coverage using Vitest. All tests are located in the `spec/` directory.

### Running Tests

```bash
# Run all tests once
docker exec -it protein-agent-app npm test

# Run tests in watch mode (re-runs on file changes)
docker exec -it protein-agent-app npm run test:watch

# Run tests with interactive UI
docker exec -it protein-agent-app npm run test:ui

# Run tests with coverage report
docker exec -it protein-agent-app npm run test:coverage
```

## Configuration

User-specific settings (weight, target) are stored in the database. The `USER_ID` environment variable determines which user's data to access (default: 1).

## Future Enhancements

- Voice input processing
- Image recognition for meal photos
- WhatsApp integration
- REST API endpoints
- Web frontend
- Meal suggestions based on remaining protein needs

## License

MIT
