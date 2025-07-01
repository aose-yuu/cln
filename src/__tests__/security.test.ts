import { describe, it, expect } from 'vitest';
import {
  sanitizeRepositoryName,
  sanitizeBranchName,
  validateGitUrl,
  createSecureTempPath,
  validatePath,
  sanitizeErrorMessage,
  escapeShellArg
} from '../utils/security.js';

describe('Security Utils', () => {
  describe('sanitizeRepositoryName', () => {
    it('should allow valid repository names', () => {
      expect(sanitizeRepositoryName('my-repo')).toBe('my-repo');
      expect(sanitizeRepositoryName('my_repo')).toBe('my_repo');
      expect(sanitizeRepositoryName('myrepo123')).toBe('myrepo123');
    });

    it('should remove path traversal attempts', () => {
      expect(sanitizeRepositoryName('../evil')).toBe('evil');
      expect(sanitizeRepositoryName('../../etc/passwd')).toBe('etcpasswd');
    });

    it('should remove special characters', () => {
      expect(sanitizeRepositoryName('repo$name')).toBe('reponame');
      expect(sanitizeRepositoryName('repo;rm -rf /')).toBe('reporm-rf');
      expect(sanitizeRepositoryName('repo`whoami`')).toBe('repowhoami');
    });

    it('should reject empty names', () => {
      expect(() => sanitizeRepositoryName('')).toThrow('Invalid repository name');
      expect(() => sanitizeRepositoryName('   ')).toThrow('Invalid repository name');
    });

    it('should reject names that are too long', () => {
      const longName = 'a'.repeat(101);
      expect(() => sanitizeRepositoryName(longName)).toThrow('Invalid repository name');
    });
  });

  describe('sanitizeBranchName', () => {
    it('should allow valid branch names', () => {
      expect(sanitizeBranchName('main')).toBe('main');
      expect(sanitizeBranchName('feature/new-feature')).toBe('feature/new-feature');
      expect(sanitizeBranchName('bugfix/issue-123')).toBe('bugfix/issue-123');
    });

    it('should remove path traversal attempts', () => {
      expect(sanitizeBranchName('../../../etc')).toBe('etc');
      expect(sanitizeBranchName('feature/../../../passwd')).toBe('feature/passwd');
    });

    it('should normalize slashes', () => {
      expect(sanitizeBranchName('feature//double')).toBe('feature/double');
      expect(sanitizeBranchName('/leading/')).toBe('leading');
      expect(sanitizeBranchName('trailing/')).toBe('trailing');
    });

    it('should remove dangerous characters', () => {
      expect(sanitizeBranchName('feature;rm -rf')).toBe('featurerm-rf');
      expect(sanitizeBranchName('branch$(whoami)')).toBe('branchwhoami');
    });
  });

  describe('validateGitUrl', () => {
    it('should allow valid Git URLs', () => {
      expect(validateGitUrl('https://github.com/user/repo.git')).toBe('https://github.com/user/repo.git');
      expect(validateGitUrl('git@github.com:user/repo.git')).toBe('git@github.com:user/repo.git');
      expect(validateGitUrl('ssh://git@github.com/user/repo.git')).toBe('ssh://git@github.com/user/repo.git');
    });

    it('should reject URLs with dangerous characters', () => {
      expect(() => validateGitUrl('https://github.com/user/repo.git; rm -rf /')).toThrow();
      expect(() => validateGitUrl('git@github.com:user/repo.git$(whoami)')).toThrow();
      expect(() => validateGitUrl('https://github.com/../../../etc/passwd')).toThrow();
    });

    it('should reject invalid protocols', () => {
      expect(() => validateGitUrl('file:///etc/passwd')).toThrow();
      expect(() => validateGitUrl('ftp://example.com/repo.git')).toThrow();
    });
  });

  describe('createSecureTempPath', () => {
    it('should create unique temp paths', () => {
      const path1 = createSecureTempPath('test');
      const path2 = createSecureTempPath('test');
      expect(path1).not.toBe(path2);
    });

    it('should include prefix in path', () => {
      const path = createSecureTempPath('myprefix');
      expect(path).toContain('myprefix');
    });
  });

  describe('validatePath', () => {
    it('should allow paths within base directory', () => {
      expect(validatePath('/home/user/cln/repo', '/home/user/cln')).toBe(true);
      expect(validatePath('/home/user/cln/repo/branch', '/home/user/cln')).toBe(true);
    });

    it('should reject paths outside base directory', () => {
      expect(validatePath('/home/user/other', '/home/user/cln')).toBe(false);
      expect(validatePath('/etc/passwd', '/home/user/cln')).toBe(false);
      expect(validatePath('/home/user/cln/../other', '/home/user/cln')).toBe(false);
    });
  });

  describe('sanitizeErrorMessage', () => {
    it('should remove file paths', () => {
      const error = new Error('Failed to read /home/user/secret/file.txt');
      expect(sanitizeErrorMessage(error)).toBe('Failed to read [path]');
    });

    it('should remove Windows paths', () => {
      const error = new Error('Cannot access C:\\Users\\Admin\\secret.txt');
      expect(sanitizeErrorMessage(error)).toBe('Cannot access [path]');
    });

    it('should remove Git URLs', () => {
      const error = new Error('Failed to clone git@github.com:user/private-repo.git');
      expect(sanitizeErrorMessage(error)).toBe('Failed to clone [repository]');
    });

    it('should remove HTTP URLs', () => {
      const error = new Error('Cannot connect to https://internal.server.com/api');
      expect(sanitizeErrorMessage(error)).toBe('Cannot connect to [url]');
    });

    it('should handle non-Error objects', () => {
      expect(sanitizeErrorMessage('string error')).toBe('An error occurred');
      expect(sanitizeErrorMessage(null)).toBe('An error occurred');
      expect(sanitizeErrorMessage(undefined)).toBe('An error occurred');
    });
  });

  describe('escapeShellArg', () => {
    it('should not escape safe arguments', () => {
      expect(escapeShellArg('simple')).toBe('simple');
      expect(escapeShellArg('feature/branch')).toBe('feature/branch');
      expect(escapeShellArg('my-repo_123')).toBe('my-repo_123');
    });

    it('should escape arguments with special characters', () => {
      expect(escapeShellArg('arg with spaces')).toBe("'arg with spaces'");
      expect(escapeShellArg('arg;command')).toBe("'arg;command'");
      expect(escapeShellArg('arg$variable')).toBe("'arg$variable'");
    });

    it('should handle single quotes in arguments', () => {
      expect(escapeShellArg("arg'with'quotes")).toBe("'arg'\\''with'\\''quotes'");
    });
  });
});