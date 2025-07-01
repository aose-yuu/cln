import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { BranchInput } from '../../components/BranchInput.js';

describe('BranchInput', () => {
  it('should display repository name and prompt', () => {
    const { lastFrame } = render(
      <BranchInput 
        repositoryName="test-repo" 
        onSubmit={() => {}} 
      />
    );
    
    expect(lastFrame()).toContain('Enter branch name for test-repo:');
  });

  it('should render placeholder text', () => {
    const { lastFrame } = render(
      <BranchInput 
        repositoryName="test-repo" 
        onSubmit={() => {}} 
      />
    );
    
    expect(lastFrame()).toContain('main');
  });
});