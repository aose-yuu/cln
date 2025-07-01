#!/usr/bin/env node
import prompts from 'prompts';
import ora from 'ora';
import pc from 'picocolors';
import { listRepositories } from './utils/settings.js';
import { cloneRepository, getClonePath, ensureParentDirectory, directoryExists } from './utils/git.js';
import { writeCdPath } from './utils/shell.js';


export async function runInteractiveMode() {
  const spinner = ora('Loading repositories...').start();
  
  try {
    const repos = await listRepositories();
    spinner.stop();
    
    if (repos.length === 0) {
      console.error(pc.red('❌ Error: No repositories configured. Use "cln add <name> <url>" to add repositories.'));
      process.exit(1);
    }
    
    // Repository selection
    const { selectedRepo } = await prompts({
      type: 'select',
      name: 'selectedRepo',
      message: pc.green(pc.bold('Select a repository to clone:')),
      choices: repos.map(r => ({
        title: r.name,
        value: { name: r.name, url: r.url }
      })),
      initial: 0
    });
    
    if (!selectedRepo) {
      console.log(pc.gray('Cancelled'));
      process.exit(0);
    }
    
    // Branch input
    const { branch } = await prompts({
      type: 'text',
      name: 'branch',
      message: `Enter branch name for ${pc.cyan(selectedRepo.name)}:`,
      initial: 'main'
    });
    
    if (branch === undefined) {
      console.log(pc.gray('Cancelled'));
      process.exit(0);
    }
    
    // Clone repository
    const cloneSpinner = ora(`Cloning ${selectedRepo.name} (${branch || 'main'})...`).start();
    
    try {
      const clonePath = await getClonePath(selectedRepo.name, branch || 'main');
      
      // Check if directory already exists
      if (await directoryExists(clonePath)) {
        cloneSpinner.fail(pc.red(`❌ Error: Directory already exists: ${clonePath}`));
        process.exit(1);
      }
      
      await ensureParentDirectory(clonePath);
      
      const result = await cloneRepository(
        selectedRepo.url,
        clonePath,
        branch || 'main'
      );
      
      if (result.success) {
        writeCdPath(clonePath);
        cloneSpinner.succeed(pc.green('✅ Successfully cloned!'));
        console.log(pc.gray(`Path: ${clonePath}`));
        process.exit(0);
      } else {
        cloneSpinner.fail(pc.red(`❌ Error: ${result.error || 'Failed to clone repository'}`));
        process.exit(1);
      }
    } catch (error) {
      cloneSpinner.fail(pc.red(`❌ Error: ${error instanceof Error ? error.message : 'An error occurred'}`));
      process.exit(1);
    }
  } catch (error) {
    spinner.fail(pc.red(`❌ Error: ${error instanceof Error ? error.message : 'Failed to load repositories'}`));
    process.exit(1);
  }
}