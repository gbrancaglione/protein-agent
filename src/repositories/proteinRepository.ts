import { prisma } from '../lib/prisma.js';
import type { DayBounds, ProteinEntry, DailyConsumption, DeleteResult } from '../types/protein.js';
import { NotFoundError, DatabaseError } from '../errors/index.js';
import { logger } from '../lib/logger.js';

/**
 * Protein Repository
 * Repository pattern implementation for protein entry data access.
 * Abstracts Prisma operations and provides domain-specific methods.
 */
class ProteinRepository {
  constructor() {
    // No initialization needed for Prisma
  }

  getDateKey(date: Date = new Date()): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get start and end of day for a given date
   * @param date - The date
   * @returns Object with start and end Date objects
   */
  getDayBounds(date: Date): DayBounds {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  /**
   * Record protein consumption for a specific date and time
   * @param userId - User ID
   * @param proteinGrams - Amount of protein in grams
   * @param description - Description of the meal
   * @param timestamp - When the meal was consumed
   * @returns The recorded entry
   * @throws DatabaseError if database operation fails
   */
  async recordProtein(
    userId: number,
    proteinGrams: number,
    description: string,
    timestamp: Date = new Date()
  ): Promise<ProteinEntry> {
    try {
      const entry = await prisma.protein_entries.create({
        data: {
          proteinGrams,
          description,
          timestamp: new Date(timestamp),
          createdAt: new Date(),
          userId
        }
      });

      // Return in the same format as before for compatibility
      return {
        id: entry.id,
        proteinGrams: entry.proteinGrams,
        description: entry.description,
        timestamp: entry.timestamp.toISOString(),
        createdAt: entry.createdAt.toISOString()
      };
    } catch (error) {
      logger.error({ error, userId, proteinGrams, operation: 'recordProtein' }, 'Database error in recordProtein');
      throw new DatabaseError(
        `Failed to record protein entry for user ${userId}`,
        'recordProtein',
        { userId, proteinGrams, originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Get protein consumption for a specific date
   * @param userId - User ID
   * @param date - The date to query
   * @returns Consumption data for that date
   */
  async getDailyConsumption(userId: number, date: Date = new Date()): Promise<DailyConsumption> {
    const dateKey = this.getDateKey(date);
    const { start, end } = this.getDayBounds(date);

    const entries = await prisma.protein_entries.findMany({
      where: {
        userId,
        timestamp: {
          gte: start,
          lte: end
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    const total = entries.reduce((sum, entry) => sum + entry.proteinGrams, 0);

    return {
      date: dateKey,
      entries: entries.map(entry => ({
        id: entry.id,
        proteinGrams: entry.proteinGrams,
        description: entry.description,
        timestamp: entry.timestamp.toISOString(),
        createdAt: entry.createdAt.toISOString()
      })),
      total
    };
  }

  /**
   * Get protein consumption for a date range
   * @param userId - User ID
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Array of daily consumption data
   */
  async getRangeConsumption(userId: number, startDate: Date, endDate: Date): Promise<DailyConsumption[]> {
    const results: DailyConsumption[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      results.push(await this.getDailyConsumption(userId, current));
      current.setDate(current.getDate() + 1);
    }

    return results;
  }

  /**
   * Get all consumption data
   * @param userId - User ID
   * @returns All stored data grouped by date
   */
  async getAllData(userId: number): Promise<Record<string, DailyConsumption>> {
    const allEntries = await prisma.protein_entries.findMany({
      where: {
        userId
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    // Group by date
    const grouped: Record<string, DailyConsumption> = {};
    for (const entry of allEntries) {
      const dateKey = this.getDateKey(entry.timestamp);
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          entries: [],
          total: 0
        };
      }

      grouped[dateKey].entries.push({
        id: entry.id,
        proteinGrams: entry.proteinGrams,
        description: entry.description,
        timestamp: entry.timestamp.toISOString(),
        createdAt: entry.createdAt.toISOString()
      });

      grouped[dateKey].total += entry.proteinGrams;
    }

    return grouped;
  }

  /**
   * Delete a protein entry by ID
   * @param userId - User ID
   * @param entryId - The ID of the entry to delete
   * @returns Result object with success status and deleted entry info
   * @throws NotFoundError if entry is not found
   * @throws DatabaseError if database operation fails
   */
  async deleteEntry(userId: number, entryId: number): Promise<DeleteResult> {
    try {
      const entry = await prisma.protein_entries.findFirst({
        where: { 
          id: entryId,
          userId 
        }
      });

      if (!entry) {
        throw new NotFoundError('Protein entry', entryId, { userId });
      }

      const dateKey = this.getDateKey(entry.timestamp);

      // Delete the entry
      await prisma.protein_entries.delete({
        where: { id: entryId }
      });

      // Get updated daily total
      const daily = await this.getDailyConsumption(userId, entry.timestamp);

      return {
        success: true,
        deletedEntry: {
          id: entry.id,
          proteinGrams: entry.proteinGrams,
          description: entry.description,
          date: dateKey
        },
        newDailyTotal: daily.total
      };
    } catch (error) {
      // Re-throw if it's already our custom error
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      // Handle Prisma record not found error
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        throw new NotFoundError('Protein entry', entryId, { userId });
      }
      
      // Wrap other errors in DatabaseError
      logger.error({ error, userId, entryId, operation: 'deleteEntry' }, 'Database error in deleteEntry');
      throw new DatabaseError(
        `Failed to delete protein entry ${entryId} for user ${userId}`,
        'deleteEntry',
        { userId, entryId, originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Get all entries across all dates
   * @param userId - User ID
   * @returns Array of all entries with date information
   */
  async getAllEntries(userId: number): Promise<(ProteinEntry & { date: string })[]> {
    const entries = await prisma.protein_entries.findMany({
      where: {
        userId
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    return entries.map(entry => ({
      id: entry.id,
      proteinGrams: entry.proteinGrams,
      description: entry.description,
      timestamp: entry.timestamp.toISOString(),
      createdAt: entry.createdAt.toISOString(),
      date: this.getDateKey(entry.timestamp)
    }));
  }
}

// Export singleton instance
export default new ProteinRepository();

