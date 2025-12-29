import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockUser, createMockDailyConsumption } from '../helpers/mocks.js';

// Mock dependencies
vi.mock('../../src/repositories/userRepository.js', () => ({
  default: {
    getUser: vi.fn(),
    getUserByPhone: vi.fn(),
  },
}));

vi.mock('../../src/repositories/proteinRepository.js', () => ({
  default: {
    getDailyConsumption: vi.fn(),
  },
}));

import userRepository from '../../src/repositories/userRepository.js';
import proteinRepository from '../../src/repositories/proteinRepository.js';
import contextService from '../../src/services/contextService.js';

describe('ContextService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTodayDateFormatted', () => {
    it('should return formatted date in Portuguese', () => {
      const formatted = contextService.getTodayDateFormatted();

      // Should contain day name, month name, and year
      expect(formatted).toMatch(/\w+, \d+ de \w+ de \d{4}/);
    });

    it('should return a non-empty string', () => {
      const formatted = contextService.getTodayDateFormatted();
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });
  });

  describe('formatEntryTime', () => {
    it('should format timestamp to time string', () => {
      const timestamp = '2024-01-15T14:30:00Z';
      const formatted = contextService.formatEntryTime(timestamp);

      expect(formatted).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should handle different timestamps', () => {
      const timestamp1 = '2024-01-15T08:00:00Z';
      const timestamp2 = '2024-01-15T20:45:00Z';

      const formatted1 = contextService.formatEntryTime(timestamp1);
      const formatted2 = contextService.formatEntryTime(timestamp2);

      expect(formatted1).toMatch(/^\d{2}:\d{2}$/);
      expect(formatted2).toMatch(/^\d{2}:\d{2}$/);
      expect(formatted1).not.toBe(formatted2);
    });
  });

  describe('getTodayConsumption', () => {
    it('should call proteinRepository with userId and today\'s date', async () => {
      const userId = 1;
      const mockConsumption = createMockDailyConsumption();

      vi.mocked(proteinRepository.getDailyConsumption).mockResolvedValue(mockConsumption);

      const result = await contextService.getTodayConsumption(userId);

      expect(proteinRepository.getDailyConsumption).toHaveBeenCalledWith(
        userId,
        expect.any(Date)
      );
      expect(result).toEqual(mockConsumption);
    });
  });

  describe('getUser', () => {
    it('should call userRepository with userId', async () => {
      const userId = 1;
      const mockUser = createMockUser({ id: userId });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(userRepository.getUser).mockResolvedValue(mockUser as any);

      const result = await contextService.getUser(userId);

      expect(userRepository.getUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });
  });

  describe('getUserByPhone', () => {
    it('should call userRepository with phone number', async () => {
      const phoneNumber = '5511999999999';
      const mockUser = createMockUser({ id: 1, phone: phoneNumber });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(userRepository.getUserByPhone).mockResolvedValue(mockUser as any);

      const result = await contextService.getUserByPhone(phoneNumber);

      expect(userRepository.getUserByPhone).toHaveBeenCalledWith(phoneNumber);
      expect(result).toEqual(mockUser);
    });
  });

  describe('getContextString', () => {
    it('should generate context string with user info and consumption', async () => {
      const userId = 1;
      const mockUser = createMockUser({ id: userId, target: 160.0 });
      const mockConsumption = createMockDailyConsumption({
        total: 50.0,
        entries: [
          {
            id: 1,
            proteinGrams: 30.0,
            description: 'Breakfast',
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
          {
            id: 2,
            proteinGrams: 20.0,
            description: 'Lunch',
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
        ],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(userRepository.getUser).mockResolvedValue(mockUser as any);
      vi.mocked(proteinRepository.getDailyConsumption).mockResolvedValue(mockConsumption);

      const context = await contextService.getContextString(userId);

      expect(context).toContain('CONTEXTO ATUAL');
      expect(context).toContain(mockUser.name);
      expect(context).toContain('160g'); // target
      expect(context).toContain('50g'); // consumption
      expect(context).toContain('110g'); // remaining (160 - 50)
      expect(context).toContain('Breakfast');
      expect(context).toContain('Lunch');
    });

    it('should handle user without target', async () => {
      const userId = 1;
      const mockUser = createMockUser({ id: userId, target: null });
      const mockConsumption = createMockDailyConsumption({ total: 30.0, entries: [] });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(userRepository.getUser).mockResolvedValue(mockUser as any);
      vi.mocked(proteinRepository.getDailyConsumption).mockResolvedValue(mockConsumption);

      const context = await contextService.getContextString(userId);

      expect(context).toContain(mockUser.name);
      expect(context).not.toContain('Meta diária');
      expect(context).not.toContain('Restante para atingir a meta');
      expect(context).toContain('30g');
    });

    it('should handle user with weight', async () => {
      const userId = 1;
      const mockUser = createMockUser({ id: userId, weight: 75.5 });
      const mockConsumption = createMockDailyConsumption({ total: 0, entries: [] });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(userRepository.getUser).mockResolvedValue(mockUser as any);
      vi.mocked(proteinRepository.getDailyConsumption).mockResolvedValue(mockConsumption);

      const context = await contextService.getContextString(userId);

      expect(context).toContain('75.5kg');
    });

    it('should show message when no entries exist today', async () => {
      const userId = 1;
      const mockUser = createMockUser({ id: userId });
      const mockConsumption = createMockDailyConsumption({ total: 0, entries: [] });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(userRepository.getUser).mockResolvedValue(mockUser as any);
      vi.mocked(proteinRepository.getDailyConsumption).mockResolvedValue(mockConsumption);

      const context = await contextService.getContextString(userId);

      expect(context).toContain('Nenhuma entrada registrada hoje ainda');
    });

    it('should calculate percentage correctly', async () => {
      const userId = 1;
      const mockUser = createMockUser({ id: userId, target: 200.0 });
      const mockConsumption = createMockDailyConsumption({ total: 100.0, entries: [] });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(userRepository.getUser).mockResolvedValue(mockUser as any);
      vi.mocked(proteinRepository.getDailyConsumption).mockResolvedValue(mockConsumption);

      const context = await contextService.getContextString(userId);

      expect(context).toContain('50.0%'); // 100/200 * 100
    });

    it('should handle zero consumption percentage', async () => {
      const userId = 1;
      const mockUser = createMockUser({ id: userId, target: 160.0 });
      const mockConsumption = createMockDailyConsumption({ total: 0, entries: [] });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(userRepository.getUser).mockResolvedValue(mockUser as any);
      vi.mocked(proteinRepository.getDailyConsumption).mockResolvedValue(mockConsumption);

      const context = await contextService.getContextString(userId);

      expect(context).toContain('0'); // percentage should be 0
    });
  });
});

