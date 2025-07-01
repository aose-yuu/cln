import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCommandAction } from '../../commands/create.js';
import * as settings from '../../utils/settings.js';
import * as git from '../../utils/git.js';
import * as shell from '../../utils/shell.js';

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
    red: (str: string) => str,
    gray: (str: string) => str
  }
}));

vi.mock('../../utils/settings.js', () => ({
  getRepositoryUrl: vi.fn()
}));

vi.mock('../../utils/git.js', () => ({
  getClonePath: vi.fn(),
  directoryExists: vi.fn(),
  ensureParentDirectory: vi.fn(),
  cloneRepository: vi.fn()
}));

vi.mock('../../utils/shell.js', () => ({
  writeCdPath: vi.fn()
}));

describe('create command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should clone repository successfully', async () => {
    const mockPath = '/path/to/repo/branch';
    vi.mocked(settings.getRepositoryUrl).mockResolvedValue('https://github.com/test/repo.git');
    vi.mocked(git.getClonePath).mockResolvedValue(mockPath);
    vi.mocked(git.directoryExists).mockResolvedValue(false);
    vi.mocked(git.ensureParentDirectory).mockResolvedValue();
    vi.mocked(git.cloneRepository).mockResolvedValue({ success: true });

    // Use fake timers to control setTimeout
    vi.useFakeTimers();
    
    // Start the command action
    const promise = createCommandAction('test-repo', 'main');
    
    // Wait for writeCdPath to be called
    await vi.waitFor(() => {
      expect(shell.writeCdPath).toHaveBeenCalled();
    });
    
    // Now advance timers
    await vi.runAllTimersAsync();
    
    await expect(promise).rejects.toThrow('process.exit');

    expect(settings.getRepositoryUrl).toHaveBeenCalledWith('test-repo');
    expect(git.cloneRepository).toHaveBeenCalledWith('https://github.com/test/repo.git', mockPath, 'main');
    expect(shell.writeCdPath).toHaveBeenCalledWith(mockPath);
    expect(process.exit).toHaveBeenCalledWith(0);

    vi.useRealTimers();
  });

  it('should fail if repository not found in configuration', async () => {
    vi.mocked(settings.getRepositoryUrl).mockResolvedValue(undefined);

    await expect(createCommandAction('unknown-repo', 'main')).rejects.toThrow('process.exit');

    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should fail if directory already exists', async () => {
    const mockPath = '/path/to/repo/branch';
    vi.mocked(settings.getRepositoryUrl).mockResolvedValue('https://github.com/test/repo.git');
    vi.mocked(git.getClonePath).mockResolvedValue(mockPath);
    vi.mocked(git.directoryExists).mockResolvedValue(true);

    await expect(createCommandAction('test-repo', 'main')).rejects.toThrow('process.exit');

    expect(git.cloneRepository).not.toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should handle clone failure', async () => {
    const mockPath = '/path/to/repo/branch';
    vi.mocked(settings.getRepositoryUrl).mockResolvedValue('https://github.com/test/repo.git');
    vi.mocked(git.getClonePath).mockResolvedValue(mockPath);
    vi.mocked(git.directoryExists).mockResolvedValue(false);
    vi.mocked(git.ensureParentDirectory).mockResolvedValue();
    vi.mocked(git.cloneRepository).mockResolvedValue({ success: false, error: 'Clone failed' });

    await expect(createCommandAction('test-repo', 'main')).rejects.toThrow('process.exit');

    expect(process.exit).toHaveBeenCalledWith(1);
  });
});