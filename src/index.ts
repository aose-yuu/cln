#!/usr/bin/env node
import { Command } from 'commander';
import { runInteractiveMode } from './cli.js';
import { addCommand } from './commands/add.js';
import { createCommand } from './commands/create.js';
import { listCommand } from './commands/list.js';
import { deleteCommand } from './commands/delete.js';
import { configCommand } from './commands/config.js';

const program = new Command();

program
  .name('cln')
  .description('A beautiful Git repository management CLI tool')
  .version('1.0.0')
  .action(() => {
    // No arguments - run interactive mode
    runInteractiveMode();
  });

// Add subcommands
program.addCommand(addCommand);
program.addCommand(createCommand);
program.addCommand(listCommand);
program.addCommand(deleteCommand);
program.addCommand(configCommand);

// Parse arguments
program.parse(process.argv);