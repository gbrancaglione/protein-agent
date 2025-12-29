import express from 'express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { webhookQueue } from './lib/queue.js';
import config from './config/index.js';
import { logger } from './lib/logger.js';

const app = express();
const PORT = config.PORT;

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
  logger.info({ body: req.body }, 'Webhook received');
  
  try {
    // Enqueue job with request body
    await webhookQueue.add('process-webhook', {
      body: req.body,
    });
    
    res.status(200).json({ message: 'Webhook received' });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to enqueue webhook');
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  logger.info({
    port: PORT,
    webhookEndpoint: `http://localhost:${PORT}/webhooks`,
    bullBoardUrl: `http://localhost:${PORT}/admin/queues`,
  }, 'Server started');
});

