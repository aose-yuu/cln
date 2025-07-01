import { vi } from 'vitest';

// Mock process.exit to prevent tests from actually exiting
vi.spyOn(process, 'exit').mockImplementation(() => {
  return undefined as never;
});