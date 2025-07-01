import { Command } from 'commander';
import ora from 'ora';
import pc from 'picocolors';
import { addRepository } from '../utils/settings.js';
import { sanitizeErrorMessage } from '../utils/security.js';

export async function addCommandAction(name: string, url: string) {
  const spinner = ora(`Adding repository ${name}...`).start();
  
  try {
    await addRepository(name, url);
    spinner.succeed(pc.green(`✅ Successfully added repository '${name}' with URL: ${url}`));
    process.exit(0);
  } catch (err) {
    spinner.fail(pc.red(`❌ Error: ${sanitizeErrorMessage(err)}`));
    process.exit(1);
  }
}

export const addCommand = new Command('add')
  .description('Add a new repository to the configuration')
  .argument('<name>', 'Repository name')
  .argument('<url>', 'Git repository URL')
  .action(addCommandAction);