import { Worker, Job } from 'bullmq';
import { connection } from '../lib/queue.js';
import { createProteinAgent } from '../agent/proteinAgent.js';
import { HumanMessage } from 'langchain';
import contextService from '../services/contextService.js';
import evolutionApiService from '../services/evolutionApiService.js';

export interface WebhookJobData {
  body: unknown;
}

interface EvolutionWebhookBody {
  event?: string;
  instance?: string;
  data?: {
    key?: {
      remoteJid?: string;
    };
    message?: {
      conversation?: string;
    };
  };
  jobData?: {
    body?: EvolutionWebhookBody;
  };
}

// Create webhook worker
export const webhookWorker = new Worker<WebhookJobData>(
  'webhooks',
  async (job: Job<WebhookJobData>) => {
    try {
      const body = job.data.body as EvolutionWebhookBody;
      
      // Handle nested structure (if EvolutionAPI wraps it in jobData)
      const webhookData = body.jobData?.body || body;
      
      // Only process messages.upsert events
      if (webhookData.event !== 'messages.upsert') {
        console.log(`Skipping event: ${webhookData.event}`);
        return;
      }

      // Extract phone number from remoteJid
      const remoteJid = webhookData.data?.key?.remoteJid;
      if (!remoteJid) {
        console.error('No remoteJid found in webhook data');
        return;
      }

      // Extract phone number (remove @s.whatsapp.net suffix)
      const phoneNumber = remoteJid.includes('@') ? remoteJid.split('@')[0] : remoteJid;
      console.log(`Processing message from phone: ${phoneNumber}`);

      // Get user by phone number
      const user = await contextService.getUserByPhone(phoneNumber);
      console.log(`Found user: ${user.name} (ID: ${user.id})`);

      // Extract message text
      const messageText = webhookData.data?.message?.conversation;
      if (!messageText) {
        console.log('No conversation message found, skipping');
        return;
      }

      console.log(`Message from ${user.name}: ${messageText}`);

      // Create agent with user context
      const agent = await createProteinAgent(user.id);
      console.log('Agent created, processing message...');

      // Process message
      const response = await agent.invoke({
        messages: [new HumanMessage(messageText)]
      });

      const lastMessage = response.messages[response.messages.length - 1];
      const answerContent = lastMessage.content;
      
      // Convert answer to string (content can be string or array)
      const answer = typeof answerContent === 'string' 
        ? answerContent 
        : JSON.stringify(answerContent);

      console.log(`\n📱 Agent response for ${user.name}:`);
      console.log(answer);
      console.log('');

      // Send response back to user via EvolutionAPI
      try {
        await evolutionApiService.sendTextMessage(phoneNumber, answer);
        console.log(`✅ Response sent successfully to ${user.name}`);
      } catch (sendError) {
        const errorMessage = sendError instanceof Error ? sendError.message : String(sendError);
        console.error(`❌ Failed to send response to ${user.name}:`, errorMessage);
        if (sendError instanceof Error && sendError.stack) {
          console.error(sendError.stack);
        }
        // Job processing succeeded, only message sending failed
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error processing webhook job ${job.id}:`, errorMessage);
      if (error instanceof Error && error.stack) {
        console.error(error.stack);
      }
      // Re-throw to mark job as failed
      throw error;
    }
  },
  {
    connection,
  }
);

// Handle worker events
webhookWorker.on('completed', (job: Job<WebhookJobData>) => {
  console.log(`Webhook job ${job.id} completed`);
});

webhookWorker.on('failed', (job: Job<WebhookJobData> | undefined, err: Error) => {
  console.error(`Webhook job ${job?.id} failed:`, err);
});

