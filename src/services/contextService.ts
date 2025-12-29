import userRepository from '../repositories/userRepository.js';
import proteinRepository from '../repositories/proteinRepository.js';
import type { DailyConsumption } from '../types/protein.js';

/**
 * Context Service for injecting contextual information into the agent
 * This service provides business logic for aggregating user and protein context
 * to provide a unified context interface. It avoids unnecessary tool calls for simple queries.
 */
class ContextService {
  /**
   * Get today's date in a human-readable format
   * @returns Today's date in a readable format
   */
  getTodayDateFormatted(): string {
    const today = new Date();
    return today.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  /**
   * Get today's protein consumption summary
   * @param userId - User ID
   * @returns Today's consumption data
   */
  async getTodayConsumption(userId: number): Promise<DailyConsumption> {
    return await proteinRepository.getDailyConsumption(userId, new Date());
  }

  /**
   * Get user by ID
   * @param userId - User ID
   * @returns User object
   * @throws UserNotFoundError if user is not found
   * @throws DatabaseError if database operation fails
   */
  async getUser(userId: number) {
    return await userRepository.getUser(userId);
  }

  /**
   * Get user by phone number
   * @param phone - Phone number
   * @returns User object
   * @throws UserNotFoundError if user is not found
   * @throws DatabaseError if database operation fails
   */
  async getUserByPhone(phone: string) {
    return await userRepository.getUserByPhone(phone);
  }

  /**
   * Get formatted context string for injection into agent
   * This includes today's date and today's consumption summary
   * @param userId - User ID
   * @returns Formatted context string
   */
  async getContextString(userId: number): Promise<string> {
    const user = await this.getUser(userId);
    const todayFormatted = this.getTodayDateFormatted();
    const todayConsumption = await this.getTodayConsumption(userId);
    const target = user.target;

    let context = `\n\n=== CONTEXTO ATUAL ===\n`;
    context += `Usuário: ${user.name}\n`;
    context += `Data de hoje: ${todayFormatted}\n`;
    if (target !== null) {
      const remaining = Math.max(0, target - todayConsumption.total);
      const percentage = todayConsumption.total > 0 
        ? ((todayConsumption.total / target) * 100).toFixed(1) 
        : '0';
      context += `Meta diária: ${target}g\n`;
      context += `Restante para atingir a meta: ${remaining}g\n`;
      context += `Progresso: ${percentage}%\n`;
    }
    if (user.weight) {
      context += `Peso do usuário: ${user.weight}kg\n`;
    }
    context += `Consumo de hoje: ${todayConsumption.total}g\n`;

    if (todayConsumption.entries.length > 0) {
      context += `\nEntradas de hoje (${todayConsumption.entries.length}):\n`;
      todayConsumption.entries.forEach((entry) => {
        const time = this.formatEntryTime(entry.timestamp);
        context += `ID: ${entry.id} - ${time} - ${entry.proteinGrams}g de proteína (${entry.description})\n`;
      });
    } else {
      context += `\nNenhuma entrada registrada hoje ainda.\n`;
    }

    context += `\nIMPORTANTE: Você já tem acesso a essas informações. Use-as para responder perguntas sobre o consumo de hoje sem precisar chamar ferramentas. Apenas use get_daily_protein_summary se o usuário perguntar sobre uma data específica diferente de hoje.\n`;

    return context;
  }
}

// Export singleton instance
export default new ContextService();
