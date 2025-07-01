import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { addCommandAction } from '../../commands/add.js';
import * as settings from '../../utils/settings.js';
import { 
  mockOraModule, 
  mockPicocolorsModule 
} from '../helpers/mocks.js';
import { 
  expectCommandSuccess, 
  expectCommandError 
} from '../helpers/assertions.js';
import { testUrls } from '../helpers/fixtures.js';

// Mock modules
mockOraModule();
mockPicocolorsModule();

vi.mock('../../utils/settings.js', () => ({
  addRepository: vi.fn()
}));

describe('add command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should add repository successfully', async () => {
      vi.mocked(settings.addRepository).mockResolvedValue();

      await expectCommandSuccess(() => 
        addCommandAction('test-repo', 'https://github.com/test/repo.git')
      );

      expect(settings.addRepository).toHaveBeenCalledWith('test-repo', 'https://github.com/test/repo.git');
    });

    it('should handle various valid repository URLs', async () => {
      vi.mocked(settings.addRepository).mockResolvedValue();

      for (const url of testUrls.valid) {
        await expectCommandSuccess(() => 
          addCommandAction('test-repo', url)
        );
      }

      expect(settings.addRepository).toHaveBeenCalledTimes(testUrls.valid.length);
    });
  });

  describe('error handling', () => {
    it('should handle repository add failure', async () => {
      const error = new Error('Failed to add repository');
      vi.mocked(settings.addRepository).mockRejectedValue(error);

      await expectCommandError(() => 
        addCommandAction('test-repo', 'https://github.com/test/repo.git')
      );

      expect(settings.addRepository).toHaveBeenCalledWith('test-repo', 'https://github.com/test/repo.git');
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Invalid repository name');
      vi.mocked(settings.addRepository).mockRejectedValue(validationError);

      await expectCommandError(() => 
        addCommandAction('../evil', 'https://github.com/test/repo.git')
      );
    });
  });

  describe('edge cases', () => {
    it('should handle very long repository names', async () => {
      const longName = 'a'.repeat(100);
      vi.mocked(settings.addRepository).mockResolvedValue();

      await expectCommandSuccess(() => 
        addCommandAction(longName, 'https://github.com/test/repo.git')
      );
    });

    it('should handle special characters in URLs', async () => {
      vi.mocked(settings.addRepository).mockResolvedValue();

      await expectCommandSuccess(() => 
        addCommandAction('test-repo', 'https://github.com/test/repo-with-dash_underscore.git')
      );
    });
  });
});