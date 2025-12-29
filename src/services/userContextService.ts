import userRepository from '../repositories/userRepository.js';

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
    return await userRepository.getUser(userId);
  }

  /**
   * Get user by phone number
   * @param phone - Phone number (can be with or without @s.whatsapp.net suffix)
   * @returns User object
   * @throws Error if user is not found
   */
  async getUserByPhone(phone: string) {
    return await userRepository.getUserByPhone(phone);
  }
}

// Export singleton instance
export default new UserContextService();
