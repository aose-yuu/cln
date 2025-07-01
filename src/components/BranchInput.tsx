import React from 'react';
import TextInput from 'ink-text-input';
import { Box, Text } from 'ink';

interface BranchInputProps {
  repositoryName: string;
  onSubmit: (branch: string) => void;
}

export const BranchInput: React.FC<BranchInputProps> = ({ 
  repositoryName, 
  onSubmit 
}) => {
  const [value, setValue] = React.useState('');

  const handleSubmit = (value: string) => {
    onSubmit(value || 'main');
  };

  return (
    <Box flexDirection="column">
      <Text color="cyan">
        Enter branch name for {repositoryName}:
      </Text>
      <Box marginTop={1}>
        <TextInput
          value={value}
          onChange={setValue}
          placeholder="main"
          onSubmit={handleSubmit}
        />
      </Box>
    </Box>
  );
};