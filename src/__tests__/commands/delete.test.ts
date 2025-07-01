import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteCommandAction } from '../../commands/delete.js';
import * as git from '../../utils/git.js';
import type { ClonedRepository } from '../../types.js';

// Mock dependencies
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    stop: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn()
  }))
}));

vi.mock('picocolors', () => ({
  default: {
    red: (str: string) => str,
    yellow: (str: string) => str,
    green: (str: string) => str,
    gray: (str: string) => str,
    bold: (str: string) => str
  }
}));

vi.mock('prompts', () => ({
  default: vi.fn()
}));

vi.mock('../../utils/git.js', () => ({
  listClonedRepositories: vi.fn(),
  removeDirectory: vi.fn()
}));

import prompts from 'prompts';

describe('delete command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should delete directories when confirmed', async () => {
    const mockRepos: ClonedRepository[] = [
      { repository: 'repo1', branch: 'feature-branch', path: '/path/to/repo1/feature-branch' },
      { repository: 'repo2', branch: 'feature-branch', path: '/path/to/repo2/feature-branch' }
    ];

    vi.mocked(git.listClonedRepositories).mockResolvedValue(mockRepos);
    vi.mocked(prompts).mockResolvedValue({ shouldDelete: true });
    vi.mocked(git.removeDirectory).mockResolvedValue({ success: true });

    await expect(deleteCommandAction('feature-branch')).rejects.toThrow('process.exit');

    expect(git.listClonedRepositories).toHaveBeenCalled();
    expect(prompts).toHaveBeenCalled();
    expect(git.removeDirectory).toHaveBeenCalledTimes(2);
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('should cancel deletion when not confirmed', async () => {
    const mockRepos: ClonedRepository[] = [
      { repository: 'repo1', branch: 'feature-branch', path: '/path/to/repo1/feature-branch' }
    ];

    vi.mocked(git.listClonedRepositories).mockResolvedValue(mockRepos);
    vi.mocked(prompts).mockResolvedValue({ shouldDelete: false });

    await expect(deleteCommandAction('feature-branch')).rejects.toThrow('process.exit');

    expect(git.removeDirectory).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Cancelled');
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('should fail if no directories found for branch', async () => {
    vi.mocked(git.listClonedRepositories).mockResolvedValue([]);

    await expect(deleteCommandAction('non-existent-branch')).rejects.toThrow('process.exit');

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('No directories found'));
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should handle deletion errors', async () => {
    const mockRepos: ClonedRepository[] = [
      { repository: 'repo1', branch: 'feature-branch', path: '/path/to/repo1/feature-branch' }
    ];

    vi.mocked(git.listClonedRepositories).mockResolvedValue(mockRepos);
    vi.mocked(prompts).mockResolvedValue({ shouldDelete: true });
    vi.mocked(git.removeDirectory).mockResolvedValue({ success: false, error: 'Permission denied' });

    await expect(deleteCommandAction('feature-branch')).rejects.toThrow('process.exit');

    expect(git.removeDirectory).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});