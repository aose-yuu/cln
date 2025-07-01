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
      spinner.fail(pc.red(`❌ Error: Repository '${repository}' not found in configuration`));
      process.exit(1);
    }
    
    const path = await getClonePath(repository, branch);
    
    // Check if directory already exists
    if (await directoryExists(path)) {
      spinner.fail(pc.red(`❌ Error: Directory already exists: ${path}`));
      process.exit(1);
    }
    
    await ensureParentDirectory(path);
    
    const result = await cloneRepository(url, path, branch);
    
    if (result.success) {
      writeCdPath(path);
      spinner.succeed(pc.green('✅ Successfully cloned!'));
      console.log(pc.gray(`Path: ${path}`));
      
      setTimeout(() => process.exit(0), 1000);
    } else {
      spinner.fail(pc.red(`❌ Error: ${result.error || 'Failed to clone repository'}`));
      process.exit(1);
    }
  } catch (err) {
    spinner.fail(pc.red(`❌ Error: ${err instanceof Error ? err.message : 'An error occurred'}`));
    process.exit(1);
  }
}

export const createCommand = new Command('create')
  .description('Clone a repository with a specific branch')
  .argument('<repository>', 'Repository name')
  .argument('<branch>', 'Branch name')
  .action(createCommandAction)
  .addHelpText('after', '\nRepository names support tab completion.');