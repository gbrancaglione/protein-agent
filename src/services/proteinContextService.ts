import proteinRepository from '../repositories/proteinRepository.js';
import type { DailyConsumption } from '../types/protein.js';

/**
 * Protein Context Service
 * Handles protein-related context information (consumption, etc.)
 */
class ProteinContextService {
  /**
   * Get today's protein consumption summary
   * @param userId - User ID
   * @returns Today's consumption data
   */
  async getTodayConsumption(userId: number): Promise<DailyConsumption> {
    return await proteinRepository.getDailyConsumption(userId, new Date());
  }

  /**
   * Format protein entry time for display
   * @param timestamp - ISO timestamp string
   * @returns Formatted time string
   */
  formatEntryTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

// Export singleton instance
export default new ProteinContextService();

