#!/usr/bin/env node
import { homedir } from 'os';
import { join } from 'path';
import { consola } from 'consola';

consola.success('CLN has been installed successfully!\n');
consola.info('To enable the cd functionality, add the following to your shell configuration:\n');

consola.box('For bash (~/.bashrc) or zsh (~/.zshrc):');
consola.log(`
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
`);

consola.box('For fish (~/.config/fish/config.fish):');
consola.log(`
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
end
`);

consola.info('\nFor tab completion, add the following to your shell configuration:');

consola.box('For bash:');
consola.log(`
_cln_completion() {
  local cur prev
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  
  local commands="add create list delete config"
  
  if [ $COMP_CWORD -eq 1 ]; then
    COMPREPLY=( $(compgen -W "\${commands}" -- \${cur}) )
  fi
}
complete -F _cln_completion cln
`);

consola.box('For zsh:');
consola.log('autoload -U compinit && compinit');

consola.info('\nAfter adding the function and completion, reload your shell configuration:');
consola.log('  source ~/.bashrc    # for bash');
consola.log('  source ~/.zshrc     # for zsh');
consola.log('  source ~/.config/fish/config.fish  # for fish\n');