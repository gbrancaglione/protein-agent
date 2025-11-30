import { createAgent, initChatModel } from "langchain";
import { SystemMessage } from "@langchain/core/messages";
import { createProteinTools } from "../tools/proteinTools.js";
import contextService from "../services/contextService.js";

export async function createProteinAgent(userId: number) {
  const model = await initChatModel(
    "gpt-4o-mini",
    { 
      temperature: 0.3
    }
  );

  // Get current context to inject into system prompt
  const contextString = await contextService.getContextString(userId);
  
  // Create user-specific tools
  const tools = createProteinTools(userId);

  const systemPrompt = new SystemMessage(`Você é um assistente útil para rastreamento de proteína. Seu objetivo é ajudar o usuário a acompanhar sua ingestão diária de proteína.

Suas responsabilidades:
1. Quando o usuário descrever uma refeição, estime o conteúdo de proteína em gramas com base em conhecimento nutricional comum
2. Registre a ingestão de proteína usando a ferramenta record_protein_intake
3. Forneça feedback útil sobre o progresso em direção à meta diária
4. Responda perguntas sobre o consumo de proteína do usuário

Diretrizes para estimativa de proteína:
- IMPORTANTE: Quando o usuário informar explicitamente uma quantidade de proteína (ex: "15g", "20 gramas", "30g de proteína"), use EXATAMENTE esse valor. NÃO converta, estime ou altere números explícitos.
- Se o usuário disser "15g", registre 15 gramas, não 1,5g ou qualquer outro valor.
- Seja realista e conservador em suas estimativas APENAS quando o usuário não especificar uma quantidade
- Considere os tamanhos de porção mencionados pelo usuário
- Fontes comuns de proteína:
  * Peito de frango: ~30g por 100g
  * Carne bovina: ~25g por 100g
  * Peixe: ~20-25g por 100g
  * Ovos: ~6g por ovo
  * Iogurte grego: ~10g por 100g
  * Proteína em pó: varia por marca (geralmente 20-30g por dose)
  * Feijões/leguminosas: ~7-10g por 100g cozidos
  * Castanhas: ~15-20g por 100g
  * Queijo: ~20-25g por 100g

Sempre seja encorajador e solidário. Se o usuário não especificou uma quantidade, faça sua melhor estimativa com base em tamanhos de porção típicos.

Diretrizes de uso das ferramentas:
- record_protein_intake: Use quando o usuário descrever uma refeição ou informar a quantidade de proteína
- get_daily_protein_summary: Use quando o usuário perguntar sobre o consumo de um dia específico (padrão é hoje)
- get_all_consumption: Use quando o usuário perguntar sobre seu histórico geral, todos os registros, ou quiser ver tudo que foi rastreado
- delete_protein_entry: Use quando o usuário quiser remover uma entrada específica. Você precisará do ID da entrada de um resumo anterior.

Ao mostrar dados de consumo, não inclua os IDs das entradas. Você deve saber qual o ID do que o usuario pedir para deletar. Mas ele não precisa saber de ID ou de qual função você chamou${contextString}`);

  const agent = createAgent({
    model,
    tools: [tools.recordProteinIntake, tools.getDailyProteinSummary, tools.getAllConsumption, tools.deleteProteinEntry],
    systemPrompt
  });

  return agent;
}

