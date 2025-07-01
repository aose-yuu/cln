import { Command } from 'commander';
import open from 'open';
import pc from 'picocolors';
import { getSettingsPath, ensureConfigDir } from '../utils/settings.js';

export const configCommand = new Command('config')
  .description('Open the settings file in your default editor')
  .action(async () => {
    try {
      await ensureConfigDir();
      const settingsPath = getSettingsPath();
      
      console.log(pc.cyan(`Opening settings file: ${settingsPath}`));
      await open(settingsPath);
      
      process.exit(0);
    } catch (error) {
      console.error(pc.red(`❌ Error: Failed to open settings file: ${error}`));
      process.exit(1);
    }
  });