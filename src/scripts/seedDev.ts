import { prisma } from '../lib/prisma.js';
import { isProduction } from '../config/index.js';

/**
 * Seed script for development environment
 * Creates a default user "Gustavo" with weight 80kg and target 160g if it doesn't exist
 * Only runs in development mode (NODE_ENV !== 'production')
 */
async function seedDev() {
  // Only run in development
  if (isProduction()) {
    console.log('⚠️  Seed script skipped: NODE_ENV is production');
    return;
  }

  try {
    // Check if user with name "Gustavo" already exists
    const existingUser = await prisma.user.findFirst({
      where: { name: 'Gustavo' }
    });

    if (existingUser) {
      console.log('✅ User "Gustavo" already exists (ID:', existingUser.id, ')');
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

    console.log('✅ Created default user:');
    console.log('   Name:', user.name);
    console.log('   ID:', user.id);
    console.log('   Weight:', user.weight, 'kg');
    console.log('   Target:', user.target, 'g');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDev()
    .then(() => {
      console.log('✅ Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    });
}

export { seedDev };

