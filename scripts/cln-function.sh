#!/bin/bash
# CLN Shell Function
# This file provides the shell function needed for cd integration

# Bash/Zsh function
cln() {
  local tempfile="/tmp/.cln_cd_path"
  
  # Run the actual cln command
  command cln "$@"
  local exit_code=$?
  
  # If the command succeeded and created a cd path file
  if [ $exit_code -eq 0 ] && [ -f "$tempfile" ]; then
    local target_dir=$(cat "$tempfile")
    rm -f "$tempfile"
    
    # Only cd if it's a clone operation (no arguments or 'create' command)
    if [ $# -eq 0 ] || [ "$1" = "create" ]; then
      cd "$target_dir"
    fi
  fi
  
  return $exit_code
}