# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CLN is a lightweight Git repository management CLI tool built with TypeScript. It provides an interactive terminal UI for cloning and managing Git repositories with automatic directory organization. The tool uses minimal dependencies (prompts, ora, picocolors) for a fast and efficient user experience.

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

- **CLI Entry Point** (`src/cli.ts`): Interactive mode using prompts for repository selection and branch input
- **Commands** (`src/commands/`): Each CLI command is a standalone module using ora for progress indication and picocolors for output formatting
- **Utils** (`src/utils/`): Core functionality including Git operations, settings management, security utilities, and shell integration

### Key Design Patterns

1. **Lightweight UI**: Commands use ora for spinners, prompts for user input, and picocolors for colored output - no heavy UI frameworks
2. **Settings Management**: Centralized configuration stored in `~/.config/cln/settings.json` with atomic read/write operations
3. **Shell Integration**: Provides cd functionality by writing target directory to a secure temp file with unique name that shell functions read
4. **Consistent Error Handling**: All commands follow a pattern of colored error messages with proper exit codes

### Testing Strategy
- Command tests mock ora, prompts, and picocolors dependencies to test logic without UI
- Utility functions have unit tests with mocked file system operations
- Test setup in `src/__tests__/setup.ts` configures global mocks
- All tests use vitest for fast execution

## Key Implementation Details

### Directory Structure
Repositories are cloned to: `~/works/cln/{repository-name}/{branch-name}/`

### Shell Integration
The CLI writes the target directory to a secure temporary file (using `createSecureTempPath`) and outputs a marker (`__CLN_TEMPFILE__:path`) that shell functions parse to enable automatic cd after cloning.

### State Management
Each command is stateless and reads/writes settings directly from the configuration file. The interactive mode uses prompts to gather user input sequentially.

### Error Handling
All Git operations and file system interactions are wrapped in try-catch blocks with appropriate error messages displayed using picocolors with consistent formatting (`❌ Error: message`).

### Performance
- Bundle size: ~36KB (JavaScript)
- Total dist size: 72KB (includes source maps)
- Minimal dependencies for fast startup
- No heavy UI frameworks