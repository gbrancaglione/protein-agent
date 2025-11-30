import userContextService from './userContextService.js';
import proteinContextService from './proteinContextService.js';

/**
 * Context Service for injecting contextual information into the agent
 * This service aggregates user and protein context to provide a unified
 * context interface. It avoids unnecessary tool calls for simple queries.
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
   * Get today's protein consumption summary
   * @param userId - User ID
   * @returns Today's consumption data
   */
  async getTodayConsumption(userId: number) {
    return await proteinContextService.getTodayConsumption(userId);
  }

  /**
   * Get user by ID
   * @param userId - User ID
   * @returns User object
   * @throws Error if user is not found
   */
  async getUser(userId: number) {
    return await userContextService.getUser(userId);
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
      todayConsumption.entries.forEach((entry, index) => {
        const time = proteinContextService.formatEntryTime(entry.timestamp);
        context += `${index + 1}. ${time} - ${entry.proteinGrams}g de proteína (${entry.description})\n`;
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
