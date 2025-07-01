import { writeFileSync } from 'fs';
import { createSecureTempPath } from './security.js';

export function writeCdPath(path: string): void {
  // Use a secure temp file with unique name to prevent race conditions
  const tempFile = createSecureTempPath('cln_cd_path');
  
  // Write the path with restrictive permissions (user read/write only)
  writeFileSync(tempFile, path, { mode: 0o600 });
  
  // Output a marker with the temp file path for the shell function to capture
  // This will be hidden from normal output but captured by the shell function
  console.log(`__CLN_TEMPFILE__:${tempFile}`);
}

export function getShellFunction(): string {
  return `
# CLN Shell Integration
# Add this to your ~/.bashrc, ~/.zshrc, or ~/.config/fish/config.fish

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
end
`;
}