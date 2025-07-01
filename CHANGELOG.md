# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2025-07-01

### 🎉 Initial Release

A lightweight Git repository management CLI tool that helps you organize and manage multiple Git repositories with automatic directory organization.

### Features

- 🚀 **Interactive Mode**: Beautiful terminal UI for repository selection
- 📁 **Smart Organization**: Clones repositories to `~/works/cln/{repo-name}/{branch-name}/`
- 🔄 **Shell Integration**: Automatically cd into cloned directories
- ⚡ **Lightweight**: Only 17.4KB bundle size with minimal dependencies
- 🛡️ **Secure**: Input validation and secure temporary file handling

### Commands

- `cln` - Interactive repository selection and cloning
- `cln add <name> <url>` - Add a repository to your list
- `cln create <repo> <branch>` - Clone a specific repository/branch
- `cln list` - List all cloned repositories
- `cln delete <branch>` - Delete directories for a branch
- `cln config` - Open settings file

### Technical Details

- Built with TypeScript for type safety
- Uses prompts for interactive UI, ora for spinners, and picocolors for colors
- ESM-only package for modern Node.js environments
- Comprehensive test suite with vitest
- Secure command execution with proper escaping
