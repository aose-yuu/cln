import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addCommandAction } from '../../commands/add.js';
import * as settings from '../../utils/settings.js';

// Mock dependencies
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn(),
    fail: vi.fn()
  }))
}));

vi.mock('picocolors', () => ({
  default: {
    green: (str: string) => str,
    red: (str: string) => str
  }
}));

vi.mock('../../utils/settings.js', () => ({
  addRepository: vi.fn()
}));

describe('add command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
  });

  it('should add repository successfully', async () => {
    vi.mocked(settings.addRepository).mockResolvedValue();

    await expect(addCommandAction('test-repo', 'https://github.com/test/repo.git'))
      .rejects.toThrow('process.exit');

    expect(settings.addRepository).toHaveBeenCalledWith('test-repo', 'https://github.com/test/repo.git');
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('should handle errors when adding repository', async () => {
    const error = new Error('Failed to add repository');
    vi.mocked(settings.addRepository).mockRejectedValue(error);

    await expect(addCommandAction('test-repo', 'https://github.com/test/repo.git'))
      .rejects.toThrow('process.exit');

    expect(settings.addRepository).toHaveBeenCalledWith('test-repo', 'https://github.com/test/repo.git');
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});