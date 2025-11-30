import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockDailyConsumption } from '../helpers/mocks.js';

// Mock the proteinRepository
vi.mock('../../src/repositories/proteinRepository.js', () => ({
  default: {
    getDailyConsumption: vi.fn(),
  },
}));

import proteinRepository from '../../src/repositories/proteinRepository.js';
import proteinContextService from '../../src/services/proteinContextService.js';

describe('ProteinContextService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTodayConsumption', () => {
    it('should retrieve today\'s consumption', async () => {
      const userId = 1;
      const mockConsumption = createMockDailyConsumption();

      vi.mocked(proteinRepository.getDailyConsumption).mockResolvedValue(mockConsumption);

      const result = await proteinContextService.getTodayConsumption(userId);

      expect(proteinRepository.getDailyConsumption).toHaveBeenCalledWith(
        userId,
        expect.any(Date)
      );

      expect(result.date).toBe(mockConsumption.date);
      expect(result.total).toBe(mockConsumption.total);
      expect(result.entries).toHaveLength(mockConsumption.entries.length);
    });

    it('should handle empty consumption for today', async () => {
      const userId = 1;
      const mockConsumption = createMockDailyConsumption({
        entries: [],
        total: 0,
      });

      vi.mocked(proteinRepository.getDailyConsumption).mockResolvedValue(mockConsumption);

      const result = await proteinContextService.getTodayConsumption(userId);

      expect(result.entries).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('formatEntryTime', () => {
    it('should format timestamp to time string', () => {
      const timestamp = '2024-01-15T14:30:00Z';
      const formatted = proteinContextService.formatEntryTime(timestamp);

      expect(formatted).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should handle different timestamps', () => {
      const timestamp1 = '2024-01-15T08:00:00Z';
      const timestamp2 = '2024-01-15T20:45:00Z';

      const formatted1 = proteinContextService.formatEntryTime(timestamp1);
      const formatted2 = proteinContextService.formatEntryTime(timestamp2);

      expect(formatted1).toMatch(/^\d{2}:\d{2}$/);
      expect(formatted2).toMatch(/^\d{2}:\d{2}$/);
      expect(formatted1).not.toBe(formatted2);
    });
  });
});

