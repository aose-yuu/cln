import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { RepositorySelect } from '../../components/RepositorySelect.js';

describe('RepositorySelect', () => {
  it('should render repository options', () => {
    const repositories = [
      { name: 'test-repo', url: 'https://github.com/test/repo.git' },
      { name: 'another-repo', url: 'https://github.com/test/another.git' }
    ];
    
    const { lastFrame } = render(
      <RepositorySelect 
        repositories={repositories} 
        onSelect={() => {}} 
      />
    );
    
    expect(lastFrame()).toContain('test-repo');
    expect(lastFrame()).toContain('https://github.com/test/repo.git');
  });
});