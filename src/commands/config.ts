import { Command } from 'commander';
import open from 'open';
import { consola } from 'consola';
import { getSettingsPath, ensureConfigDir } from '../utils/settings.js';

export const configCommand = new Command('config')
  .description('Open the settings file in your default editor')
  .action(async () => {
    try {
      await ensureConfigDir();
      const settingsPath = getSettingsPath();
      
      consola.info(`Opening settings file: ${settingsPath}`);
      await open(settingsPath);
      
      process.exit(0);
    } catch (error) {
      consola.error('Failed to open settings file:', error);
      process.exit(1);
    }
  });