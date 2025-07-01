#!/usr/bin/env node
import React, { useState, useEffect } from 'react';
import { render, Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { RepositorySelect } from './components/RepositorySelect.js';
import { BranchInput } from './components/BranchInput.js';
import { ErrorDisplay } from './components/ErrorDisplay.js';
import { listRepositories } from './utils/settings.js';
import { cloneRepository, getClonePath, ensureParentDirectory } from './utils/git.js';
import { writeCdPath } from './utils/shell.js';
import type { Repository } from './types.js';

interface AppState {
  step: 'loading' | 'select-repo' | 'enter-branch' | 'cloning' | 'done' | 'error';
  repositories: Repository[];
  selectedRepository?: Repository;
  branch?: string;
  error?: string;
  clonePath?: string;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    step: 'loading',
    repositories: []
  });

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    try {
      const repos = await listRepositories();
      
      if (repos.length === 0) {
        setState({
          step: 'error',
          repositories: [],
          error: 'No repositories configured. Use "cln add <name> <url>" to add repositories.'
        });
      } else {
        setState({
          step: 'select-repo',
          repositories: repos.map(r => ({ name: r.name, url: r.url }))
        });
      }
    } catch (error) {
      setState({
        step: 'error',
        repositories: [],
        error: error instanceof Error ? error.message : 'Failed to load repositories'
      });
    }
  };

  const handleRepositorySelect = (repository: Repository) => {
    setState(prev => ({
      ...prev,
      step: 'enter-branch',
      selectedRepository: repository
    }));
  };

  const handleBranchSubmit = async (branch: string) => {
    const { selectedRepository } = state;
    if (!selectedRepository) return;

    setState(prev => ({
      ...prev,
      step: 'cloning',
      branch: branch || 'main'
    }));

    try {
      const clonePath = await getClonePath(selectedRepository.name, branch || 'main');
      await ensureParentDirectory(clonePath);
      
      const result = await cloneRepository(
        selectedRepository.url,
        clonePath,
        branch || 'main'
      );

      if (result.success) {
        writeCdPath(clonePath);
        setState(prev => ({
          ...prev,
          step: 'done',
          clonePath
        }));
        
        setTimeout(() => {
          process.exit(0);
        }, 1000);
      } else {
        setState(prev => ({
          ...prev,
          step: 'error',
          error: result.error || 'Failed to clone repository'
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        step: 'error',
        error: error instanceof Error ? error.message : 'An error occurred'
      }));
    }
  };

  switch (state.step) {
    case 'loading':
      return (
        <Box>
          <Spinner type="dots" />
          <Text> Loading repositories...</Text>
        </Box>
      );

    case 'select-repo':
      return (
        <Box flexDirection="column">
          <Text bold color="green">Select a repository to clone:</Text>
          <Box marginTop={1}>
            <RepositorySelect
              repositories={state.repositories}
              onSelect={handleRepositorySelect}
            />
          </Box>
        </Box>
      );

    case 'enter-branch':
      return (
        <BranchInput
          repositoryName={state.selectedRepository!.name}
          onSubmit={handleBranchSubmit}
        />
      );

    case 'cloning':
      return (
        <Box>
          <Spinner type="dots" />
          <Text> Cloning {state.selectedRepository?.name} ({state.branch})...</Text>
        </Box>
      );

    case 'done':
      return (
        <Box flexDirection="column">
          <Text color="green">✅ Successfully cloned!</Text>
          <Text color="gray">Path: {state.clonePath}</Text>
        </Box>
      );

    case 'error':
      return <ErrorDisplay error={state.error || 'Unknown error'} />;
  }
};

export function runInteractiveMode() {
  render(<App />);
}