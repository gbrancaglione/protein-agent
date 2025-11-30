import { prisma } from '../lib/prisma.js';

/**
 * User Context Service
 * Handles user-related context information (user data, preferences, etc.)
 */
class UserContextService {
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
}

// Export singleton instance
export default new UserContextService();

