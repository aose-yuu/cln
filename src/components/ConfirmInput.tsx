import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface ConfirmInputProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmInput: React.FC<ConfirmInputProps> = ({ onConfirm, onCancel }) => {
  const [value, setValue] = useState('');

  useInput((input: string, key: any) => {
    if (key.return) {
      const answer = value.toLowerCase();
      if (answer === 'y' || answer === '') {
        onConfirm();
      } else if (answer === 'n') {
        onCancel();
      }
      return;
    }

    if (key.backspace || key.delete) {
      setValue('');
      return;
    }

    if (input && (input.toLowerCase() === 'y' || input.toLowerCase() === 'n')) {
      setValue(input.toLowerCase());
    }
  });

  return (
    <Box>
      <Text>[Y/n] {value}</Text>
    </Box>
  );
};