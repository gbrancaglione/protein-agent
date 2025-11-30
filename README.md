# Protein Tracking Agent 🍗

An AI-powered agent built with LangChain to help you track your daily protein intake. The agent can estimate protein content from meal descriptions and maintain a daily log of your consumption.

## Features

- **Smart Protein Estimation**: Uses OpenAI's LLM to estimate protein content from natural language meal descriptions
- **Daily Tracking**: Automatically tracks protein consumption per day with timestamps
- **Progress Monitoring**: Check your daily progress toward your protein goal
- **Complete History**: View all your consumption records across all dates
- **Entry Management**: Delete specific entries by ID when you make mistakes
- **Interactive Chat**: Natural conversation interface for easy interaction (Portuguese interface)
- **Multi-User Support**: Database-backed user system with per-user tracking
- **Context-Aware**: Agent receives today's consumption data automatically to avoid unnecessary tool calls
- **TypeScript**: Fully typed codebase for better maintainability
- **Scalable Architecture**: Built with repository pattern and services layer for easy extension (WhatsApp, API endpoints, etc.)

## Prerequisites

- Node.js 18+ 
- TypeScript 5.7+ (installed via npm)
- OpenAI API key
- PostgreSQL database (local or remote)

## Installation

1. Clone or navigate to the project directory:
```bash
cd protein-agent
```

2. Install dependencies:
```bash
npm install
```

3. Create and edit `.env` file in the root directory with your configuration:
```
# OpenAI API
OPENAI_API_KEY=your-openai-api-key-here

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/protein_agent?schema=public"

# User Configuration (optional)
USER_ID=1
USER_WEIGHT_KG=80
DAILY_PROTEIN_TARGET_G=160
```

5. Set up the database:
   - Make sure PostgreSQL is running
   - Create a database (or use an existing one):
     ```bash
     createdb protein_agent
     # Or using psql:
     # psql -U postgres
     # CREATE DATABASE protein_agent;
     ```

6. Generate Prisma Client and run migrations:
```bash
npm run prisma:generate
npm run prisma:migrate
```

7. (Optional) Seed the database with a default user for development:
```bash
npm run seed:dev
```

This creates a default user "Gustavo" with weight 80kg and target 160g if it doesn't already exist.

## Usage

### Interactive Session (Recommended)

Start an interactive chat session with the agent:

```bash
npm start
```

This will start an interactive session where you can:
- Ask questions about your protein intake
- Record meals naturally
- Check your daily progress
- Have a free-flowing conversation

Type `exit`, `quit`, or `bye` to end the session, or press `Ctrl+C`.

**Example session:**
```
🍗 Protein Tracking Agent
==========================

User: Gustavo (ID: 1)
Daily target: 160g
Your weight: 80kg

Initializing agent...
✅ Agent ready!

Starting interactive session...
Type your messages below. Type "exit", "quit", or "bye" to end the session.

You: Comi 200g de peito de frango no almoço
Agent: Ótimo trabalho no seu almoço! Os 200g de peito de frango forneceram aproximadamente 60 gramas de proteína...

You: Quanto de proteína me falta hoje?
Agent: Você consumiu 60 gramas até agora hoje, e ainda faltam 100 gramas para atingir sua meta diária...

You: Mostre todo meu histórico de consumo
Agent: Aqui está seu histórico completo de consumo em todos os dias...

You: Delete a entrada com ID 42
Agent: Entrada deletada com sucesso...

You: exit
👋 Goodbye! Keep up the great work with your protein goals!
```

**Note:** The agent interface is in Portuguese. You can interact with it in Portuguese or English.

### Single Command Mode

You can also run a single command without entering interactive mode:

```bash
npm start "I had 200g of chicken breast for lunch"
```

```bash
npm start "How much protein have I had today?"
```

### Programmatic Usage

```typescript
import { createProteinAgent } from './src/index.js';
import { HumanMessage } from '@langchain/core/messages';

// Create agent for user ID 1 (default)
const agent = await createProteinAgent(1);

const response = await agent.invoke({
  messages: [new HumanMessage("Comi 150g de salmão no jantar")]
});

console.log(response.messages[response.messages.length - 1].content);
```

**Note:** The `createProteinAgent` function requires a `userId` parameter to support multi-user functionality.

## Project Structure

```
protein-agent/
├── src/
│   ├── agent/
│   │   └── proteinAgent.ts       # Main agent configuration
│   ├── tools/
│   │   └── proteinTools.ts       # LangChain tools for recording and querying
│   ├── storage/
│   │   └── proteinRepository.ts  # Data persistence layer (Prisma/PostgreSQL)
│   ├── services/
│   │   ├── contextService.ts     # Context aggregation service
│   │   ├── userContextService.ts # User-related context
│   │   └── proteinContextService.ts # Protein consumption context
│   ├── types/
│   │   └── protein.ts            # TypeScript type definitions
│   ├── lib/
│   │   └── prisma.ts             # Prisma client configuration
│   ├── scripts/
│   │   └── seedDev.ts            # Development database seeding
│   ├── generated/
│   │   └── prisma/               # Generated Prisma client (gitignored)
│   └── index.ts                  # Entry point
├── prisma/
│   └── schema.prisma             # Prisma schema definition
├── .env                          # Environment variables
├── tsconfig.json                 # TypeScript configuration
├── prisma.config.ts              # Prisma configuration
├── package.json
└── README.md
```

## How It Works

1. **Input Processing**: The agent receives your meal description as text
2. **Context Injection**: The agent automatically receives contextual information including:
   - Today's date and consumption summary
   - User's daily target and current progress
   - Recent entries for today
   - This context is injected into the system prompt to avoid unnecessary tool calls
3. **Protein Estimation**: The LLM analyzes the description and estimates protein content based on:
   - Food items mentioned
   - Portion sizes (if specified)
   - Explicit protein amounts (when provided by the user)
   - Common nutritional knowledge
4. **Data Storage**: Protein intake is recorded with:
   - User ID (multi-user support)
   - Timestamp
   - Description
   - Estimated or explicit protein amount
   - Daily totals per user
5. **Progress Tracking**: You can query your daily progress at any time, and the agent has immediate access to today's data without making tool calls

## Data Storage

The project uses **PostgreSQL** with **Prisma ORM** for data persistence. The architecture follows a repository pattern with a services layer for context management.

### Database Schema

The database includes two main models:

**User Model:**
- `id`: Unique identifier (Int, auto-increment)
- `name`: User's name (String)
- `weight`: User's weight in kg (Float, optional)
- `target`: Daily protein target in grams (Float, optional)
- `phone`: Phone number for future integrations (String, optional)
- `createdAt`: When the user was created (DateTime)
- `updatedAt`: When the user was last updated (DateTime)

**Protein Entry Model:**
- `id`: Unique identifier (Int, auto-increment)
- `proteinGrams`: Amount of protein in grams (Float)
- `description`: Description of the meal (String)
- `timestamp`: When the meal was consumed (DateTime)
- `createdAt`: When the record was created (DateTime)
- `userId`: Foreign key to User (Int)

### Prisma Commands

- `npm run prisma:generate` - Generate Prisma Client (outputs to `src/generated/prisma`)
- `npm run prisma:migrate` - Create and apply database migrations
- `npm run prisma:migrate:deploy` - Deploy migrations (production)
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

### Development Scripts

- `npm start` - Run the agent in interactive mode (uses `tsx` to run TypeScript directly)
- `npm run dev` - Run with watch mode for development
- `npm run build` - Compile TypeScript to JavaScript
- `npm run seed:dev` - Seed database with default user (development only)

## Future Enhancements

- Voice input processing
- Image recognition for meal photos
- WhatsApp integration
- REST API endpoints
- Web frontend
- ~~Database integration (PostgreSQL/MongoDB)~~ ✅ **Done!**
- ~~Multi-user support~~ ✅ **Done!**
- Meal suggestions based on remaining protein needs
- User authentication and management

## Configuration

Edit `.env` to customize:

- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `DATABASE_URL`: PostgreSQL connection string (required)
- `USER_ID`: User ID to use for the session (default: 1)

**Note:** User-specific settings (weight, target) are stored in the database and take precedence over environment variables. The `USER_ID` environment variable determines which user's data to access

## License

MIT

