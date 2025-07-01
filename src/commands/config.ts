import { Command } from 'commander';
import { getSettingsPath } from '../utils/settings.js';
import pc from 'picocolors';

export async function configCommandAction() {
  const settingsPath = getSettingsPath();
  console.log(pc.cyan('Settings file:'), settingsPath);
}

export const configCommand = new Command('config')
  .description('Show the settings file path')
  .action(configCommandAction);