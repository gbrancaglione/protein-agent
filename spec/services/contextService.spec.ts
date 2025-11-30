import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockUser, createMockDailyConsumption } from '../helpers/mocks.js';

// Mock dependencies
vi.mock('../../src/services/userContextService.js', () => ({
  default: {
    getUser: vi.fn(),
  },
}));

vi.mock('../../src/services/proteinContextService.js', () => ({
  default: {
    getTodayConsumption: vi.fn(),
    formatEntryTime: vi.fn(),
  },
}));

import userContextService from '../../src/services/userContextService.js';
import proteinContextService from '../../src/services/proteinContextService.js';
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

  describe('getTodayConsumption', () => {
    it('should delegate to proteinContextService', async () => {
      const userId = 1;
      const mockConsumption = createMockDailyConsumption();

      vi.mocked(proteinContextService.getTodayConsumption).mockResolvedValue(mockConsumption);

      const result = await contextService.getTodayConsumption(userId);

      expect(proteinContextService.getTodayConsumption).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockConsumption);
    });
  });

  describe('getUser', () => {
    it('should delegate to userContextService', async () => {
      const userId = 1;
      const mockUser = createMockUser({ id: userId });

      vi.mocked(userContextService.getUser).mockResolvedValue(mockUser as any);

      const result = await contextService.getUser(userId);

      expect(userContextService.getUser).toHaveBeenCalledWith(userId);
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

      vi.mocked(userContextService.getUser).mockResolvedValue(mockUser as any);
      vi.mocked(proteinContextService.getTodayConsumption).mockResolvedValue(mockConsumption);
      vi.mocked(proteinContextService.formatEntryTime).mockReturnValue('12:00');

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

      vi.mocked(userContextService.getUser).mockResolvedValue(mockUser as any);
      vi.mocked(proteinContextService.getTodayConsumption).mockResolvedValue(mockConsumption);

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

      vi.mocked(userContextService.getUser).mockResolvedValue(mockUser as any);
      vi.mocked(proteinContextService.getTodayConsumption).mockResolvedValue(mockConsumption);

      const context = await contextService.getContextString(userId);

      expect(context).toContain('75.5kg');
    });

    it('should show message when no entries exist today', async () => {
      const userId = 1;
      const mockUser = createMockUser({ id: userId });
      const mockConsumption = createMockDailyConsumption({ total: 0, entries: [] });

      vi.mocked(userContextService.getUser).mockResolvedValue(mockUser as any);
      vi.mocked(proteinContextService.getTodayConsumption).mockResolvedValue(mockConsumption);

      const context = await contextService.getContextString(userId);

      expect(context).toContain('Nenhuma entrada registrada hoje ainda');
    });

    it('should calculate percentage correctly', async () => {
      const userId = 1;
      const mockUser = createMockUser({ id: userId, target: 200.0 });
      const mockConsumption = createMockDailyConsumption({ total: 100.0, entries: [] });

      vi.mocked(userContextService.getUser).mockResolvedValue(mockUser as any);
      vi.mocked(proteinContextService.getTodayConsumption).mockResolvedValue(mockConsumption);

      const context = await contextService.getContextString(userId);

      expect(context).toContain('50.0%'); // 100/200 * 100
    });

    it('should handle zero consumption percentage', async () => {
      const userId = 1;
      const mockUser = createMockUser({ id: userId, target: 160.0 });
      const mockConsumption = createMockDailyConsumption({ total: 0, entries: [] });

      vi.mocked(userContextService.getUser).mockResolvedValue(mockUser as any);
      vi.mocked(proteinContextService.getTodayConsumption).mockResolvedValue(mockConsumption);

      const context = await contextService.getContextString(userId);

      expect(context).toContain('0'); // percentage should be 0
    });
  });
});

