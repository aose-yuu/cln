import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import { AddCommand } from '../../commands/add.js';
import { addRepository } from '../../utils/settings.js';

// Mock the settings module
vi.mock('../../utils/settings.js');

describe('Add Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display success message when repository is added', async () => {
    vi.mocked(addRepository).mockResolvedValue(undefined);
    
    const { lastFrame } = render(
      <AddCommand name="test-repo" url="https://github.com/test/repo.git" />
    );
    
    // Wait for async operation
    await vi.waitFor(() => {
      expect(lastFrame()).toContain('Successfully added repository');
      expect(lastFrame()).toContain('test-repo');
      expect(lastFrame()).toContain('https://github.com/test/repo.git');
    });
    
    expect(addRepository).toHaveBeenCalledWith('test-repo', 'https://github.com/test/repo.git');
  });

  it('should display error message when add fails', async () => {
    vi.mocked(addRepository).mockRejectedValue(new Error('Failed to add'));
    
    const { lastFrame } = render(
      <AddCommand name="test-repo" url="https://github.com/test/repo.git" />
    );
    
    await vi.waitFor(() => {
      expect(lastFrame()).toContain('Error');
      expect(lastFrame()).toContain('Failed to add');
    });
  });
});