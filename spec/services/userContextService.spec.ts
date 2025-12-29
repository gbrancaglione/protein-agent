import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockUser } from '../helpers/mocks.js';

// Mock the userRepository module
vi.mock('../../src/repositories/userRepository.js', () => ({
  default: {
    getUser: vi.fn(),
    getUserByPhone: vi.fn(),
  },
}));

import userRepository from '../../src/repositories/userRepository.js';
import userContextService from '../../src/services/userContextService.js';

describe('UserContextService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUser', () => {
    it('should retrieve a user by ID', async () => {
      const userId = 1;
      const mockUser = createMockUser({ id: userId });

      vi.mocked(userRepository.getUser).mockResolvedValue(mockUser);

      const result = await userContextService.getUser(userId);

      expect(userRepository.getUser).toHaveBeenCalledWith(userId);

      expect(result.id).toBe(userId);
      expect(result.name).toBe(mockUser.name);
      expect(result.weight).toBe(mockUser.weight);
      expect(result.target).toBe(mockUser.target);
    });

    it('should throw error when user not found', async () => {
      const userId = 999;

      vi.mocked(userRepository.getUser).mockRejectedValue(
        new Error(`User with ID ${userId} not found`)
      );

      await expect(userContextService.getUser(userId)).rejects.toThrow(
        `User with ID ${userId} not found`
      );
    });

    it('should handle user with null weight and target', async () => {
      const userId = 1;
      const mockUser = createMockUser({
        id: userId,
        weight: null,
        target: null,
      });

      vi.mocked(userRepository.getUser).mockResolvedValue(mockUser);

      const result = await userContextService.getUser(userId);

      expect(result.weight).toBeNull();
      expect(result.target).toBeNull();
    });
  });

  describe('getUserByPhone', () => {
    it('should retrieve a user by phone number', async () => {
      const phoneNumber = '5511999999999';
      const mockUser = createMockUser({
        id: 1,
        phone: phoneNumber,
      });

      vi.mocked(userRepository.getUserByPhone).mockResolvedValue(mockUser);

      const result = await userContextService.getUserByPhone(phoneNumber);

      expect(userRepository.getUserByPhone).toHaveBeenCalledWith(phoneNumber);

      expect(result.id).toBe(mockUser.id);
      expect(result.phone).toBe(phoneNumber);
    });

    it('should throw error when user not found by phone', async () => {
      const phoneNumber = '5511999999999';

      vi.mocked(userRepository.getUserByPhone).mockRejectedValue(
        new Error(`User with phone ${phoneNumber} not found`)
      );

      await expect(userContextService.getUserByPhone(phoneNumber)).rejects.toThrow(
        `User with phone ${phoneNumber} not found`
      );
    });
  });
});

