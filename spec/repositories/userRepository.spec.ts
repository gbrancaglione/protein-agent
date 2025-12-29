import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockPrisma, createMockUser } from '../helpers/mocks.js';

// Mock the prisma module
vi.mock('../../src/lib/prisma.js', () => ({
  prisma: createMockPrisma(),
}));

import { prisma } from '../../src/lib/prisma.js';
import userRepository from '../../src/repositories/userRepository.js';

describe('UserRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUser', () => {
    it('should retrieve a user by ID', async () => {
      const userId = 1;
      const mockUser = createMockUser({ id: userId });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await userRepository.getUser(userId);

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

      await expect(userRepository.getUser(userId)).rejects.toThrow(
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await userRepository.getUser(userId);

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await userRepository.getUserByPhone(phoneNumber);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { phone: phoneNumber },
      });

      expect(result.id).toBe(mockUser.id);
      expect(result.phone).toBe(phoneNumber);
    });

    it('should extract phone number from WhatsApp format', async () => {
      const phoneNumber = '5511999999999';
      const whatsappPhone = `${phoneNumber}@s.whatsapp.net`;
      const mockUser = createMockUser({
        id: 1,
        phone: phoneNumber,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await userRepository.getUserByPhone(whatsappPhone);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { phone: phoneNumber },
      });

      expect(result.phone).toBe(phoneNumber);
    });

    it('should throw error when user not found by phone', async () => {
      const phoneNumber = '5511999999999';

      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      await expect(userRepository.getUserByPhone(phoneNumber)).rejects.toThrow(
        `User with phone ${phoneNumber} not found`
      );
    });

    it('should handle phone number without @ symbol', async () => {
      const phoneNumber = '5511999999999';
      const mockUser = createMockUser({
        id: 1,
        phone: phoneNumber,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await userRepository.getUserByPhone(phoneNumber);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { phone: phoneNumber },
      });

      expect(result.phone).toBe(phoneNumber);
    });
  });
});

