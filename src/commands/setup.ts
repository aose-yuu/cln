import { Command } from 'commander';
import prompts from 'prompts';
import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, appendFileSync, existsSync } from 'fs';
import pc from 'picocolors';
import { loadSettings, saveSettings, getSettingsPath } from '../utils/settings.js';

const BASH_ZSH_FUNCTION = `
# CLN Shell Integration
cln() {
  # Capture both stdout and the temp file marker
  local output
  output=$(command cln "$@" 2>&1)
  local exit_code=$?
  
  # Extract the temp file path from the output
  local tempfile=$(echo "$output" | grep -o '__CLN_TEMPFILE__:[^ ]*' | cut -d: -f2)
  
  # Show the output without the temp file marker
  echo "$output" | grep -v '__CLN_TEMPFILE__'
  
  # If the command succeeded and created a cd path file
  if [ $exit_code -eq 0 ] && [ -n "$tempfile" ] && [ -f "$tempfile" ]; then
    local target_dir=$(cat "$tempfile")
    rm -f "$tempfile"
    
    # Only cd if it's a clone operation (no arguments or 'create' command)
    if [ $# -eq 0 ] || [ "$1" = "create" ]; then
      cd "$target_dir"
    fi
  fi
  
  return $exit_code
}`;

const FISH_FUNCTION = `# CLN Shell Integration
function cln
  # Capture both stdout and the temp file marker
  set output (command cln $argv 2>&1)
  set exit_code $status
  
  # Extract the temp file path from the output
  set tempfile (echo "$output" | grep -o '__CLN_TEMPFILE__:[^ ]*' | cut -d: -f2)
  
  # Show the output without the temp file marker
  echo "$output" | grep -v '__CLN_TEMPFILE__'
  
  # If the command succeeded and created a cd path file
  if test $exit_code -eq 0; and test -n "$tempfile"; and test -f "$tempfile"
    set target_dir (cat $tempfile)
    rm -f $tempfile
    
    # Only cd if it's a clone operation (no arguments or 'create' command)
    if test (count $argv) -eq 0; or test "$argv[1]" = "create"
      cd $target_dir
    end
  end
  
  return $exit_code
end`;

export async function action() {
  console.log(pc.bold(pc.cyan('\n🚀 CLN Setup\n')));
  
  try {
    // Step 1: Set default output directory
    const settings = await loadSettings();
    const defaultOutDir = join(homedir(), 'cln');
    
    // Always set to default ~/cln
    settings.outDir = defaultOutDir;
    await saveSettings(settings);
    
    // Step 2: Ask about shell function installation
    const { installShell } = await prompts({
      type: 'confirm',
      name: 'installShell',
      message: 'Install shell function for auto-cd?',
      initial: true
    });
    
    if (installShell === undefined) {
      console.log(pc.yellow('\nSetup cancelled'));
      return;
    }
    
    if (installShell) {
      const currentShell = process.env.SHELL?.split('/').pop() || '';
      let shellConfig = '';
      let functionContent = '';
      
      // Determine shell configuration file
      switch (currentShell) {
        case 'bash':
          shellConfig = join(homedir(), '.bashrc');
          functionContent = BASH_ZSH_FUNCTION;
          break;
        case 'zsh':
          shellConfig = join(homedir(), '.zshrc');
          functionContent = BASH_ZSH_FUNCTION;
          break;
        case 'fish':
          shellConfig = join(homedir(), '.config', 'fish', 'functions', 'cln.fish');
          functionContent = FISH_FUNCTION;
          break;
        default:
          console.log(pc.yellow(`\n⚠️  Unknown shell: ${currentShell || 'none detected'}`));
          console.log(pc.gray('Please add the shell function manually:'));
          console.log(pc.gray('\nFor bash/zsh:'));
          console.log(pc.gray(BASH_ZSH_FUNCTION));
          console.log(pc.gray('\nFor fish:'));
          console.log(pc.gray(FISH_FUNCTION));
          shellConfig = '';
      }
      
      if (shellConfig) {
        console.log(pc.gray(`Detected shell: ${currentShell}`));
        
        try {
          // Check if function already exists
          if (existsSync(shellConfig)) {
            const content = readFileSync(shellConfig, 'utf-8');
            if (content.includes('CLN Shell Integration')) {
              console.log(pc.yellow(`⚠️  Shell function already installed in ${shellConfig.replace(homedir(), '~')}`));
            } else {
              // Append function to shell config
              appendFileSync(shellConfig, '\n' + functionContent + '\n');
              console.log(pc.green(`✅ Shell function added to ${shellConfig.replace(homedir(), '~')}`));
            }
          } else {
            // Create file with function
            appendFileSync(shellConfig, functionContent + '\n');
            console.log(pc.green(`✅ Shell function added to ${shellConfig.replace(homedir(), '~')}`));
          }
        } catch (error) {
          console.log(pc.yellow(`\n⚠️  Could not write to ${shellConfig.replace(homedir(), '~')}`));
          console.log(pc.gray('Please add the shell function manually:'));
          console.log(pc.gray(functionContent));
        }
      }
    }
    
    console.log(pc.bold(pc.cyan('\n✨ Setup complete!\n')));
    console.log(pc.gray('Configuration:'));
    console.log(pc.gray(`  Clone directory: ~/cln/`));
    console.log(pc.gray(`  Config file: ${getSettingsPath().replace(homedir(), '~')}`));
    console.log(pc.gray('\nTo change the clone directory, edit the config file directly.'));
    
    if (installShell && process.env.SHELL) {
      const currentShell = process.env.SHELL.split('/').pop();
      if (['bash', 'zsh'].includes(currentShell || '')) {
        console.log(pc.gray(`\nPlease reload your shell configuration:`));
        console.log(pc.cyan(`  source ~/.${currentShell}rc`));
      } else if (currentShell === 'fish') {
        console.log(pc.gray(`\nThe function is now available in new shell sessions.`));
      }
    }
    
    console.log(pc.gray('\nYou can now use:'));
    console.log(pc.gray('  cln              # Interactive mode'));
    console.log(pc.gray('  cln add          # Add a repository'));
    console.log(pc.gray('  cln create       # Clone a repository'));
    console.log(pc.gray('  cln list         # List cloned repositories\n'));
  } catch (error) {
    console.error(pc.red('Error:'), error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

export const setupCommand = new Command('setup')
  .description('Setup CLN configuration')
  .action(action);