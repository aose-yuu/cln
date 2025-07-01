import { describe, it, expect, beforeEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { 
  loadSettings, 
  addRepository, 
  listRepositories,
  expandPath 
} from '../../utils/settings.js';
import { homedir } from 'os';

// Mock file system
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
  }
}));

describe('Settings utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadSettings', () => {
    it('should return default settings when file does not exist', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT'));
      
      const settings = await loadSettings();
      
      expect(settings.outDir).toBe(`${homedir()}/works`);
      expect(settings.repositories).toEqual({});
    });

    it('should load settings from file', async () => {
      const mockSettings = {
        outDir: '~/custom/path',
        repositories: {
          'test-repo': 'https://github.com/test/repo.git'
        }
      };
      
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockSettings));
      
      const settings = await loadSettings();
      
      expect(settings.outDir).toBe('~/custom/path');
      expect(settings.repositories['test-repo']).toBe('https://github.com/test/repo.git');
    });
  });

  describe('addRepository', () => {
    it('should add repository to settings', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT'));
      
      await addRepository('new-repo', 'https://github.com/new/repo.git');
      
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"new-repo": "https://github.com/new/repo.git"')
      );
    });
  });

  describe('listRepositories', () => {
    it('should return array of repositories', async () => {
      const mockSettings = {
        outDir: '~/works',
        repositories: {
          'repo1': 'https://github.com/test/repo1.git',
          'repo2': 'https://github.com/test/repo2.git'
        }
      };
      
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockSettings));
      
      const repos = await listRepositories();
      
      expect(repos).toHaveLength(2);
      expect(repos[0]).toEqual({ name: 'repo1', url: 'https://github.com/test/repo1.git' });
      expect(repos[1]).toEqual({ name: 'repo2', url: 'https://github.com/test/repo2.git' });
    });
  });

  describe('expandPath', () => {
    it('should expand tilde to home directory', () => {
      const expanded = expandPath('~/test/path');
      expect(expanded).toBe(`${homedir()}/test/path`);
    });

    it('should return path as-is if no tilde', () => {
      const path = '/absolute/path';
      expect(expandPath(path)).toBe(path);
    });
  });
});