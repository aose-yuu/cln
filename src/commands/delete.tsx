import React, { useEffect, useState } from 'react';
import { Command } from 'commander';
import { render, Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { ConfirmInput } from '../components/ConfirmInput.js';
import { listClonedRepositories, removeDirectory } from '../utils/git.js';
import { ErrorDisplay } from '../components/ErrorDisplay.js';
import type { ClonedRepository } from '../types.js';

interface DeleteCommandProps {
  branchName: string;
}

const DeleteCommand: React.FC<DeleteCommandProps> = ({ branchName }) => {
  const [state, setState] = useState<'loading' | 'confirming' | 'deleting' | 'done' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const [matchingDirs, setMatchingDirs] = useState<ClonedRepository[]>([]);

  useEffect(() => {
    findMatchingDirectories();
  }, []);

  const findMatchingDirectories = async () => {
    try {
      const repos = await listClonedRepositories();
      const matches = repos.filter(repo => repo.branch === branchName);
      
      if (matches.length === 0) {
        setState('error');
        setError(`No directories found for branch '${branchName}'`);
      } else {
        setMatchingDirs(matches);
        setState('confirming');
      }
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Failed to find directories');
    }
  };

  const handleConfirm = async () => {
    setState('deleting');
    
    try {
      let hasErrors = false;
      
      for (const dir of matchingDirs) {
        const result = await removeDirectory(dir.path);
        if (!result.success) {
          hasErrors = true;
          setError(result.error || 'Failed to delete some directories');
        }
      }
      
      if (hasErrors) {
        setState('error');
      } else {
        setState('done');
        setTimeout(() => process.exit(0), 1000);
      }
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Failed to delete directories');
    }
  };

  const handleCancel = () => {
    process.exit(0);
  };

  switch (state) {
    case 'loading':
      return (
        <Box>
          <Spinner type="dots" />
          <Text> Searching for directories with branch '{branchName}'...</Text>
        </Box>
      );
    
    case 'confirming':
      return (
        <Box flexDirection="column">
          <Text bold color="yellow">
            ⚠️  The following directories will be deleted:
          </Text>
          <Box marginTop={1} marginBottom={1} flexDirection="column">
            {matchingDirs.map(dir => (
              <Text key={dir.path} color="red">
                • {dir.repository}/{dir.branch} → {dir.path}
              </Text>
            ))}
          </Box>
          <Box>
            <Text>Are you sure you want to delete {matchingDirs.length} director{matchingDirs.length === 1 ? 'y' : 'ies'}? </Text>
            <ConfirmInput
              onConfirm={handleConfirm}
              onCancel={handleCancel}
            />
          </Box>
        </Box>
      );
    
    case 'deleting':
      return (
        <Box>
          <Spinner type="dots" />
          <Text> Deleting directories...</Text>
        </Box>
      );
    
    case 'done':
      return (
        <Text color="green">
          ✅ Successfully deleted {matchingDirs.length} director{matchingDirs.length === 1 ? 'y' : 'ies'}
        </Text>
      );
    
    case 'error':
      return <ErrorDisplay error={error} />;
  }
};

export const deleteCommand = new Command('delete')
  .description('Delete directories for a specific branch name')
  .argument('<branch-name>', 'Branch name to delete')
  .action((branchName: string) => {
    render(<DeleteCommand branchName={branchName} />);
  });