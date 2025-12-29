import { Worker, Job } from 'bullmq';
import { connection } from '../lib/queue.js';
import { createProteinAgent } from '../agent/proteinAgent.js';
import { HumanMessage } from 'langchain';
import contextService from '../services/contextService.js';
import evolutionApiService from '../services/evolutionApiService.js';
import { logError, logger } from '../lib/logger.js';
import { UserNotFoundError, ApiError } from '../errors/index.js';

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
        logger.debug({ event: webhookData.event, jobId: job.id }, 'Skipping non-message event');
        return;
      }

      // Extract phone number from remoteJid
      const remoteJid = webhookData.data?.key?.remoteJid;
      if (!remoteJid) {
        logger.warn({ jobId: job.id, webhookData }, 'No remoteJid found in webhook data');
        return;
      }

      // Extract phone number (remove @s.whatsapp.net suffix)
      const phoneNumber = remoteJid.includes('@') ? remoteJid.split('@')[0] : remoteJid;
      logger.info({ phoneNumber, jobId: job.id }, 'Processing message from phone');

      // Get user by phone number
      let user;
      try {
        user = await contextService.getUserByPhone(phoneNumber);
        logger.info({ userId: user.id, userName: user.name, jobId: job.id }, 'Found user');
      } catch (error) {
        if (error instanceof UserNotFoundError) {
          logger.warn({ phoneNumber, jobId: job.id }, 'User not found for phone number');
          // Don't fail the job if user doesn't exist, just skip processing
          return;
        }
        throw error;
      }

      // Extract message text
      const messageText = webhookData.data?.message?.conversation;
      if (!messageText) {
        logger.debug({ jobId: job.id }, 'No conversation message found, skipping');
        return;
      }

      logger.info({ userId: user.id, userName: user.name, messageText, jobId: job.id }, 'Message received');

      // Create agent with user context
      const agent = await createProteinAgent(user.id);
      logger.debug({ userId: user.id, jobId: job.id }, 'Agent created, processing message');

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

      logger.info({
        userId: user.id,
        userName: user.name,
        answer,
        jobId: job.id,
      }, 'Agent response generated');

      // Send response back to user via EvolutionAPI
      try {
        await evolutionApiService.sendTextMessage(phoneNumber, answer);
        logger.info({ userId: user.id, userName: user.name, jobId: job.id }, 'Response sent successfully');
      } catch (sendError) {
        // Log the error but don't fail the job - message processing succeeded
        logError(
          sendError instanceof Error ? sendError : new Error(String(sendError)),
          {
            userId: user.id,
            userName: user.name,
            phoneNumber,
            jobId: job.id,
            operation: 'sendTextMessage',
          }
        );
        // Job processing succeeded, only message sending failed
      }

    } catch (error) {
      logError(
        error instanceof Error ? error : new Error(String(error)),
        { jobId: job.id, operation: 'webhookProcessing' }
      );
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
  logger.info({ jobId: job.id }, 'Webhook job completed');
});

webhookWorker.on('failed', (job: Job<WebhookJobData> | undefined, err: Error) => {
  logError(err, { jobId: job?.id, operation: 'webhookJob' });
});

