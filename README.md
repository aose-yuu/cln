# CLN - Git Repository Management CLI

Lightweight CLI tool for managing Git repositories with automatic directory organization.

## Quick Start

```bash
npm install -g cln
cln setup
```

## Usage

### Interactive Mode
```bash
cln
```
Select repository → Enter branch → Auto-cd to cloned directory

### Commands

```bash
cln add <name> <url>     # Add repository
cln create <repo> <branch>  # Clone specific repo/branch
cln list                 # List all cloned repos
cln delete <branch>      # Delete branch directories
cln config               # Show config path
```

## Directory Structure

```
~/cln/
└── {repository}/
    └── {branch}/
```

## Configuration

`~/.config/cln/settings.json`:
```json
{
  "outDir": "~/cln/",
  "repositories": {
    "my-app": "git@github.com:username/my-app.git",
    "dotfiles": "git@github.com:username/dotfiles.git"
  }
}
```

## Requirements

- Node.js 16+
- Git

## License

MIT