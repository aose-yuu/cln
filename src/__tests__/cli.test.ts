import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runInteractiveMode } from '../cli.js';
import * as settings from '../utils/settings.js';
import * as git from '../utils/git.js';
import * as shell from '../utils/shell.js';

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
    green: (str: string) => str,
    red: (str: string) => str,
    gray: (str: string) => str,
    cyan: (str: string) => str,
    bold: (str: string) => str
  }
}));

vi.mock('prompts', () => ({
  default: vi.fn()
}));

vi.mock('../utils/settings.js');

vi.mock('../utils/git.js');

vi.mock('../utils/shell.js');

import prompts from 'prompts';

describe('interactive mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should show error when no repositories configured', async () => {
    const mockListRepositories = vi.fn().mockResolvedValue([]);
    vi.spyOn(settings, 'listRepositories').mockImplementation(mockListRepositories);

    await expect(runInteractiveMode()).rejects.toThrow('process.exit');

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('No repositories configured'));
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should allow selection and cloning of repository', async () => {
    const mockRepos = [
      { name: 'repo1', url: 'https://github.com/test/repo1.git' },
      { name: 'repo2', url: 'https://github.com/test/repo2.git' }
    ];
    const mockPath = '/path/to/repo1/main';

    vi.spyOn(settings, 'listRepositories').mockResolvedValue(mockRepos);
    vi.mocked(prompts)
      .mockResolvedValueOnce({ selectedRepo: mockRepos[0] })
      .mockResolvedValueOnce({ branch: 'main' });
    vi.spyOn(git, 'getClonePath').mockResolvedValue(mockPath);
    vi.spyOn(git, 'directoryExists').mockResolvedValue(false);
    vi.spyOn(git, 'ensureParentDirectory').mockResolvedValue();
    vi.spyOn(git, 'cloneRepository').mockResolvedValue({ success: true });

    await expect(runInteractiveMode()).rejects.toThrow('process.exit');

    expect(prompts).toHaveBeenCalledTimes(2);
    expect(git.cloneRepository).toHaveBeenCalledWith(mockRepos[0].url, mockPath, 'main');
    expect(shell.writeCdPath).toHaveBeenCalledWith(mockPath);
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('should handle cancellation at repository selection', async () => {
    const mockRepos = [{ name: 'repo1', url: 'https://github.com/test/repo1.git' }];

    vi.spyOn(settings, 'listRepositories').mockResolvedValue(mockRepos);
    vi.mocked(prompts).mockResolvedValueOnce({ selectedRepo: undefined });

    await expect(runInteractiveMode()).rejects.toThrow('process.exit');

    expect(console.log).toHaveBeenCalledWith('Cancelled');
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('should handle cancellation at branch input', async () => {
    const mockRepos = [{ name: 'repo1', url: 'https://github.com/test/repo1.git' }];

    vi.spyOn(settings, 'listRepositories').mockResolvedValue(mockRepos);
    vi.mocked(prompts)
      .mockResolvedValueOnce({ selectedRepo: mockRepos[0] })
      .mockResolvedValueOnce({ branch: undefined });

    await expect(runInteractiveMode()).rejects.toThrow('process.exit');

    expect(console.log).toHaveBeenCalledWith('Cancelled');
    expect(process.exit).toHaveBeenCalledWith(0);
  });
});