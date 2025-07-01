import { Command } from 'commander';
import ora from 'ora';
import pc from 'picocolors';
import { listClonedRepositories } from '../utils/git.js';
import type { ClonedRepository } from '../types.js';

export async function listCommandAction() {
  const spinner = ora('Loading cloned repositories...').start();
  
  try {
    const repos = await listClonedRepositories();
    spinner.stop();
    
    if (repos.length === 0) {
      console.log(pc.yellow('No repositories have been cloned yet.'));
      return;
    }
    
    // Group by repository name
    const grouped = groupByRepository(repos);
    
    // Display results
    console.log(pc.bold(pc.cyan('\nCloned Repositories:')));
    console.log();
    
    Object.entries(grouped).forEach(([repoName, branches]) => {
      console.log(`📁 ${pc.bold(repoName)}`);
      branches.forEach((branch, index) => {
        const isLast = index === branches.length - 1;
        const prefix = isLast ? '└── ' : '├── ';
        console.log(`${pc.gray(prefix)}${pc.green(branch.branch)} → ${pc.dim(branch.path)}`);
      });
      console.log();
    });
  } catch (err) {
    spinner.fail(pc.red('Failed to list repositories'));
    console.error(pc.red('Error:'), err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

function groupByRepository(repos: ClonedRepository[]): Record<string, ClonedRepository[]> {
  const grouped: Record<string, ClonedRepository[]> = {};
  
  for (const repo of repos) {
    if (!grouped[repo.repository]) {
      grouped[repo.repository] = [];
    }
    grouped[repo.repository].push(repo);
  }
  
  return grouped;
}

export const listCommand = new Command('list')
  .description('List all cloned repositories grouped by repository')
  .action(listCommandAction);