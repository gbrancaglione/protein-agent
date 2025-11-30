import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockPrisma, createMockUser } from '../helpers/mocks.js';

// Mock the prisma module
vi.mock('../../src/lib/prisma.js', () => ({
  prisma: createMockPrisma(),
}));

import { prisma } from '../../src/lib/prisma.js';
import userContextService from '../../src/services/userContextService.js';

describe('UserContextService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUser', () => {
    it('should retrieve a user by ID', async () => {
      const userId = 1;
      const mockUser = createMockUser({ id: userId });

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await userContextService.getUser(userId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });

      expect(result.id).toBe(userId);
      expect(result.name).toBe(mockUser.name);
      expect(result.weight).toBe(mockUser.weight);
      expect(result.target).toBe(mockUser.target);
    });

    it('should throw error when user not found', async () => {
      const userId = 999;

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

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

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await userContextService.getUser(userId);

      expect(result.weight).toBeNull();
      expect(result.target).toBeNull();
    });
  });
});

