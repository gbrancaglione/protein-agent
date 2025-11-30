import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockPrisma, createMockUser, createMockProteinEntry } from '../helpers/mocks.js';
import type { PrismaClient } from '../../src/generated/prisma/client';

// Mock the prisma module
vi.mock('../../src/lib/prisma.js', () => ({
  prisma: createMockPrisma(),
}));

import { prisma } from '../../src/lib/prisma.js';
import proteinRepository from '../../src/storage/proteinRepository.js';

describe('ProteinRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDateKey', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const dateKey = proteinRepository.getDateKey(date);
      expect(dateKey).toBe('2024-01-15');
    });

    it('should use current date when no date provided', () => {
      const dateKey = proteinRepository.getDateKey();
      expect(dateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getDayBounds', () => {
    it('should return start and end of day for a given date', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const bounds = proteinRepository.getDayBounds(date);

      expect(bounds.start.getHours()).toBe(0);
      expect(bounds.start.getMinutes()).toBe(0);
      expect(bounds.start.getSeconds()).toBe(0);
      expect(bounds.start.getMilliseconds()).toBe(0);

      expect(bounds.end.getHours()).toBe(23);
      expect(bounds.end.getMinutes()).toBe(59);
      expect(bounds.end.getSeconds()).toBe(59);
      expect(bounds.end.getMilliseconds()).toBe(999);
    });

    it('should preserve the date part', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const bounds = proteinRepository.getDayBounds(date);

      expect(bounds.start.getDate()).toBe(15);
      expect(bounds.start.getMonth()).toBe(0); // January is 0
      expect(bounds.start.getFullYear()).toBe(2024);

      expect(bounds.end.getDate()).toBe(15);
      expect(bounds.end.getMonth()).toBe(0);
      expect(bounds.end.getFullYear()).toBe(2024);
    });
  });

  describe('recordProtein', () => {
    it('should create a protein entry in the database', async () => {
      const userId = 1;
      const proteinGrams = 30.0;
      const description = 'Chicken breast';
      const timestamp = new Date('2024-01-15T12:00:00Z');

      const mockEntry = createMockProteinEntry({
        proteinGrams,
        description,
        timestamp,
        userId,
      });

      vi.mocked(prisma.protein_entries.create).mockResolvedValue(mockEntry as any);

      const result = await proteinRepository.recordProtein(
        userId,
        proteinGrams,
        description,
        timestamp
      );

      expect(prisma.protein_entries.create).toHaveBeenCalledWith({
        data: {
          proteinGrams,
          description,
          timestamp: expect.any(Date),
          createdAt: expect.any(Date),
          userId,
        },
      });

      expect(result.id).toBe(mockEntry.id);
      expect(result.proteinGrams).toBe(proteinGrams);
      expect(result.description).toBe(description);
      expect(result.timestamp).toBe(mockEntry.timestamp.toISOString());
    });

    it('should use current date when timestamp not provided', async () => {
      const userId = 1;
      const proteinGrams = 25.0;
      const description = 'Salmon';

      const mockEntry = createMockProteinEntry({
        proteinGrams,
        description,
        userId,
      });

      vi.mocked(prisma.protein_entries.create).mockResolvedValue(mockEntry as any);

      await proteinRepository.recordProtein(userId, proteinGrams, description);

      expect(prisma.protein_entries.create).toHaveBeenCalledWith({
        data: {
          proteinGrams,
          description,
          timestamp: expect.any(Date),
          createdAt: expect.any(Date),
          userId,
        },
      });
    });
  });

  describe('getDailyConsumption', () => {
    it('should retrieve all entries for a specific date', async () => {
      const userId = 1;
      const date = new Date('2024-01-15T12:00:00Z');

      const mockEntries = [
        createMockProteinEntry({
          id: 1,
          proteinGrams: 30.0,
          description: 'Breakfast',
          timestamp: new Date('2024-01-15T08:00:00Z'),
          userId,
        }),
        createMockProteinEntry({
          id: 2,
          proteinGrams: 40.0,
          description: 'Lunch',
          timestamp: new Date('2024-01-15T13:00:00Z'),
          userId,
        }),
      ];

      vi.mocked(prisma.protein_entries.findMany).mockResolvedValue(mockEntries as any);

      const result = await proteinRepository.getDailyConsumption(userId, date);

      expect(prisma.protein_entries.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          timestamp: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      expect(result.date).toBe('2024-01-15');
      expect(result.entries).toHaveLength(2);
      expect(result.total).toBe(70.0);
    });

    it('should return empty entries and zero total when no entries exist', async () => {
      const userId = 1;
      const date = new Date('2024-01-15T12:00:00Z');

      vi.mocked(prisma.protein_entries.findMany).mockResolvedValue([]);

      const result = await proteinRepository.getDailyConsumption(userId, date);

      expect(result.date).toBe('2024-01-15');
      expect(result.entries).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should use current date when date not provided', async () => {
      const userId = 1;

      vi.mocked(prisma.protein_entries.findMany).mockResolvedValue([]);

      await proteinRepository.getDailyConsumption(userId);

      expect(prisma.protein_entries.findMany).toHaveBeenCalled();
    });
  });

  describe('getRangeConsumption', () => {
    it('should retrieve consumption for a date range', async () => {
      const userId = 1;
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-17');

      vi.mocked(prisma.protein_entries.findMany)
        .mockResolvedValueOnce([
          createMockProteinEntry({ id: 1, proteinGrams: 30.0, timestamp: new Date('2024-01-15') }),
        ] as any)
        .mockResolvedValueOnce([
          createMockProteinEntry({ id: 2, proteinGrams: 40.0, timestamp: new Date('2024-01-16') }),
        ] as any)
        .mockResolvedValueOnce([
          createMockProteinEntry({ id: 3, proteinGrams: 50.0, timestamp: new Date('2024-01-17') }),
        ] as any);

      const result = await proteinRepository.getRangeConsumption(userId, startDate, endDate);

      expect(result).toHaveLength(3);
      expect(result[0].date).toBe('2024-01-15');
      expect(result[1].date).toBe('2024-01-16');
      expect(result[2].date).toBe('2024-01-17');
    });
  });

  describe('getAllData', () => {
    it('should retrieve all consumption data grouped by date', async () => {
      const userId = 1;

      const mockEntries = [
        createMockProteinEntry({
          id: 1,
          proteinGrams: 30.0,
          timestamp: new Date('2024-01-15T08:00:00Z'),
          userId,
        }),
        createMockProteinEntry({
          id: 2,
          proteinGrams: 40.0,
          timestamp: new Date('2024-01-15T13:00:00Z'),
          userId,
        }),
        createMockProteinEntry({
          id: 3,
          proteinGrams: 50.0,
          timestamp: new Date('2024-01-16T08:00:00Z'),
          userId,
        }),
      ];

      vi.mocked(prisma.protein_entries.findMany).mockResolvedValue(mockEntries as any);

      const result = await proteinRepository.getAllData(userId);

      expect(Object.keys(result)).toHaveLength(2);
      expect(result['2024-01-15'].total).toBe(70.0);
      expect(result['2024-01-15'].entries).toHaveLength(2);
      expect(result['2024-01-16'].total).toBe(50.0);
      expect(result['2024-01-16'].entries).toHaveLength(1);
    });

    it('should return empty object when no entries exist', async () => {
      const userId = 1;

      vi.mocked(prisma.protein_entries.findMany).mockResolvedValue([]);

      const result = await proteinRepository.getAllData(userId);

      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe('getAllEntries', () => {
    it('should retrieve all entries sorted by timestamp descending', async () => {
      const userId = 1;

      // Mock entries in ascending order (as Prisma would return them)
      // The repository should handle the sorting, but Prisma returns them sorted desc
      const mockEntries = [
        createMockProteinEntry({
          id: 2,
          proteinGrams: 40.0,
          timestamp: new Date('2024-01-16T13:00:00Z'),
          userId,
        }),
        createMockProteinEntry({
          id: 1,
          proteinGrams: 30.0,
          timestamp: new Date('2024-01-15T08:00:00Z'),
          userId,
        }),
      ];

      vi.mocked(prisma.protein_entries.findMany).mockResolvedValue(mockEntries as any);

      const result = await proteinRepository.getAllEntries(userId);

      expect(prisma.protein_entries.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { timestamp: 'desc' },
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(2); // Most recent first
      expect(result[1].id).toBe(1);
      expect(result[0].date).toBe('2024-01-16');
      expect(result[1].date).toBe('2024-01-15');
    });
  });

  describe('deleteEntry', () => {
    it('should delete an entry and return success result', async () => {
      const userId = 1;
      const entryId = 1;

      const mockEntry = createMockProteinEntry({
        id: entryId,
        proteinGrams: 30.0,
        timestamp: new Date('2024-01-15T12:00:00Z'),
        userId,
      });

      vi.mocked(prisma.protein_entries.findFirst).mockResolvedValue(mockEntry as any);
      vi.mocked(prisma.protein_entries.delete).mockResolvedValue(mockEntry as any);
      vi.mocked(prisma.protein_entries.findMany).mockResolvedValue([]);

      const result = await proteinRepository.deleteEntry(userId, entryId);

      expect(prisma.protein_entries.findFirst).toHaveBeenCalledWith({
        where: { id: entryId, userId },
      });

      expect(prisma.protein_entries.delete).toHaveBeenCalledWith({
        where: { id: entryId },
      });

      expect(result.success).toBe(true);
      expect(result.deletedEntry?.id).toBe(entryId);
      expect(result.newDailyTotal).toBe(0);
    });

    it('should return error when entry not found', async () => {
      const userId = 1;
      const entryId = 999;

      vi.mocked(prisma.protein_entries.findFirst).mockResolvedValue(null);

      const result = await proteinRepository.deleteEntry(userId, entryId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
      expect(prisma.protein_entries.delete).not.toHaveBeenCalled();
    });

    it('should not allow deleting entries from other users', async () => {
      const userId = 1;
      const otherUserId = 2;
      const entryId = 1;

      vi.mocked(prisma.protein_entries.findFirst).mockResolvedValue(null);

      const result = await proteinRepository.deleteEntry(userId, entryId);

      expect(result.success).toBe(false);
      expect(prisma.protein_entries.delete).not.toHaveBeenCalled();
    });
  });
});

