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

- Node.js 24+
- OpenAI API key
- PostgreSQL database (local or remote)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file in the root directory:
```
OPENAI_API_KEY=your-openai-api-key-here
DATABASE_URL="postgresql://user:password@localhost:5432/protein_agent?schema=public"
USER_ID=1  # Optional, defaults to 1
```

3. Set up the database:
```bash
createdb protein_agent  # Or use existing database
npm run prisma:generate
npm run prisma:migrate
```

4. (Optional) Seed with default user for development:
```bash
npm run seed:dev
```

## Usage

### Interactive Session

```bash
npm start
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
npm start "I had 200g of chicken breast for lunch"
npm start "How much protein have I had today?"
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
├── storage/proteinRepository.ts   # Data persistence layer
├── services/                      # Context management services
├── types/protein.ts               # TypeScript definitions
└── index.ts                       # Entry point
prisma/schema.prisma               # Database schema
```

## Scripts

- `npm start` - Run interactive mode
- `npm run dev` - Run with watch mode
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
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with interactive UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
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
