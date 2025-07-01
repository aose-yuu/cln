# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CLN is a Git repository management CLI tool built with TypeScript and Ink (React for CLIs). It provides an interactive terminal UI for cloning and managing Git repositories with automatic directory organization.

## Commands

### Development
- `npm run dev` - Run development build with stub mode for testing
- `npm run build` - Build the project for distribution
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint for code quality
- `npm run test` - Run tests with Vitest

### Testing
- `npm test` - Run all tests
- `npx vitest run path/to/test` - Run a specific test file
- `npx vitest watch` - Run tests in watch mode

## Architecture

### Core Structure
The application follows a modular architecture with clear separation of concerns:

- **CLI Entry Point** (`src/cli.tsx`): Commander.js integration with Ink React components
- **Commands** (`src/commands/`): Each CLI command is a separate React component that handles user interaction and business logic
- **Components** (`src/components/`): Reusable Ink UI components (BranchInput, RepositorySelect, etc.)
- **Utils** (`src/utils/`): Core functionality including Git operations, settings management, and shell integration

### Key Design Patterns

1. **Interactive UI Components**: All commands render Ink components for rich terminal UIs with loading states, error handling, and user input
2. **Settings Management**: Centralized configuration stored in `~/.config/cln/settings.json` with atomic read/write operations
3. **Shell Integration**: Provides cd functionality by writing target directory to a temp file that shell functions read
4. **Error Boundaries**: Each command component handles errors gracefully with user-friendly messages

### Testing Strategy
- Component tests use `ink-testing-library` for testing terminal UI output
- Utility functions have unit tests with mocked file system operations
- Test setup in `src/__tests__/setup.ts` configures global mocks

## Key Implementation Details

### Directory Structure
Repositories are cloned to: `~/works/cln/{repository-name}/{branch-name}/`

### Shell Integration
The CLI writes the target directory to `/tmp/.cln_cd_path` which shell functions read to enable automatic cd after cloning.

### State Management
Each command component manages its own state using React hooks. No global state management is used - settings are read/written directly from the configuration file.

### Error Handling
All Git operations and file system interactions are wrapped in try-catch blocks with appropriate error messages displayed through Ink's error components.