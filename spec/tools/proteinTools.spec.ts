import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockUser, createMockProteinEntry, createMockDailyConsumption } from '../helpers/mocks.js';

// Mock dependencies
vi.mock('../../src/repositories/proteinRepository.js', () => ({
  default: {
    recordProtein: vi.fn(),
    getDailyConsumption: vi.fn(),
    getAllData: vi.fn(),
    getAllEntries: vi.fn(),
    deleteEntry: vi.fn(),
  },
}));

vi.mock('../../src/services/contextService.js', () => ({
  default: {
    getUser: vi.fn(),
  },
}));

import proteinRepository from '../../src/repositories/proteinRepository.js';
import contextService from '../../src/services/contextService.js';
import { createProteinTools } from '../../src/tools/proteinTools.js';

describe('ProteinTools', () => {
  const userId = 1;
  let tools: ReturnType<typeof createProteinTools>;

  beforeEach(() => {
    vi.clearAllMocks();
    tools = createProteinTools(userId);
  });

  describe('recordProteinIntake', () => {
    it('should record protein intake and return success response', async () => {
      const proteinGrams = 30.0;
      const description = 'Chicken breast';
      const mockEntry = createMockProteinEntry({ proteinGrams, description });
      const mockDaily = createMockDailyConsumption({ total: 30.0 });
      const mockUser = createMockUser({ target: 160.0 });

      vi.mocked(proteinRepository.recordProtein).mockResolvedValue({
        id: mockEntry.id,
        proteinGrams: mockEntry.proteinGrams,
        description: mockEntry.description,
        timestamp: mockEntry.timestamp.toISOString(),
        createdAt: mockEntry.createdAt.toISOString(),
      });
      vi.mocked(proteinRepository.getDailyConsumption).mockResolvedValue(mockDaily);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(contextService.getUser).mockResolvedValue(mockUser as any);

      const result = await tools.recordProteinIntake.invoke({
        proteinGrams,
        description,
      });

      expect(proteinRepository.recordProtein).toHaveBeenCalledWith(
        userId,
        proteinGrams,
        description,
        expect.any(Date)
      );

      const parsed = JSON.parse(result);
      expect(parsed.success).toBe(true);
      expect(parsed.entry.proteinGrams).toBe(proteinGrams);
      expect(parsed.dailyTotal).toBe(30.0);
      expect(parsed.remaining).toBe(130.0); // 160 - 30
    });

    it('should use default description when not provided', async () => {
      const proteinGrams = 25.0;
      const mockEntry = createMockProteinEntry({ proteinGrams });
      const mockDaily = createMockDailyConsumption({ total: 25.0 });
      const mockUser = createMockUser();

      vi.mocked(proteinRepository.recordProtein).mockResolvedValue({
        id: mockEntry.id,
        proteinGrams: mockEntry.proteinGrams,
        description: 'Refeição',
        timestamp: mockEntry.timestamp.toISOString(),
        createdAt: mockEntry.createdAt.toISOString(),
      });
      vi.mocked(proteinRepository.getDailyConsumption).mockResolvedValue(mockDaily);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(contextService.getUser).mockResolvedValue(mockUser as any);

      await tools.recordProteinIntake.invoke({ proteinGrams });

      expect(proteinRepository.recordProtein).toHaveBeenCalledWith(
        userId,
        proteinGrams,
        'Refeição',
        expect.any(Date)
      );
    });

    it('should use provided timestamp when given', async () => {
      const proteinGrams = 30.0;
      const timestamp = '2024-01-15T12:00:00Z';
      const mockEntry = createMockProteinEntry({ proteinGrams });
      const mockDaily = createMockDailyConsumption();
      const mockUser = createMockUser();

      vi.mocked(proteinRepository.recordProtein).mockResolvedValue({
        id: mockEntry.id,
        proteinGrams: mockEntry.proteinGrams,
        description: mockEntry.description,
        timestamp: mockEntry.timestamp.toISOString(),
        createdAt: mockEntry.createdAt.toISOString(),
      });
      vi.mocked(proteinRepository.getDailyConsumption).mockResolvedValue(mockDaily);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(contextService.getUser).mockResolvedValue(mockUser as any);

      await tools.recordProteinIntake.invoke({ proteinGrams, timestamp });

      expect(proteinRepository.recordProtein).toHaveBeenCalledWith(
        userId,
        proteinGrams,
        'Refeição',
        new Date(timestamp)
      );
    });

    it('should handle user without target', async () => {
      const proteinGrams = 30.0;
      const mockEntry = createMockProteinEntry({ proteinGrams });
      const mockDaily = createMockDailyConsumption({ total: 30.0 });
      const mockUser = createMockUser({ target: null });

      vi.mocked(proteinRepository.recordProtein).mockResolvedValue({
        id: mockEntry.id,
        proteinGrams: mockEntry.proteinGrams,
        description: mockEntry.description,
        timestamp: mockEntry.timestamp.toISOString(),
        createdAt: mockEntry.createdAt.toISOString(),
      });
      vi.mocked(proteinRepository.getDailyConsumption).mockResolvedValue(mockDaily);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(contextService.getUser).mockResolvedValue(mockUser as any);

      const result = await tools.recordProteinIntake.invoke({ proteinGrams });

      const parsed = JSON.parse(result);
      expect(parsed.success).toBe(true);
      expect(parsed.remaining).toBeUndefined();
    });
  });

  describe('getDailyProteinSummary', () => {
    it('should return daily summary with entries', async () => {
      const date = '2024-01-15';
      const mockDaily = createMockDailyConsumption({
        date,
        total: 70.0,
        entries: [
          {
            id: 1,
            proteinGrams: 30.0,
            description: 'Breakfast',
            timestamp: new Date('2024-01-15T08:00:00Z').toISOString(),
            createdAt: new Date().toISOString(),
          },
          {
            id: 2,
            proteinGrams: 40.0,
            description: 'Lunch',
            timestamp: new Date('2024-01-15T13:00:00Z').toISOString(),
            createdAt: new Date().toISOString(),
          },
        ],
      });
      const mockUser = createMockUser({ target: 160.0 });

      vi.mocked(proteinRepository.getDailyConsumption).mockResolvedValue(mockDaily);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(contextService.getUser).mockResolvedValue(mockUser as any);

      const result = await tools.getDailyProteinSummary.invoke({ date });

      const parsed = JSON.parse(result);
      expect(parsed.date).toBe(date);
      expect(parsed.totalProtein).toBe(70.0);
      expect(parsed.entries).toHaveLength(2);
      expect(parsed.target).toBe(160.0);
      expect(parsed.remaining).toBe(90.0);
      expect(parsed.percentage).toBe('43.8%');
    });

    it('should use current date when date not provided', async () => {
      const mockDaily = createMockDailyConsumption({ total: 0 });
      const mockUser = createMockUser();

      vi.mocked(proteinRepository.getDailyConsumption).mockResolvedValue(mockDaily);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(contextService.getUser).mockResolvedValue(mockUser as any);

      await tools.getDailyProteinSummary.invoke({});

      expect(proteinRepository.getDailyConsumption).toHaveBeenCalledWith(
        userId,
        expect.any(Date)
      );
    });

    it('should handle user without target', async () => {
      const mockDaily = createMockDailyConsumption({ total: 50.0 });
      const mockUser = createMockUser({ target: null });

      vi.mocked(proteinRepository.getDailyConsumption).mockResolvedValue(mockDaily);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(contextService.getUser).mockResolvedValue(mockUser as any);

      const result = await tools.getDailyProteinSummary.invoke({});

      const parsed = JSON.parse(result);
      expect(parsed.target).toBeUndefined();
      expect(parsed.remaining).toBeUndefined();
      expect(parsed.percentage).toBeUndefined();
    });
  });

  describe('getAllConsumption', () => {
    it('should return all consumption data', async () => {
      const mockAllData = {
        '2024-01-15': createMockDailyConsumption({ date: '2024-01-15', total: 70.0 }),
        '2024-01-16': createMockDailyConsumption({ date: '2024-01-16', total: 50.0 }),
      };
      const mockAllEntries = [
        {
          id: 1,
          proteinGrams: 30.0,
          description: 'Entry 1',
          timestamp: new Date('2024-01-16T12:00:00Z').toISOString(),
          createdAt: new Date().toISOString(),
          date: '2024-01-16',
        },
        {
          id: 2,
          proteinGrams: 40.0,
          description: 'Entry 2',
          timestamp: new Date('2024-01-15T12:00:00Z').toISOString(),
          createdAt: new Date().toISOString(),
          date: '2024-01-15',
        },
      ];
      const mockUser = createMockUser({ target: 160.0 });

      vi.mocked(proteinRepository.getAllData).mockResolvedValue(mockAllData);
      vi.mocked(proteinRepository.getAllEntries).mockResolvedValue(mockAllEntries);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(contextService.getUser).mockResolvedValue(mockUser as any);

      const result = await tools.getAllConsumption.invoke({});

      const parsed = JSON.parse(result);
      expect(parsed.totalDays).toBe(2);
      expect(parsed.totalEntries).toBe(2);
      expect(parsed.totalAllTimeProtein).toBe(120.0);
      expect(parsed.dailySummaries).toHaveLength(2);
      expect(parsed.dailyTarget).toBe(160.0);
      expect(parsed.recentEntries).toHaveLength(2);
    });

    it('should sort daily summaries by date descending', async () => {
      const mockAllData = {
        '2024-01-15': createMockDailyConsumption({ date: '2024-01-15', total: 70.0 }),
        '2024-01-16': createMockDailyConsumption({ date: '2024-01-16', total: 50.0 }),
      };
      const mockAllEntries: Array<{
        id: number;
        proteinGrams: number;
        description: string;
        timestamp: string;
        createdAt: string;
        date: string;
      }> = [];
      const mockUser = createMockUser();

      vi.mocked(proteinRepository.getAllData).mockResolvedValue(mockAllData);
      vi.mocked(proteinRepository.getAllEntries).mockResolvedValue(mockAllEntries);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(contextService.getUser).mockResolvedValue(mockUser as any);

      const result = await tools.getAllConsumption.invoke({});

      const parsed = JSON.parse(result);
      expect(parsed.dailySummaries[0].date).toBe('2024-01-16'); // Most recent first
      expect(parsed.dailySummaries[1].date).toBe('2024-01-15');
    });
  });

  describe('deleteProteinEntry', () => {
    it('should delete entry and return success', async () => {
      const entryId = 1;
      const mockDeletedEntry = {
        success: true,
        deletedEntry: {
          id: entryId,
          proteinGrams: 30.0,
          description: 'Chicken breast',
          date: '2024-01-15',
        },
        newDailyTotal: 40.0,
      };
      const mockDaily = createMockDailyConsumption({ total: 40.0 });
      const mockUser = createMockUser({ target: 160.0 });

      vi.mocked(proteinRepository.deleteEntry).mockResolvedValue(mockDeletedEntry);
      vi.mocked(proteinRepository.getDailyConsumption).mockResolvedValue(mockDaily);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(contextService.getUser).mockResolvedValue(mockUser as any);

      const result = await tools.deleteProteinEntry.invoke({ entryId });

      expect(proteinRepository.deleteEntry).toHaveBeenCalledWith(userId, entryId);

      const parsed = JSON.parse(result);
      expect(parsed.success).toBe(true);
      expect(parsed.deletedEntry.id).toBe(entryId);
      expect(parsed.updatedDailyTotal).toBe(40.0);
      expect(parsed.remaining).toBe(120.0);
    });

    it('should return error when entry not found', async () => {
      const entryId = 999;
      const mockResult = {
        success: false,
        error: 'Entry with ID 999 not found',
      };

      vi.mocked(proteinRepository.deleteEntry).mockResolvedValue(mockResult);

      const result = await tools.deleteProteinEntry.invoke({ entryId });

      const parsed = JSON.parse(result);
      expect(parsed.success).toBe(false);
      expect(parsed.error).toContain('not found');
    });

    it('should return error when entryId is missing', async () => {
      const result = await tools.deleteProteinEntry.invoke({ entryId: 0 });

      const parsed = JSON.parse(result);
      expect(parsed.success).toBe(false);
      expect(parsed.error).toContain('obrigatório');
    });
  });
});

