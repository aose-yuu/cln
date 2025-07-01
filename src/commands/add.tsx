import React, { useEffect, useState } from 'react';
import { Command } from 'commander';
import { render, Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { addRepository } from '../utils/settings.js';
import { ErrorDisplay } from '../components/ErrorDisplay.js';
import { sanitizeErrorMessage } from '../utils/security.js';

interface AddCommandProps {
  name: string;
  url: string;
}

export const AddCommand: React.FC<AddCommandProps> = ({ name, url }) => {
  const [state, setState] = useState<'adding' | 'done' | 'error'>('adding');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    handleAdd();
  }, []);

  const handleAdd = async () => {
    try {
      await addRepository(name, url);
      setState('done');
      setTimeout(() => process.exit(0), 1000);
    } catch (err) {
      setState('error');
      setError(sanitizeErrorMessage(err));
    }
  };

  switch (state) {
    case 'adding':
      return (
        <Box>
          <Spinner type="dots" />
          <Text> Adding repository {name}...</Text>
        </Box>
      );
    case 'done':
      return (
        <Text color="green">
          ✅ Successfully added repository '{name}' with URL: {url}
        </Text>
      );
    case 'error':
      return <ErrorDisplay error={error} />;
  }
};

export const addCommand = new Command('add')
  .description('Add a new repository to the configuration')
  .argument('<name>', 'Repository name')
  .argument('<url>', 'Git repository URL')
  .action((name: string, url: string) => {
    render(<AddCommand name={name} url={url} />);
  });