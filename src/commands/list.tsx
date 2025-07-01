import React, { useEffect, useState } from 'react';
import { Command } from 'commander';
import { render, Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { listClonedRepositories } from '../utils/git.js';
import { ErrorDisplay } from '../components/ErrorDisplay.js';
import type { ClonedRepository } from '../types.js';

export const ListCommand: React.FC = () => {
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');
  const [repositories, setRepositories] = useState<ClonedRepository[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    try {
      const repos = await listClonedRepositories();
      setRepositories(repos);
      setState('done');
      
      if (repos.length === 0) {
        setTimeout(() => process.exit(0), 500);
      } else {
        setTimeout(() => process.exit(0), 2000);
      }
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Failed to list repositories');
    }
  };

  switch (state) {
    case 'loading':
      return (
        <Box>
          <Spinner type="dots" />
          <Text> Loading cloned repositories...</Text>
        </Box>
      );
    case 'done':
      if (repositories.length === 0) {
        return (
          <Text color="yellow">
            No repositories have been cloned yet.
          </Text>
        );
      }

      // Group by repository name
      const grouped = repositories.reduce((acc, repo) => {
        if (!acc[repo.repository]) {
          acc[repo.repository] = [];
        }
        acc[repo.repository].push(repo);
        return acc;
      }, {} as Record<string, ClonedRepository[]>);

      return (
        <Box flexDirection="column">
          <Text bold color="green" underline>
            Cloned Repositories:
          </Text>
          <Box marginTop={1} flexDirection="column">
            {Object.entries(grouped).map(([repoName, branches]) => (
              <Box key={repoName} flexDirection="column" marginBottom={1}>
                <Text bold color="cyan">📁 {repoName}</Text>
                {branches.map(branch => (
                  <Box key={branch.path} paddingLeft={2}>
                    <Text>
                      <Text color="gray">└─ </Text>
                      <Text color="yellow">{branch.branch}</Text>
                      <Text color="gray"> → {branch.path}</Text>
                    </Text>
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      );
    case 'error':
      return <ErrorDisplay error={error} />;
  }
};

export const listCommand = new Command('list')
  .description('List all cloned repositories grouped by repository')
  .action(() => {
    render(<ListCommand />);
  });