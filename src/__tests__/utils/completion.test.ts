import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRepositoryNames, getBranchNames, generateCompletions } from '../../utils/completion.js';
import * as settings from '../../utils/settings.js';
import * as git from '../../utils/git.js';
import type { Repository, ClonedRepository } from '../../types.js';

vi.mock('../../utils/settings.js', () => ({
  listRepositories: vi.fn()
}));

vi.mock('../../utils/git.js', () => ({
  listClonedRepositories: vi.fn()
}));

describe('completion utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRepositoryNames', () => {
    it('should return repository names', async () => {
      const mockRepos: Repository[] = [
        { name: 'repo1', url: 'https://github.com/user/repo1.git' },
        { name: 'repo2', url: 'https://github.com/user/repo2.git' },
        { name: 'repo3', url: 'https://github.com/user/repo3.git' }
      ];
      vi.mocked(settings.listRepositories).mockResolvedValue(mockRepos);

      const names = await getRepositoryNames();

      expect(names).toEqual(['repo1', 'repo2', 'repo3']);
      expect(settings.listRepositories).toHaveBeenCalled();
    });

    it('should return empty array when no repositories', async () => {
      vi.mocked(settings.listRepositories).mockResolvedValue([]);

      const names = await getRepositoryNames();

      expect(names).toEqual([]);
    });
  });

  describe('getBranchNames', () => {
    it('should return unique branch names sorted', async () => {
      const mockCloned: ClonedRepository[] = [
        { repository: 'repo1', branch: 'main', path: '/path/to/repo1/main' },
        { repository: 'repo2', branch: 'feature/test', path: '/path/to/repo2/feature/test' },
        { repository: 'repo3', branch: 'main', path: '/path/to/repo3/main' },
        { repository: 'repo4', branch: 'develop', path: '/path/to/repo4/develop' }
      ];
      vi.mocked(git.listClonedRepositories).mockResolvedValue(mockCloned);

      const branches = await getBranchNames();

      expect(branches).toEqual(['develop', 'feature/test', 'main']);
      expect(git.listClonedRepositories).toHaveBeenCalled();
    });

    it('should return empty array when no cloned repositories', async () => {
      vi.mocked(git.listClonedRepositories).mockResolvedValue([]);

      const branches = await getBranchNames();

      expect(branches).toEqual([]);
    });
  });

  describe('generateCompletions', () => {
    it('should generate repository completions', async () => {
      const mockRepos: Repository[] = [
        { name: 'repo1', url: 'https://github.com/user/repo1.git' },
        { name: 'repo2', url: 'https://github.com/user/repo2.git' }
      ];
      vi.mocked(settings.listRepositories).mockResolvedValue(mockRepos);

      const completions = await generateCompletions('repositories');

      expect(completions).toEqual(['repo1', 'repo2']);
    });

    it('should generate branch completions', async () => {
      const mockCloned: ClonedRepository[] = [
        { repository: 'repo1', branch: 'main', path: '/path/to/repo1/main' },
        { repository: 'repo2', branch: 'develop', path: '/path/to/repo2/develop' }
      ];
      vi.mocked(git.listClonedRepositories).mockResolvedValue(mockCloned);

      const completions = await generateCompletions('branches');

      expect(completions).toEqual(['develop', 'main']);
    });

    it('should return empty array for unknown command', async () => {
      const completions = await generateCompletions('unknown');

      expect(completions).toEqual([]);
      expect(settings.listRepositories).not.toHaveBeenCalled();
      expect(git.listClonedRepositories).not.toHaveBeenCalled();
    });
  });
});