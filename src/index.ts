import dotenv from 'dotenv';
import readline from 'readline';
import { createProteinAgent } from './agent/proteinAgent.js';
import { HumanMessage } from 'langchain';
import contextService from './services/contextService.js';

dotenv.config();

async function main(): Promise<void> {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY is not set in environment variables.');
    console.error('Please create a .env file with your OpenAI API key.');
    process.exit(1);
  }

  // Get or create user ID (default to 1)
  const userId = process.env.USER_ID ? parseInt(process.env.USER_ID, 10) : 1;
  
  // Ensure user exists in database
  const user = await contextService.getUser(userId);

  console.log('🍗 Protein Tracking Agent');
  console.log('==========================\n');
  console.log(`User: ${user.name} (ID: ${userId})`);
  console.log(`Daily target: ${user.target || process.env.DAILY_PROTEIN_TARGET_G || 160}g`);
  if (user.weight) {
    console.log(`Your weight: ${user.weight}kg`);
  } else if (process.env.USER_WEIGHT_KG) {
    console.log(`Your weight: ${process.env.USER_WEIGHT_KG}kg`);
  }
  console.log('');

  console.log('Initializing agent...');
  const agent = await createProteinAgent(userId);
  console.log('✅ Agent ready!\n');

  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    const userInput = args.join(' ');
    console.log(`You: ${userInput}\n`);

    try {
      const response = await agent.invoke({
        messages: [new HumanMessage(userInput)]
      });

      const lastMessage = response.messages[response.messages.length - 1];
      console.log(`Agent: ${lastMessage.content}\n`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error:', errorMessage);
      if (error instanceof Error && error.stack) {
        console.error(error.stack);
      }
    }
    return;
  }

  await startInteractiveSession(agent);
}

async function startInteractiveSession(agent: Awaited<ReturnType<typeof createProteinAgent>>): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'You: '
  });

  console.log('Starting interactive session...');
  console.log('Type your messages below. Type "exit", "quit", or "bye" to end the session.\n');
  rl.prompt();

  const conversationHistory: HumanMessage[] = [];

  rl.on('line', async (input: string) => {
    const trimmedInput = input.trim();

    if (trimmedInput.toLowerCase() === 'exit' || 
        trimmedInput.toLowerCase() === 'quit' || 
        trimmedInput.toLowerCase() === 'bye') {
      console.log('\n👋 Goodbye! Keep up the great work with your protein goals!\n');
      rl.close();
      return;
    }

    if (!trimmedInput) {
      rl.prompt();
      return;
    }

    try {
      conversationHistory.push(new HumanMessage(trimmedInput));

      const response = await agent.invoke({
        messages: conversationHistory
      });

      const lastMessage = response.messages[response.messages.length - 1];
      
      conversationHistory.push(lastMessage as HumanMessage);

      console.log(`\nAgent: ${lastMessage.content}\n`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`\n❌ Error: ${errorMessage}\n`);
      if (error instanceof Error && error.stack && process.env.DEBUG) {
        console.error(error.stack);
      }
    }

    rl.prompt();
  });

  rl.on('close', () => {
    console.log('\nSession ended.');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('\n\n👋 Goodbye! Keep up the great work with your protein goals!\n');
    rl.close();
    process.exit(0);
  });
}

// Check if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { createProteinAgent };
export { default as proteinRepository } from './storage/proteinRepository.js';

