import React from 'react';
import { Box, Text } from 'ink';

interface ErrorDisplayProps {
  error: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  return (
    <Box borderStyle="round" borderColor="red" paddingX={1}>
      <Text color="red">
        ❌ Error: {error}
      </Text>
    </Box>
  );
};