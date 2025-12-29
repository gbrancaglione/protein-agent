import { prisma } from '../lib/prisma.js';
import { isProduction } from '../config/index.js';
import { logger, logError } from '../lib/logger.js';
import { DatabaseError } from '../errors/index.js';

/**
 * Seed script for development environment
 * Creates a default user "Gustavo" with weight 80kg and target 160g if it doesn't exist
 * Only runs in development mode (NODE_ENV !== 'production')
 */
async function seedDev() {
  // Only run in development
  if (isProduction()) {
    logger.warn({}, 'Seed script skipped: NODE_ENV is production');
    return;
  }

  try {
    // Check if user with name "Gustavo" already exists
    const existingUser = await prisma.user.findFirst({
      where: { name: 'Gustavo' }
    });

    if (existingUser) {
      logger.info({ userId: existingUser.id }, 'User "Gustavo" already exists');
      return;
    }

    // Create default user
    const user = await prisma.user.create({
      data: {
        name: 'Gustavo',
        phone: '5511998338955',
        weight: 80,
        target: 160
      }
    });

    logger.info({
      userId: user.id,
      name: user.name,
      weight: user.weight,
      target: user.target,
    }, 'Created default user');
  } catch (error) {
    logError(
      error instanceof Error ? error : new Error(String(error)),
      { operation: 'seedDev' }
    );
    throw new DatabaseError(
      'Failed to seed database',
      'seedDev',
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDev()
    .then(() => {
      logger.info({}, 'Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      logError(
        error instanceof Error ? error : new Error(String(error)),
        { operation: 'seedDev' }
      );
      process.exit(1);
    });
}

export { seedDev };

