#!/bin/bash
# CLN Tab Completion Script

# Bash completion
_cln_completion_bash() {
  local cur prev
  COMPREPLY=()
  cur="${COMP_WORDS[COMP_CWORD]}"
  prev="${COMP_WORDS[COMP_CWORD-1]}"
  
  # Main commands
  local commands="add create list delete config"
  
  # If we're on the first argument, suggest commands
  if [ $COMP_CWORD -eq 1 ]; then
    COMPREPLY=( $(compgen -W "${commands}" -- ${cur}) )
    return 0
  fi
  
  # If previous word is 'create', suggest repository names
  if [ "$prev" = "create" ]; then
    # Try to read repository names from settings file
    local settings_file="$HOME/.config/cln/settings.json"
    if [ -f "$settings_file" ]; then
      # Extract repository names from JSON
      local repos=$(grep -o '"[^"]*"[[:space:]]*:' "$settings_file" | grep -v '"outDir"' | grep -v '"repositories"' | sed 's/"//g' | sed 's/[[:space:]]*://g')
      COMPREPLY=( $(compgen -W "${repos}" -- ${cur}) )
    fi
    return 0
  fi
  
  # If previous word is 'delete', suggest branch names from cloned directories
  if [ "$prev" = "delete" ]; then
    local base_dir="$HOME/works/cln"
    if [ -d "$base_dir" ]; then
      # Get all branch names
      local branches=$(find "$base_dir" -mindepth 2 -maxdepth 2 -type d -exec basename {} \; | sort -u)
      COMPREPLY=( $(compgen -W "${branches}" -- ${cur}) )
    fi
    return 0
  fi
}

# Zsh completion
_cln_completion_zsh() {
  local -a commands repos branches
  
  commands=(
    'add:Add a new repository to the configuration'
    'create:Clone a repository with a specific branch'
    'list:List all cloned repositories'
    'delete:Delete directories for a specific branch'
    'config:Open the settings file'
  )
  
  case "$words[2]" in
    create)
      # Get repository names from settings
      local settings_file="$HOME/.config/cln/settings.json"
      if [[ -f "$settings_file" ]]; then
        repos=($(grep -o '"[^"]*"[[:space:]]*:' "$settings_file" | grep -v '"outDir"' | grep -v '"repositories"' | sed 's/"//g' | sed 's/[[:space:]]*://g'))
        _describe 'repository' repos
      fi
      ;;
    delete)
      # Get branch names from cloned directories
      local base_dir="$HOME/works/cln"
      if [[ -d "$base_dir" ]]; then
        branches=($(find "$base_dir" -mindepth 2 -maxdepth 2 -type d -exec basename {} \; | sort -u))
        _describe 'branch' branches
      fi
      ;;
    *)
      _describe 'command' commands
      ;;
  esac
}

# Register completions
if [ -n "$BASH_VERSION" ]; then
  complete -F _cln_completion_bash cln
elif [ -n "$ZSH_VERSION" ]; then
  compdef _cln_completion_zsh cln
fi