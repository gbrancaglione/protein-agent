import { webhookWorker } from './webhookWorker.js';
import '../config/index.js'; // Ensure config is loaded and validated

console.log('🚀 Workers started');
console.log('📡 Webhook worker is listening for jobs...');

// Graceful shutdown - handles all workers in one place
async function shutdown(signal: string) {
  console.log(`${signal} received, closing workers...`);
  await webhookWorker.close();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

