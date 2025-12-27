import express from 'express';
import dotenv from 'dotenv';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { webhookQueue } from './lib/queue.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Bull Board setup
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(webhookQueue)],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

// Webhooks endpoint
app.post('/webhooks', async (req, res) => {
  console.log('Webhook received', req.body);
  
  // Enqueue job with request body
  await webhookQueue.add('process-webhook', {
    body: req.body,
  });
  
  res.status(200).json({ message: 'Webhook received' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Webhooks endpoint: http://localhost:${PORT}/webhooks`);
  console.log(`📊 Bull Board UI: http://localhost:${PORT}/admin/queues`);
});

