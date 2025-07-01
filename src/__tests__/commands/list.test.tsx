import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import { ListCommand } from '../../commands/list.js';
import { listClonedRepositories } from '../../utils/git.js';

// Mock the git utilities
vi.mock('../../utils/git.js');

describe('List Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display message when no repositories are cloned', async () => {
    vi.mocked(listClonedRepositories).mockResolvedValue([]);
    
    const { lastFrame } = render(<ListCommand />);
    
    await vi.waitFor(() => {
      expect(lastFrame()).toContain('No repositories have been cloned yet');
    });
  });

  it('should display cloned repositories grouped by name', async () => {
    const mockRepos = [
      { repository: 'cms', branch: 'main', path: '~/works/cln/cms/main' },
      { repository: 'cms', branch: 'develop', path: '~/works/cln/cms/develop' },
      { repository: 'api', branch: 'main', path: '~/works/cln/api/main' }
    ];
    
    vi.mocked(listClonedRepositories).mockResolvedValue(mockRepos);
    
    const { lastFrame } = render(<ListCommand />);
    
    await vi.waitFor(() => {
      const output = lastFrame();
      expect(output).toContain('Cloned Repositories:');
      expect(output).toContain('cms');
      expect(output).toContain('main');
      expect(output).toContain('develop');
      expect(output).toContain('api');
    });
  });
});