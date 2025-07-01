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
      console.error(pc.red(`❌ Error: No directories found for branch '${branchName}'`));
      process.exit(1);
    }
    
    // Show directories to be deleted
    console.log(pc.bold(pc.yellow('⚠️  The following directories will be deleted:')));
    console.log();
    matches.forEach(dir => {
      console.log(pc.red(`• ${dir.repository}/${dir.branch} → ${dir.path}`));
    });
    console.log();
    
    // Confirm deletion
    const { shouldDelete } = await prompts({
      type: 'confirm',
      name: 'shouldDelete',
      message: `Are you sure you want to delete ${matches.length} director${matches.length === 1 ? 'y' : 'ies'}?`,
      initial: false
    });
    
    if (!shouldDelete) {
      console.log(pc.gray('Cancelled'));
      process.exit(0);
    }
    
    // Delete directories
    const deleteSpinner = ora('Deleting directories...').start();
    let hasErrors = false;
    let errorMessage = '';
    
    for (const dir of matches) {
      const result = await removeDirectory(dir.path);
      if (!result.success) {
        hasErrors = true;
        errorMessage = result.error || 'Failed to delete some directories';
      }
    }
    
    if (hasErrors) {
      deleteSpinner.fail(pc.red(`❌ Error: ${errorMessage}`));
      process.exit(1);
    } else {
      deleteSpinner.succeed(pc.green(`✅ Successfully deleted ${matches.length} director${matches.length === 1 ? 'y' : 'ies'}`));
      process.exit(0);
    }
  } catch (err) {
    spinner.fail(pc.red(`❌ Error: ${err instanceof Error ? err.message : 'Failed to find directories'}`));
    process.exit(1);
  }
}

export const deleteCommand = new Command('delete')
  .description('Delete directories for a specific branch name')
  .argument('<branch-name>', 'Branch name to delete')
  .action(deleteCommandAction);