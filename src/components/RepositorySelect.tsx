import React from 'react';
import SelectInput from 'ink-select-input';

interface Repository {
  name: string;
  url: string;
}

interface RepositorySelectProps {
  repositories: Repository[];
  onSelect: (repository: Repository) => void;
}

export const RepositorySelect: React.FC<RepositorySelectProps> = ({ 
  repositories, 
  onSelect 
}) => {
  const options = repositories.map(repo => ({
    label: `${repo.name} (${repo.url})`,
    value: repo.name
  }));

  const handleChange = (value: string) => {
    const selected = repositories.find(repo => repo.name === value);
    if (selected) {
      onSelect(selected);
    }
  };

  return (
    <SelectInput
      items={options}
      onSelect={(item: any) => handleChange(item.value)}
    />
  );
};