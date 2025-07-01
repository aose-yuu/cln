#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pc from 'picocolors';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read the shell integration script
let shellIntegration;
try {
  shellIntegration = readFileSync(join(__dirname, 'shell-integration.sh'), 'utf8');
} catch (e) {
  // Fallback to inline definition if file not found
  shellIntegration = `
# CLN Shell Integration
# For bash/zsh
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
}

# For fish shell
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
}

console.log(pc.green('✅ CLN has been installed successfully!\n'));
console.log(pc.cyan('ℹ To enable the cd functionality, add the following to your shell configuration:\n'));

// Extract bash/zsh function
const bashFunction = shellIntegration.match(/# For bash\/zsh\ncln\(\) \{[\s\S]*?\n\}/)?.[0] || '';

console.log(pc.bold('┌─ For bash (~/.bashrc) or zsh (~/.zshrc) ─┐'));
console.log(bashFunction);
console.log(pc.bold('└─────────────────────────────────────────────┘\n'));

// Extract fish function
const fishStart = shellIntegration.indexOf('# For fish shell');
const fishFunction = fishStart > -1 ? shellIntegration.substring(fishStart).split('\n\n')[0] : '';

console.log(pc.bold('┌─ For fish (~/.config/fish/config.fish) ─┐'));
console.log(fishFunction);
console.log(pc.bold('└──────────────────────────────────────────┘\n'));

console.log(pc.cyan('ℹ For tab completion, add the following to your shell configuration:\n'));

console.log(pc.bold('┌─ For bash ─┐'));
console.log(`_cln_completion() {
  local cur prev
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  
  local commands="add create list delete config"
  
  if [ $COMP_CWORD -eq 1 ]; then
    COMPREPLY=( $(compgen -W "\${commands}" -- \${cur}) )
  fi
}
complete -F _cln_completion cln`);
console.log(pc.bold('└────────────┘\n'));

console.log(pc.bold('┌─ For zsh ─┐'));
console.log('autoload -U compinit && compinit');
console.log(pc.bold('└───────────┘\n'));

console.log(pc.cyan('ℹ After adding the function and completion, reload your shell configuration:'));
console.log(pc.gray('  source ~/.bashrc    # for bash'));
console.log(pc.gray('  source ~/.zshrc     # for zsh'));
console.log(pc.gray('  source ~/.config/fish/config.fish  # for fish\n'));