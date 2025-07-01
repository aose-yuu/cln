import React, { useEffect, useState } from 'react';
import { Command } from 'commander';
import { render, Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { getRepositoryUrl } from '../utils/settings.js';
import { cloneRepository, getClonePath, ensureParentDirectory } from '../utils/git.js';
import { writeCdPath } from '../utils/shell.js';
import { ErrorDisplay } from '../components/ErrorDisplay.js';

interface CreateCommandProps {
  repository: string;
  branch: string;
}

const CreateCommand: React.FC<CreateCommandProps> = ({ repository, branch }) => {
  const [state, setState] = useState<'cloning' | 'done' | 'error'>('cloning');
  const [error, setError] = useState<string>('');
  const [clonePath, setClonePath] = useState<string>('');

  useEffect(() => {
    handleCreate();
  }, []);

  const handleCreate = async () => {
    try {
      const url = await getRepositoryUrl(repository);
      if (!url) {
        setState('error');
        setError(`Repository '${repository}' not found in configuration`);
        return;
      }

      const path = await getClonePath(repository, branch);
      await ensureParentDirectory(path);
      
      const result = await cloneRepository(url, path, branch);
      
      if (result.success) {
        writeCdPath(path);
        setClonePath(path);
        setState('done');
        setTimeout(() => process.exit(0), 1000);
      } else {
        setState('error');
        setError(result.error || 'Failed to clone repository');
      }
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  switch (state) {
    case 'cloning':
      return (
        <Box>
          <Spinner type="dots" />
          <Text> Cloning {repository} ({branch})...</Text>
        </Box>
      );
    case 'done':
      return (
        <Box flexDirection="column">
          <Text color="green">✅ Successfully cloned!</Text>
          <Text color="gray">Path: {clonePath}</Text>
        </Box>
      );
    case 'error':
      return <ErrorDisplay error={error} />;
  }
};

export const createCommand = new Command('create')
  .description('Clone a repository with a specific branch')
  .argument('<repository>', 'Repository name')
  .argument('<branch>', 'Branch name')
  .action((repository: string, branch: string) => {
    render(<CreateCommand repository={repository} branch={branch} />);
  })
  .addHelpText('after', '\nRepository names support tab completion.');