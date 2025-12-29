import { prisma } from '../lib/prisma.js';

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
   * @throws Error if user is not found
   */
  async getUser(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    return user;
  }

  /**
   * Get user by phone number
   * @param phone - Phone number (can be with or without @s.whatsapp.net suffix)
   * @returns User object
   * @throws Error if user is not found
   */
  async getUserByPhone(phone: string) {
    // Extract just the phone number if it includes @s.whatsapp.net
    const phoneNumber = phone.includes('@') ? phone.split('@')[0] : phone;

    const user = await prisma.user.findFirst({
      where: { phone: phoneNumber }
    });

    if (!user) {
      throw new Error(`User with phone ${phoneNumber} not found`);
    }

    return user;
  }
}

// Export singleton instance
export default new UserRepository();

