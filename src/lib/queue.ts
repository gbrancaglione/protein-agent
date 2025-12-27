import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Create Redis connection
export function createRedisConnection(): IORedis {
  const redisUrl = process.env.REDIS_URL;
  
  if (redisUrl) {
    return new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
    });
  }
  
  // Default connection for docker-compose (redis service)
  return new IORedis({
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
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
