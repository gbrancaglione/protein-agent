import { vi } from 'vitest';
import type { PrismaClient } from '../../src/generated/prisma/client';

/**
 * Mock Prisma Client for testing
 */
export function createMockPrisma() {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    protein_entries: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  } as unknown as PrismaClient;

  return mockPrisma;
}

/**
 * Mock LangChain ChatModel
 */
export function createMockChatModel() {
  return {
    invoke: vi.fn(),
    stream: vi.fn(),
  };
}

/**
 * Mock LangChain Agent
 */
export function createMockAgent() {
  return {
    invoke: vi.fn(),
    stream: vi.fn(),
  };
}

/**
 * Create a mock user object
 */
export function createMockUser(overrides?: Partial<{
  id: number;
  name: string;
  weight: number | null;
  target: number | null;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}>) {
  return {
    id: 1,
    name: 'Test User',
    weight: 75.5,
    target: 160.0,
    phone: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * Create a mock protein entry
 */
export function createMockProteinEntry(overrides?: Partial<{
  id: number;
  proteinGrams: number;
  description: string;
  timestamp: Date;
  createdAt: Date;
  userId: number;
}>) {
  const now = new Date();
  return {
    id: 1,
    proteinGrams: 30.0,
    description: 'Chicken breast',
    timestamp: now,
    createdAt: now,
    userId: 1,
    ...overrides,
  };
}

/**
 * Create a mock daily consumption object
 */
export function createMockDailyConsumption(overrides?: Partial<{
  date: string;
  entries: Array<{
    id: number;
    proteinGrams: number;
    description: string;
    timestamp: string;
    createdAt: string;
  }>;
  total: number;
}>) {
  const now = new Date();
  const dateKey = now.toISOString().split('T')[0];
  return {
    date: dateKey,
    entries: [
      {
        id: 1,
        proteinGrams: 30.0,
        description: 'Chicken breast',
        timestamp: now.toISOString(),
        createdAt: now.toISOString(),
      },
    ],
    total: 30.0,
    ...overrides,
  };
}

