import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockUser, createMockDailyConsumption } from '../helpers/mocks.js';

// Mock LangChain
vi.mock('langchain', () => ({
  createAgent: vi.fn(),
  initChatModel: vi.fn(),
}));

// Mock dependencies
vi.mock('../../src/tools/proteinTools.js', () => ({
  createProteinTools: vi.fn(),
}));

vi.mock('../../src/services/contextService.js', () => ({
  default: {
    getContextString: vi.fn(),
  },
}));

import { createAgent, initChatModel } from 'langchain';
import { createProteinTools } from '../../src/tools/proteinTools.js';
import contextService from '../../src/services/contextService.js';
import { createProteinAgent } from '../../src/agent/proteinAgent.js';

describe('ProteinAgent', () => {
  const userId = 1;
  let mockModel: any;
  let mockAgent: any;
  let mockTools: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockModel = {
      invoke: vi.fn(),
      stream: vi.fn(),
    };

    mockAgent = {
      invoke: vi.fn(),
      stream: vi.fn(),
    };

    mockTools = {
      recordProteinIntake: { name: 'record_protein_intake' },
      getDailyProteinSummary: { name: 'get_daily_protein_summary' },
      getAllConsumption: { name: 'get_all_consumption' },
      deleteProteinEntry: { name: 'delete_protein_entry' },
    };

    vi.mocked(initChatModel).mockResolvedValue(mockModel);
    vi.mocked(createAgent).mockReturnValue(mockAgent);
    vi.mocked(createProteinTools).mockReturnValue(mockTools);
    vi.mocked(contextService.getContextString).mockResolvedValue('\n\n=== CONTEXTO ATUAL ===\n');
  });

  describe('createProteinAgent', () => {
    it('should initialize chat model with correct parameters', async () => {
      await createProteinAgent(userId);

      expect(initChatModel).toHaveBeenCalledWith('gpt-4o-mini', {
        temperature: 0.3,
      });
    });

    it('should get context string for the user', async () => {
      await createProteinAgent(userId);

      expect(contextService.getContextString).toHaveBeenCalledWith(userId);
    });

    it('should create protein tools for the user', async () => {
      await createProteinAgent(userId);

      expect(createProteinTools).toHaveBeenCalledWith(userId);
    });

    it('should create agent with model, tools, and system prompt', async () => {
      await createProteinAgent(userId);

      expect(createAgent).toHaveBeenCalledWith({
        model: mockModel,
        tools: [
          mockTools.recordProteinIntake,
          mockTools.getDailyProteinSummary,
          mockTools.getAllConsumption,
          mockTools.deleteProteinEntry,
        ],
        systemPrompt: expect.any(Object),
      });
    });

    it('should include context in system prompt', async () => {
      const contextString = '\n\n=== CONTEXTO ATUAL ===\nUser: Test\n';
      vi.mocked(contextService.getContextString).mockResolvedValue(contextString);

      await createProteinAgent(userId);

      const callArgs = vi.mocked(createAgent).mock.calls[0][0];
      const systemPromptContent = callArgs.systemPrompt.content;

      expect(systemPromptContent).toContain('assistente útil para rastreamento de proteína');
      expect(systemPromptContent).toContain(contextString);
    });

    it('should return the created agent', async () => {
      const agent = await createProteinAgent(userId);

      expect(agent).toBe(mockAgent);
    });

    it('should include all required tools in system prompt', async () => {
      await createProteinAgent(userId);

      const callArgs = vi.mocked(createAgent).mock.calls[0][0];
      const systemPromptContent = callArgs.systemPrompt.content;

      expect(systemPromptContent).toContain('record_protein_intake');
      expect(systemPromptContent).toContain('get_daily_protein_summary');
      expect(systemPromptContent).toContain('get_all_consumption');
      expect(systemPromptContent).toContain('delete_protein_entry');
    });

    it('should include protein estimation guidelines in system prompt', async () => {
      await createProteinAgent(userId);

      const callArgs = vi.mocked(createAgent).mock.calls[0][0];
      const systemPromptContent = callArgs.systemPrompt.content;

      expect(systemPromptContent).toContain('Peito de frango');
      expect(systemPromptContent).toContain('Carne bovina');
      expect(systemPromptContent).toContain('Ovos');
    });
  });
});

