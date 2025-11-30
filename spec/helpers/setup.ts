import { vi } from 'vitest';
import { createMockPrisma } from './mocks.js';

/**
 * Setup function to be called before each test
 * Resets all mocks and provides a clean state
 */
export function setupTest() {
  vi.clearAllMocks();
}

/**
 * Teardown function to be called after each test
 */
export function teardownTest() {
  vi.restoreAllMocks();
}

