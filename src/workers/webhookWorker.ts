import { Worker, Job } from 'bullmq';
import { connection } from '../lib/queue.js';

export interface WebhookJobData {
  body: unknown;
}

// Create webhook worker
export const webhookWorker = new Worker<WebhookJobData>(
  'webhooks',
  async (job: Job<WebhookJobData>) => {
    console.log('Processing webhook job:', job.data.body);
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

