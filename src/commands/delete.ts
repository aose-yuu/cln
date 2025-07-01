import { Command } from 'commander';
import prompts from 'prompts';
import ora from 'ora';
import pc from 'picocolors';
import { listClonedRepositories, removeDirectory } from '../utils/git.js';

export async function deleteCommandAction(branchName: string) {
  const spinner = ora(`Searching for directories with branch '${branchName}'...`).start();
  
  try {
    const repos = await listClonedRepositories();
    const matches = repos.filter(repo => repo.branch === branchName);
    spinner.stop();
    
    if (matches.length === 0) {
      console.log(pc.yellow(`No directories found with branch '${branchName}'`));
      return;
    }
    
    // Show directories to be deleted
    console.log(pc.bold(pc.red('\nThe following directories will be deleted:')));
    console.log();
    matches.forEach(repo => {
      console.log(`  ${pc.red('✗')} ${repo.repository}/${repo.branch} → ${pc.dim(repo.path)}`);
    });
    console.log();
    
    // Confirm deletion
    const { shouldDelete } = await prompts({
      type: 'confirm',
      name: 'shouldDelete',
      message: `Delete ${matches.length} director${matches.length === 1 ? 'y' : 'ies'}?`,
      initial: false
    });
    
    if (!shouldDelete) {
      console.log(pc.yellow('Deletion cancelled'));
      return;
    }
    
    // Delete directories
    const deleteSpinner = ora('Deleting directories...').start();
    let successCount = 0;
    const errors: string[] = [];
    
    for (const repo of matches) {
      try {
        await removeDirectory(repo.path);
        successCount++;
      } catch (err) {
        errors.push(`Failed to delete ${repo.path}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
    if (errors.length > 0) {
      deleteSpinner.fail(pc.red('Some directories could not be deleted'));
      errors.forEach(error => console.error(pc.red('  • ' + error)));
      process.exit(1);
    } else {
      deleteSpinner.succeed(pc.green(`Deleted ${successCount} director${successCount === 1 ? 'y' : 'ies'}`));
    }
  } catch (err) {
    spinner.fail(pc.red('Failed to search directories'));
    console.error(pc.red('Error:'), err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

export const deleteCommand = new Command('delete')
  .description('Delete cloned repositories by branch name')
  .argument('<branch>', 'Branch name to delete')
  .action(deleteCommandAction);