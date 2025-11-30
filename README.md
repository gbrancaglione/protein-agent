# Protein Tracking Agent 🍗

An AI-powered agent built with LangChain to help you track your daily protein intake. The agent can estimate protein content from meal descriptions and maintain a daily log of your consumption.

## Features

- **Smart Protein Estimation**: Uses OpenAI's LLM to estimate protein content from natural language meal descriptions
- **Daily Tracking**: Automatically tracks protein consumption per day with timestamps
- **Progress Monitoring**: Check your daily progress toward your protein goal
- **Complete History**: View all your consumption records across all dates
- **Entry Management**: Delete specific entries by ID when you make mistakes
- **Interactive Chat**: Natural conversation interface for easy interaction
- **Scalable Architecture**: Built with best practices for easy extension (WhatsApp, API endpoints, etc.)

## Prerequisites

- Node.js 18+ 
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

3. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

4. Edit `.env` and add your configuration:
```
# OpenAI API
OPENAI_API_KEY=your-openai-api-key-here

# User settings
USER_WEIGHT_KG=80
DAILY_PROTEIN_TARGET_G=160

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/protein_agent?schema=public"
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

Daily target: 160g
Your weight: 80kg

Initializing agent...
✅ Agent ready!

Starting interactive session...
Type your messages below. Type "exit", "quit", or "bye" to end the session.

You: I had 200g of chicken breast for lunch
Agent: Great job on your lunch! The 200g of chicken breast provided you with approximately 60 grams of protein...

You: How much protein do I have left today?
Agent: You've consumed 60 grams so far today, and you have 100 grams left to reach your daily target...

You: Show me all my consumption history
Agent: Here's your complete consumption history across all days...

You: Delete the entry with ID 1764119328942-xy40me7md
Agent: Successfully deleted the protein shake entry...

You: exit
👋 Goodbye! Keep up the great work with your protein goals!
```

### Single Command Mode

You can also run a single command without entering interactive mode:

```bash
npm start "I had 200g of chicken breast for lunch"
```

```bash
npm start "How much protein have I had today?"
```

### Programmatic Usage

```javascript
import { createProteinAgent } from './src/index.js';
import { HumanMessage } from 'langchain';

const agent = await createProteinAgent();

const response = await agent.invoke({
  messages: [new HumanMessage("I had 150g of salmon for dinner")]
});

console.log(response.messages[response.messages.length - 1].content);
```

## Project Structure

```
protein-agent/
├── src/
│   ├── agent/
│   │   └── proteinAgent.js      # Main agent configuration
│   ├── tools/
│   │   └── proteinTools.js       # LangChain tools for recording and querying
│   ├── storage/
│   │   └── proteinStorage.js     # Data persistence layer (Prisma/PostgreSQL)
│   └── index.js                  # Entry point
├── prisma/
│   └── schema.prisma             # Prisma schema definition
├── data/                         # Legacy JSON data (no longer used)
│   └── protein-consumption.json  # Old JSON storage (kept for reference)
├── .env                          # Environment variables (create from .env.example)
├── package.json
└── README.md
```

## How It Works

1. **Input Processing**: The agent receives your meal description as text
2. **Protein Estimation**: The LLM analyzes the description and estimates protein content based on:
   - Food items mentioned
   - Portion sizes (if specified)
   - Common nutritional knowledge
3. **Data Storage**: Protein intake is recorded with:
   - Timestamp
   - Description
   - Estimated protein amount
   - Daily totals
4. **Progress Tracking**: You can query your daily progress at any time

## Data Storage

The project uses **PostgreSQL** with **Prisma ORM** for data persistence. The storage layer has been migrated from JSON file storage to a proper database.

### Database Schema

The `ProteinEntry` model stores all protein consumption records:

- `id`: Unique identifier (String)
- `proteinGrams`: Amount of protein in grams (Float)
- `description`: Description of the meal (String)
- `timestamp`: When the meal was consumed (DateTime)
- `createdAt`: When the record was created (DateTime)

### Prisma Commands

- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Create and apply database migrations
- `npm run prisma:migrate:deploy` - Deploy migrations (production)
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## Future Enhancements

- Voice input processing
- Image recognition for meal photos
- WhatsApp integration
- REST API endpoints
- Web frontend
- ~~Database integration (PostgreSQL/MongoDB)~~ ✅ **Done!**
- Multi-user support
- Meal suggestions based on remaining protein needs

## Configuration

Edit `.env` to customize:

- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `USER_WEIGHT_KG`: Your weight in kg (default: 80)
- `DAILY_PROTEIN_TARGET_G`: Daily protein goal in grams (default: 160)

## License

MIT

