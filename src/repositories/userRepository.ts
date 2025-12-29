import { prisma } from '../lib/prisma.js';
import { UserNotFoundError, DatabaseError } from '../errors/index.js';
import { logger } from '../lib/logger.js';

/**
 * User Repository
 * Repository pattern implementation for user data access.
 * Abstracts Prisma operations and provides domain-specific methods.
 */
class UserRepository {
  constructor() {
    // No initialization needed for Prisma
  }

  /**
   * Get user by ID
   * @param userId - User ID
   * @returns User object
   * @throws UserNotFoundError if user is not found
   * @throws DatabaseError if database operation fails
   */
  async getUser(userId: number) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new UserNotFoundError(userId);
      }

      return user;
    } catch (error) {
      // Re-throw if it's already our custom error
      if (error instanceof UserNotFoundError) {
        throw error;
      }
      
      // Wrap Prisma errors in DatabaseError
      logger.error({ error, userId, operation: 'getUser' }, 'Database error in getUser');
      throw new DatabaseError(
        `Failed to get user with ID ${userId}`,
        'getUser',
        { userId, originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Get user by phone number
   * @param phone - Phone number (can be with or without @s.whatsapp.net suffix)
   * @returns User object
   * @throws UserNotFoundError if user is not found
   * @throws DatabaseError if database operation fails
   */
  async getUserByPhone(phone: string) {
    try {
      // Extract just the phone number if it includes @s.whatsapp.net
      const phoneNumber = phone.includes('@') ? phone.split('@')[0] : phone;

      const user = await prisma.user.findFirst({
        where: { phone: phoneNumber }
      });

      if (!user) {
        throw new UserNotFoundError(phoneNumber);
      }

      return user;
    } catch (error) {
      // Re-throw if it's already our custom error
      if (error instanceof UserNotFoundError) {
        throw error;
      }
      
      // Wrap Prisma errors in DatabaseError
      logger.error({ error, phone, operation: 'getUserByPhone' }, 'Database error in getUserByPhone');
      throw new DatabaseError(
        `Failed to get user with phone ${phone}`,
        'getUserByPhone',
        { phone, originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }
}

// Export singleton instance
export default new UserRepository();

