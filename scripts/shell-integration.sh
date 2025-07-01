#!/bin/bash
# CLN Shell Integration
# This file provides the shell functions needed for cd integration
# Generated from src/utils/shell.ts

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
# Save this part to ~/.config/fish/functions/cln.fish
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