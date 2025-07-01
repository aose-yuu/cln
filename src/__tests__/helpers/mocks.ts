/**
 * Test mock helpers following functional programming principles
 */

import { vi, expect } from 'vitest';
import type { Ora } from 'ora';

/**
 * Create a mock spinner
 */
export const createMockSpinner = (): Ora => {
  const spinner = {
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    warn: vi.fn().mockReturnThis(),
    info: vi.fn().mockReturnThis(),
    text: '',
    isSpinning: false,
  } as unknown as Ora;
  
  return spinner;
};

/**
 * Create mock prompts
 */
export const createMockPrompts = () => {
  const mock = vi.fn() as any;
  mock.inject = vi.fn();
  return mock;
};

/**
 * Create mock process.exit
 */
export const mockProcessExit = () => {
  const exitMock = vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
    throw new Error(`process.exit(${code})`);
  }) as any;
  
  return {
    expectExitCode: (expectedCode: number) => {
      expect(exitMock).toHaveBeenCalledWith(expectedCode);
    },
    restore: () => exitMock.mockRestore()
  };
};

/**
 * Create mock file system operations
 */
export const createMockFs = () => {
  return {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    rm: vi.fn(),
    stat: vi.fn(),
    access: vi.fn(),
    readdir: vi.fn()
  };
};

/**
 * Create mock execa
 */
export const createMockExeca = () => {
  const mock = vi.fn() as any;
  mock.command = vi.fn();
  return mock;
};

/**
 * Mock ora module
 */
export const mockOraModule = () => {
  vi.mock('ora', () => ({
    default: vi.fn(() => createMockSpinner())
  }));
};

/**
 * Mock picocolors module
 */
export const mockPicocolorsModule = () => {
  vi.mock('picocolors', () => ({
    default: {
      red: (str: string) => str,
      green: (str: string) => str,
      yellow: (str: string) => str,
      cyan: (str: string) => str,
      gray: (str: string) => str,
      bold: (str: string) => str,
      underline: (str: string) => str
    }
  }));
};

/**
 * Create a test context with all common mocks
 */
export const createTestContext = () => {
  const spinner = createMockSpinner();
  const prompts = createMockPrompts();
  const fs = createMockFs();
  const execa = createMockExeca();
  
  return {
    spinner,
    prompts,
    fs,
    execa,
    cleanup: () => {
      vi.clearAllMocks();
    }
  };
};