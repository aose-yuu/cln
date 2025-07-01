import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listCommandAction } from '../../commands/list.js';
import * as git from '../../utils/git.js';
import type { ClonedRepository } from '../../types.js';

// Mock dependencies
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    stop: vi.fn(),
    fail: vi.fn()
  }))
}));

vi.mock('picocolors', () => ({
  default: {
    yellow: (str: string) => str,
    cyan: (str: string) => str,
    gray: (str: string) => str,
    green: (str: string) => str,
    red: (str: string) => str,
    bold: (str: string) => str,
    underline: (str: string) => str
  }
}));

vi.mock('../../utils/git.js', () => ({
  listClonedRepositories: vi.fn()
}));

describe('list command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should display message when no repositories are cloned', async () => {
    vi.mocked(git.listClonedRepositories).mockResolvedValue([]);

    await expect(listCommandAction()).rejects.toThrow('process.exit');

    expect(git.listClonedRepositories).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('No repositories have been cloned yet.');
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('should list cloned repositories grouped by name', async () => {
    const mockRepos: ClonedRepository[] = [
      { repository: 'repo1', branch: 'main', path: '/path/to/repo1/main' },
      { repository: 'repo1', branch: 'dev', path: '/path/to/repo1/dev' },
      { repository: 'repo2', branch: 'main', path: '/path/to/repo2/main' }
    ];

    vi.mocked(git.listClonedRepositories).mockResolvedValue(mockRepos);

    await expect(listCommandAction()).rejects.toThrow('process.exit');

    expect(git.listClonedRepositories).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Cloned Repositories:'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('📁 repo1'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('📁 repo2'));
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('should handle errors when listing repositories', async () => {
    const error = new Error('Failed to list repositories');
    vi.mocked(git.listClonedRepositories).mockRejectedValue(error);

    await expect(listCommandAction()).rejects.toThrow('process.exit');

    expect(git.listClonedRepositories).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});