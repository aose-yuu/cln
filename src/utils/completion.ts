import { listRepositories } from './settings.js';
import { listClonedRepositories } from './git.js';

export async function getRepositoryNames(): Promise<string[]> {
  const repositories = await listRepositories();
  return repositories.map(repo => repo.name);
}

export async function getBranchNames(): Promise<string[]> {
  const cloned = await listClonedRepositories();
  const branches = new Set<string>();
  
  cloned.forEach(repo => {
    branches.add(repo.branch);
  });
  
  return Array.from(branches).sort();
}

// This can be called by external completion scripts
export async function generateCompletions(command: string): Promise<string[]> {
  switch (command) {
    case 'repositories':
      return getRepositoryNames();
    case 'branches':
      return getBranchNames();
    default:
      return [];
  }
}