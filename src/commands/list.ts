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
      process.exit(0);
    }
    
    // Group by repository name
    const grouped = repos.reduce((acc, repo) => {
      if (!acc[repo.repository]) {
        acc[repo.repository] = [];
      }
      acc[repo.repository].push(repo);
      return acc;
    }, {} as Record<string, ClonedRepository[]>);
    
    console.log(pc.bold(pc.green(pc.underline('Cloned Repositories:'))));
    console.log(); // Empty line for spacing
    
    Object.entries(grouped).forEach(([repoName, branches]) => {
      console.log(pc.cyan(`📁 ${repoName}`));
      branches.forEach((branch, index) => {
        const isLast = index === branches.length - 1;
        const prefix = isLast ? '  └─' : '  ├─';
        console.log(`${prefix} ${pc.yellow(branch.branch)} → ${pc.gray(branch.path)}`);
      });
      console.log(); // Empty line between repositories
    });
    
    process.exit(0);
  } catch (err) {
    spinner.fail(pc.red(`❌ Error: ${err instanceof Error ? err.message : 'Failed to list repositories'}`));
    process.exit(1);
  }
}

export const listCommand = new Command('list')
  .description('List all cloned repositories grouped by repository')
  .action(listCommandAction);