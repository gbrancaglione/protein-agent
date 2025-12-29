import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import config from '../config/index.js';

// Create Redis connection
export function createRedisConnection(): IORedis {
  if (config.REDIS_URL) {
    return new IORedis(config.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
  }
  
  // Default connection for docker-compose (redis service)
  return new IORedis({
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    maxRetriesPerRequest: null,
  });
}

// Create Redis connection instance
const connection = createRedisConnection();

// Webhook queue
export const webhookQueue = new Queue('webhooks', {
  connection,
});

// Export connection for workers
export { connection };
