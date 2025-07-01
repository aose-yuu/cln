# CLN - Git Repository Management CLI

A lightweight and efficient CLI tool for managing Git repositories with an intuitive terminal interface.

## Features

- 🎨 Beautiful interactive UI for repository selection and branch input
- 📁 Automatic directory organization: `~/works/cln/{repository}/{branch}`
- 🚀 Instant directory navigation after cloning (cd integration)
- 🔍 Tab completion for repository names
- 📋 List all cloned repositories grouped by project
- 🗑️ Safe deletion with confirmation prompts
- ⚙️ Easy configuration management

## Installation

```bash
npm install -g cln
```

## Setup

### 1. Enable CD functionality

Add the following function to your shell configuration file:

**For Bash (`~/.bashrc`) or Zsh (`~/.zshrc`):**

```bash
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
```

**For Fish (`~/.config/fish/config.fish`):**

```fish
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
```

### 2. Enable Tab Completion (Optional)

**For Bash:**

```bash
_cln_completion() {
  local cur prev
  COMPREPLY=()
  cur="${COMP_WORDS[COMP_CWORD]}"
  prev="${COMP_WORDS[COMP_CWORD-1]}"
  
  local commands="add create list delete config"
  
  if [ $COMP_CWORD -eq 1 ]; then
    COMPREPLY=( $(compgen -W "${commands}" -- ${cur}) )
  fi
}
complete -F _cln_completion cln
```

**For Zsh:**

Add to `~/.zshrc`:
```bash
autoload -U compinit && compinit
```

### 3. Reload your shell configuration

```bash
source ~/.bashrc    # for bash
source ~/.zshrc     # for zsh
source ~/.config/fish/config.fish  # for fish
```

## Usage

### Interactive Mode (Default)

Simply run `cln` without any arguments:

```bash
cln
```

This will:
1. Show a list of configured repositories
2. Let you select a repository
3. Prompt for a branch name
4. Clone the repository to `~/works/cln/{repo}/{branch}`
5. Automatically cd into the cloned directory

### Commands

#### Add a repository

```bash
cln add <name> <git-url>
```

Example:
```bash
cln add my-app git@github.com:username/my-app.git
```

#### Clone a specific repository and branch

```bash
cln create <repository> <branch>
```

Example:
```bash
cln create my-app feature/new-design
```

#### List all cloned repositories

```bash
cln list
```

Output example:
```
📁 my-app
  └─ main → ~/works/cln/my-app/main
  └─ feature/auth → ~/works/cln/my-app/feature/auth
📁 api
  └─ develop → ~/works/cln/api/develop
```

#### Delete a branch directory

```bash
cln delete <branch-name>
```

This will find all directories with the given branch name and ask for confirmation before deletion.

#### Open configuration file

```bash
cln config
```

Opens the settings file (`~/.config/cln/settings.json`) in your default editor.

## Configuration

The configuration file is located at `~/.config/cln/settings.json`:

```json
{
  "outDir": "~/works/",
  "repositories": {
    "my-app": "git@github.com:username/my-app.git",
    "api": "git@github.com:username/api.git",
    "frontend": "git@github.com:username/frontend.git"
  }
}
```

- `outDir`: Base directory for cloning repositories (default: `~/works/`)
- `repositories`: Map of repository names to Git URLs

## Directory Structure

Cloned repositories are organized as follows:

```
~/works/
└── cln/
    ├── my-app/
    │   ├── main/
    │   ├── feature-auth/
    │   └── bugfix-header/
    ├── api/
    │   ├── develop/
    │   └── release-1.0/
    └── frontend/
        └── main/
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Author

Created with ❤️ using [Ink](https://github.com/vadimdemedes/ink) and TypeScript