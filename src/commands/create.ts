import { Command } from 'commander';
import ora from 'ora';
import pc from 'picocolors';
import { getRepositoryUrl } from '../utils/settings.js';
import { cloneRepository, getClonePath, ensureParentDirectory, directoryExists } from '../utils/git.js';
import { writeCdPath } from '../utils/shell.js';

export async function createCommandAction(repository: string, branch: string) {
  const spinner = ora(`Cloning ${repository} (${branch})...`).start();
  
  try {
    const url = await getRepositoryUrl(repository);
    if (!url) {
      throw new Error(`Repository '${repository}' not found in configuration`);
    }
    
    const path = await getClonePath(repository, branch);
    
    // Check if directory already exists
    if (await directoryExists(path)) {
      throw new Error(`Directory already exists: ${path}`);
    }
    
    spinner.text = 'Preparing directory...';
    await ensureParentDirectory(path);
    
    spinner.text = `Cloning ${repository} (${branch})...`;
    const result = await cloneRepository(url, path, branch);
    
    if (result.success) {
      writeCdPath(path);
      spinner.succeed(pc.green('Repository cloned successfully!'));
      console.log(pc.cyan('Path:'), path);
    } else {
      throw new Error(result.error || 'Failed to clone repository');
    }
  } catch (err) {
    spinner.fail(pc.red('Failed to clone repository'));
    console.error(pc.red('Error:'), err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

export const createCommand = new Command('create')
  .description('Clone a repository with a specific branch')
  .argument('<repository>', 'Repository name')
  .argument('<branch>', 'Branch name')
  .action(createCommandAction);