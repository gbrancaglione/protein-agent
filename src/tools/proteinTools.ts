import { tool } from "langchain";
import * as z from "zod";
import proteinRepository from "../repositories/proteinRepository.js";
import contextService from "../services/contextService.js";
import { ValidationError, NotFoundError } from "../errors/index.js";
import { logger } from "../lib/logger.js";

export function createProteinTools(userId: number) {
  const recordProteinIntake = tool(
    async ({ proteinGrams, description, timestamp }: {
      proteinGrams: number;
      description?: string | null;
      timestamp?: string | null;
    }) => {
      const date = (timestamp && timestamp !== null) ? new Date(timestamp) : new Date();
      const entry = await proteinRepository.recordProtein(
        userId,
        proteinGrams,
        (description && description !== null) ? description : "Refeição",
        date
      );
      
      const daily = await proteinRepository.getDailyConsumption(userId, date);
      const user = await contextService.getUser(userId);
      const target = user.target;
      
      const response: {
        success: boolean;
        entry: {
          proteinGrams: number;
          description: string;
          timestamp: string;
        };
        dailyTotal: number;
        remaining?: number;
      } = {
        success: true,
        entry: {
          proteinGrams: entry.proteinGrams,
          description: entry.description,
          timestamp: entry.timestamp
        },
        dailyTotal: daily.total
      };
      
      if (target !== null) {
        response.remaining = Math.max(0, target - daily.total);
      }
      
      return JSON.stringify(response, null, 2);
    },
    {
      name: "record_protein_intake",
      description: `Registra o consumo de proteína com uma quantidade específica em gramas.
    Use isso quando o usuário informar explicitamente quanta proteína consumiu,
    ou quando você tiver estimado o conteúdo de proteína a partir de uma descrição de refeição.
    
    CRÍTICO: Quando o usuário informar explicitamente um número (ex: "15g", "20 gramas", "30g de proteína"),
    use EXATAMENTE esse valor numérico. Se o usuário disser "15g", passe proteinGrams=15, não 1.5 ou qualquer outro valor.
    NÃO converta ou altere números explícitos informados pelo usuário.
    
    Parâmetros:
    - proteinGrams: number (obrigatório) - A quantidade de proteína em gramas (use o valor exato informado pelo usuário quando disponível)
    - description: string (opcional) - Descrição do que foi comido
    - timestamp: string (opcional) - Timestamp ISO, padrão é agora`,
      schema: z.object({
        proteinGrams: z.number().describe("Quantidade de proteína em gramas"),
        description: z.string().nullable().optional().describe("Descrição da refeição ou item alimentar"),
        timestamp: z.string().nullable().optional().describe("Timestamp ISO de quando a refeição foi consumida (opcional)")
      })
    }
  );

  const getDailyProteinSummary = tool(
    async ({ date }: { date?: string | null }) => {
      const queryDate = (date && date !== null) ? new Date(date) : new Date();
      const daily = await proteinRepository.getDailyConsumption(userId, queryDate);
      const user = await contextService.getUser(userId);
      const target = user.target;
      
      const response: {
        date: string;
        totalProtein: number;
        entries: Array<{
          id: number;
          time: string;
          protein: number;
          description: string;
        }>;
        target?: number;
        remaining?: number;
        percentage?: string;
      } = {
        date: daily.date,
        totalProtein: daily.total,
        entries: daily.entries.map(e => ({
          id: e.id,
          time: new Date(e.timestamp).toLocaleTimeString(),
          protein: e.proteinGrams,
          description: e.description
        }))
      };
      
      if (target !== null) {
        const remaining = Math.max(0, target - daily.total);
        const percentage = ((daily.total / target) * 100).toFixed(1);
        response.target = target;
        response.remaining = remaining;
        response.percentage = `${percentage}%`;
      }
      
      return JSON.stringify(response, null, 2);
    },
    {
      name: "get_daily_protein_summary",
    description: `Obtém um resumo do consumo de proteína para uma data específica.
    Mostra a proteína total consumida, quantidade restante necessária para atingir a meta diária,
    e todas as entradas daquele dia.
    
    Parâmetros:
    - date: string (opcional) - String de data ISO, padrão é hoje`,
      schema: z.object({
        date: z.string().nullable().optional().describe("String de data ISO (formato YYYY-MM-DD ou string ISO)")
      })
    }
  );

  const getAllConsumption = tool(
    async () => {
      const allData = await proteinRepository.getAllData(userId);
      const allEntries = await proteinRepository.getAllEntries(userId);
      const user = await contextService.getUser(userId);
      const target = user.target;
      
      // Calculate totals across all days
      let totalAllTime = 0;
      const dailySummaries: Array<{
        date: string;
        totalProtein: number;
        target?: number;
        remaining?: number;
        percentage?: string;
        entryCount: number;
      }> = [];
      
      for (const dateKey in allData) {
        const dayData = allData[dateKey];
        totalAllTime += dayData.total;
        
        const summary: {
          date: string;
          totalProtein: number;
          target?: number;
          remaining?: number;
          percentage?: string;
          entryCount: number;
        } = {
          date: dateKey,
          totalProtein: dayData.total,
          entryCount: dayData.entries.length
        };
        
        if (target !== null) {
          const remaining = Math.max(0, target - dayData.total);
          const percentage = ((dayData.total / target) * 100).toFixed(1);
          summary.target = target;
          summary.remaining = remaining;
          summary.percentage = `${percentage}%`;
        }
        
        dailySummaries.push(summary);
      }
      
      // Sort by date (most recent first)
      dailySummaries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const response: {
        totalDays: number;
        totalEntries: number;
        totalAllTimeProtein: number;
        dailySummaries: Array<{
          date: string;
          totalProtein: number;
          target?: number;
          remaining?: number;
          percentage?: string;
          entryCount: number;
        }>;
        recentEntries: Array<{
          id: number;
          date: string;
          time: string;
          protein: number;
          description: string;
        }>;
        dailyTarget?: number;
      } = {
        totalDays: Object.keys(allData).length,
        totalEntries: allEntries.length,
        totalAllTimeProtein: totalAllTime,
        dailySummaries: dailySummaries,
        recentEntries: allEntries.slice(0, 20).map(e => ({
          id: e.id,
          date: e.date,
          time: new Date(e.timestamp).toLocaleTimeString(),
          protein: e.proteinGrams,
          description: e.description
        }))
      };
      
      if (target !== null) {
        response.dailyTarget = target;
      }
      
      return JSON.stringify(response, null, 2);
    },
    {
      name: "get_all_consumption",
    description: `Obtém um resumo abrangente de TODO o consumo de proteína em todas as datas.
    Use isso quando o usuário perguntar sobre seu consumo geral, histórico, ou quiser ver
    todos os seus registros. Mostra resumos diários, total de entradas e entradas recentes.
    
    Nenhum parâmetro necessário.`,
      schema: z.object({})
    }
  );

  const deleteProteinEntry = tool(
    async ({ entryId }: { entryId: number }) => {
      try {
        if (!entryId) {
          throw new ValidationError("ID da entrada é obrigatório", "entryId", entryId);
        }
        
        const result = await proteinRepository.deleteEntry(userId, entryId);
        
        if (!result.success || !result.deletedEntry) {
          // This shouldn't happen with new error handling, but handle gracefully
          return JSON.stringify({
            success: false,
            error: "Falha ao deletar entrada"
          }, null, 2);
        }
        
        const daily = await proteinRepository.getDailyConsumption(userId, new Date(result.deletedEntry.date));
        const user = await contextService.getUser(userId);
        const target = user.target;
        
        const response: {
          success: boolean;
          message: string;
          deletedEntry: NonNullable<typeof result.deletedEntry>;
          updatedDailyTotal: number;
          date: string;
          remaining?: number;
        } = {
          success: true,
          message: "Entrada deletada com sucesso",
          deletedEntry: result.deletedEntry,
          updatedDailyTotal: result.newDailyTotal ?? 0,
          date: result.deletedEntry.date
        };
        
        if (target !== null) {
          response.remaining = Math.max(0, target - daily.total);
        }
        
        return JSON.stringify(response, null, 2);
      } catch (error) {
        logger.error({ error, userId, entryId, operation: 'deleteProteinEntry' }, 'Error in deleteProteinEntry tool');
        
        if (error instanceof ValidationError) {
          return JSON.stringify({
            success: false,
            error: error.message
          }, null, 2);
        }
        
        if (error instanceof NotFoundError) {
          return JSON.stringify({
            success: false,
            error: error.message
          }, null, 2);
        }
        
        // For other errors, return a generic error message
        return JSON.stringify({
          success: false,
          error: "Erro ao deletar entrada. Por favor, tente novamente."
        }, null, 2);
      }
    },
    {
      name: "delete_protein_entry",
      description: `Deleta uma entrada de consumo de proteína pelo seu ID.
      Use isso quando o usuário quiser remover uma refeição ou entrada específica de seus registros.
      O ID da entrada pode ser encontrado nos resumos de consumo.
      
      Parâmetros:
      - entryId: number (obrigatório) - O ID numérico da entrada a ser deletada`,
      schema: z.object({
        entryId: z.number().describe("O ID da entrada a ser deletada (encontrado nos resumos de consumo)")
      })
    }
  );

  return {
    recordProteinIntake,
    getDailyProteinSummary,
    getAllConsumption,
    deleteProteinEntry
  };
}

