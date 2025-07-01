import { describe, it, expect, vi, beforeEach } from 'vitest';
import { promises as fs } from 'fs';
import { execa } from 'execa';
import {
  cloneRepository,
  getClonePath,
  ensureParentDirectory,
  directoryExists,
  listClonedRepositories,
  removeDirectory
} from '../utils/git.js';
import * as security from '../utils/security.js';

// Mock external dependencies
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(),
    stat: vi.fn(),
    readdir: vi.fn(),
    rm: vi.fn()
  }
}));

vi.mock('execa');

vi.mock('../utils/settings.js', () => ({
  loadSettings: vi.fn().mockResolvedValue({
    outDir: '~/works',
    repositories: {}
  }),
  expandPath: vi.fn((path) => path.replace('~/', '/home/user/'))
}));

// Spy on security functions to ensure they're called
vi.spyOn(security, 'validateGitUrl');
vi.spyOn(security, 'sanitizeRepositoryName');
vi.spyOn(security, 'sanitizeBranchName');
vi.spyOn(security, 'validatePath');
vi.spyOn(security, 'sanitizeErrorMessage');
vi.spyOn(security, 'escapeShellArg');

describe('Git Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('cloneRepository', () => {
    it('should clone repository successfully', async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as any);
      vi.mocked(security.validateGitUrl).mockReturnValue('https://github.com/user/repo.git');
      vi.mocked(security.sanitizeBranchName).mockReturnValue('main');
      vi.mocked(security.escapeShellArg).mockImplementation((arg) => arg);
      vi.mocked(security.validatePath).mockReturnValue(true);

      const result = await cloneRepository(
        'https://github.com/user/repo.git',
        '/home/user/works/cln/repo/main',
        'main'
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully cloned');
      expect(security.validateGitUrl).toHaveBeenCalledWith('https://github.com/user/repo.git');
      expect(security.sanitizeBranchName).toHaveBeenCalledWith('main');
      expect(execa).toHaveBeenCalledWith('git', [
        'clone',
        'https://github.com/user/repo.git',
        '/home/user/works/cln/repo/main',
        '-b',
        'main'
      ], { shell: false });
    });

    it('should clone without branch if not specified', async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as any);
      vi.mocked(security.validateGitUrl).mockReturnValue('https://github.com/user/repo.git');
      vi.mocked(security.escapeShellArg).mockImplementation((arg) => arg);
      vi.mocked(security.validatePath).mockReturnValue(true);

      await cloneRepository(
        'https://github.com/user/repo.git',
        '/home/user/works/cln/repo/main'
      );

      expect(execa).toHaveBeenCalledWith('git', [
        'clone',
        'https://github.com/user/repo.git',
        '/home/user/works/cln/repo/main'
      ], { shell: false });
    });

    it('should reject invalid target path', async () => {
      vi.mocked(security.validateGitUrl).mockReturnValue('https://github.com/user/repo.git');
      vi.mocked(security.validatePath).mockReturnValue(false);
      vi.mocked(security.sanitizeErrorMessage).mockReturnValue('Invalid target path');

      const result = await cloneRepository(
        'https://github.com/user/repo.git',
        '/etc/passwd'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid target path');
    });

    it('should handle clone errors', async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error('Authentication failed'));
      vi.mocked(security.validateGitUrl).mockReturnValue('https://github.com/user/repo.git');
      vi.mocked(security.escapeShellArg).mockImplementation((arg) => arg);
      vi.mocked(security.validatePath).mockReturnValue(true);
      vi.mocked(security.sanitizeErrorMessage).mockReturnValue('Authentication failed');

      const result = await cloneRepository(
        'https://github.com/user/repo.git',
        '/home/user/works/cln/repo/main'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication failed');
    });
  });

  describe('getClonePath', () => {
    it('should generate correct clone path', async () => {
      vi.mocked(security.sanitizeRepositoryName).mockReturnValue('myrepo');
      vi.mocked(security.sanitizeBranchName).mockReturnValue('feature-branch');

      const path = await getClonePath('my-repo', 'feature/branch');

      expect(path).toBe('/home/user/works/cln/myrepo/feature-branch');
      expect(security.sanitizeRepositoryName).toHaveBeenCalledWith('my-repo');
      expect(security.sanitizeBranchName).toHaveBeenCalledWith('feature/branch');
    });

    it('should handle path traversal attempts', async () => {
      vi.mocked(security.sanitizeRepositoryName).mockReturnValue('repo');
      vi.mocked(security.sanitizeBranchName).mockReturnValue('branch');

      const path = await getClonePath('../../../etc', '../../passwd');

      expect(path).toBe('/home/user/works/cln/repo/branch');
    });
  });

  describe('ensureParentDirectory', () => {
    it('should create parent directory', async () => {
      await ensureParentDirectory('/home/user/works/cln/repo/main');

      expect(fs.mkdir).toHaveBeenCalledWith('/home/user/works/cln/repo', { recursive: true });
    });
  });

  describe('directoryExists', () => {
    it('should return true for existing directory', async () => {
      vi.mocked(fs.stat).mockResolvedValueOnce({
        isDirectory: () => true
      } as any);

      const exists = await directoryExists('/home/user/works/cln/repo');

      expect(exists).toBe(true);
    });

    it('should return false for non-existing directory', async () => {
      vi.mocked(fs.stat).mockRejectedValueOnce(new Error('ENOENT'));

      const exists = await directoryExists('/home/user/works/cln/repo');

      expect(exists).toBe(false);
    });

    it('should return false for files', async () => {
      vi.mocked(fs.stat).mockResolvedValueOnce({
        isDirectory: () => false
      } as any);

      const exists = await directoryExists('/home/user/file.txt');

      expect(exists).toBe(false);
    });
  });

  describe('listClonedRepositories', () => {
    it('should list all cloned repositories', async () => {
      vi.mocked(fs.readdir).mockImplementation((path) => {
        if (path === '/home/user/works/cln') {
          return Promise.resolve(['repo1', 'repo2'] as any);
        }
        if (path === '/home/user/works/cln/repo1') {
          return Promise.resolve(['main', 'feature-branch'] as any);
        }
        if (path === '/home/user/works/cln/repo2') {
          return Promise.resolve(['develop'] as any);
        }
        return Promise.resolve([]);
      });

      vi.mocked(fs.stat).mockResolvedValue({
        isDirectory: () => true
      } as any);

      const repos = await listClonedRepositories();

      expect(repos).toHaveLength(3);
      expect(repos).toContainEqual({
        repository: 'repo1',
        branch: 'main',
        path: '/home/user/works/cln/repo1/main'
      });
      expect(repos).toContainEqual({
        repository: 'repo1',
        branch: 'feature-branch',
        path: '/home/user/works/cln/repo1/feature-branch'
      });
      expect(repos).toContainEqual({
        repository: 'repo2',
        branch: 'develop',
        path: '/home/user/works/cln/repo2/develop'
      });
    });

    it('should handle missing directory', async () => {
      vi.mocked(fs.readdir).mockRejectedValueOnce(new Error('ENOENT'));

      const repos = await listClonedRepositories();

      expect(repos).toEqual([]);
    });
  });

  describe('removeDirectory', () => {
    it('should remove directory within managed area', async () => {
      vi.mocked(security.validatePath).mockReturnValue(true);

      const result = await removeDirectory('/home/user/works/cln/repo/branch');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully removed');
      expect(fs.rm).toHaveBeenCalledWith('/home/user/works/cln/repo/branch', {
        recursive: true,
        force: true
      });
    });

    it('should reject removal outside managed area', async () => {
      vi.mocked(security.validatePath).mockReturnValue(false);
      vi.mocked(security.sanitizeErrorMessage).mockReturnValue('Cannot remove directory outside of managed area');

      const result = await removeDirectory('/etc/passwd');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot remove directory outside of managed area');
      expect(fs.rm).not.toHaveBeenCalled();
    });

    it('should reject removal of base directory', async () => {
      vi.mocked(security.validatePath).mockReturnValue(true);
      vi.mocked(security.sanitizeErrorMessage).mockReturnValue('Cannot remove base directory');

      const result = await removeDirectory('/home/user/works/cln');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot remove base directory');
      expect(fs.rm).not.toHaveBeenCalled();
    });

    it('should handle removal errors', async () => {
      vi.mocked(security.validatePath).mockReturnValue(true);
      vi.mocked(fs.rm).mockRejectedValueOnce(new Error('Permission denied'));
      vi.mocked(security.sanitizeErrorMessage).mockReturnValue('Permission denied');

      const result = await removeDirectory('/home/user/works/cln/repo/branch');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });
  });
});