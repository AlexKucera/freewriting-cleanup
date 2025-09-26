# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Type
This is an Obsidian community plugin written in TypeScript. The plugin extends Obsidian's functionality through the official plugin API.

## Development Commands

### Build and Development
```bash
# Install dependencies
npm install

# Development mode (watch mode with live rebuilding)
npm run dev

# Production build (type check + minified build)
npm run build

# Version bump (updates manifest.json, package.json, and versions.json)
npm run version
```

### Linting
```bash
# Install ESLint globally (if not already installed)
npm install -g eslint

# Lint main TypeScript file
eslint main.ts

# Lint all TypeScript files
eslint **/*.ts
```

### Testing
Manual testing requires copying build artifacts (`main.js`, `manifest.json`, `styles.css`) to the Obsidian vault at `.obsidian/plugins/freewriting-cleanup/` and reloading Obsidian.

## Architecture Overview

### Build System
- **Bundler**: esbuild (configured in `esbuild.config.mjs`)
- **Entry Point**: `main.ts` → `main.js`
- **External Dependencies**: Obsidian API and CodeMirror modules are marked as external
- **Target**: ES2018, CommonJS format
- **Development**: Includes inline sourcemaps and watch mode
- **Production**: Minified output without sourcemaps

### Plugin Structure
The plugin follows a modular architecture extending Obsidian's standard plugin system:
- **Main Plugin Class**: `FreewritingCleanupPlugin` extends `Plugin` from obsidian API
- **Service Layer**: `CleanupService` handles AI API interactions
- **Command Layer**: `CleanupCommand` implements text processing logic
- **Settings System**: Interface-based settings with persistence via `loadData()`/`saveData()`
- **Type Definitions**: Centralized in `types.ts` for consistency
- **Lifecycle Management**: Uses proper initialization and cleanup patterns

### Key Files
- `main.ts`: Plugin entry point coordinating services and commands
- `types.ts`: TypeScript interfaces for settings, API responses, and plugin configuration
- `settings.ts`: Settings tab implementation and default configuration
- `services/cleanupService.ts`: AI service integration and API handling
- `commands/cleanupCommand.ts`: Command execution and text processing
- `manifest.json`: Plugin metadata (ID, version, compatibility)
- `package.json`: npm configuration with build scripts
- `esbuild.config.mjs`: Build configuration
- `tsconfig.json`: TypeScript compiler settings
- `.eslintrc`: ESLint configuration with TypeScript support

## Plugin Architecture Patterns

### Settings Management
Settings use the `FreewritingCleanupSettings` interface with modular defaults:
```typescript
interface FreewritingCleanupSettings {
    apiKey: string;
    model: AnthropicModel;
    cleanupPrompt: string;
    enableCommentary: boolean;
    commentaryStyle: CommentaryStyle;
    customCommentaryPrompt: string;
}

const DEFAULT_SETTINGS: FreewritingCleanupSettings = {
    apiKey: '',
    model: 'claude-3-5-haiku-latest',
    cleanupPrompt: 'I did some free writing. Please correct my jumbled typo mess...',
    enableCommentary: false,
    commentaryStyle: 'constructive',
    customCommentaryPrompt: 'Provide thoughtful feedback...'
}
```

### Command Registration
Commands use dedicated command classes with service injection:
- Main plugin registers commands via `addCommand()` with stable IDs
- `CleanupCommand` class handles execution logic and editor interaction
- Service dependencies injected during plugin initialization

### Service Architecture
- `CleanupService` manages Anthropic API integration and connection testing
- Service instances created during plugin load and updated when settings change
- Clean separation between API logic and UI components

### UI Components
- `FreewritingCleanupSettingTab` extends `PluginSettingTab` with comprehensive configuration
- Custom confirmation modal for destructive operations
- Dynamic UI updates based on setting states (e.g., commentary options)

### Resource Cleanup
Standard Obsidian plugin lifecycle with service coordination:
- Services initialized in `onload()` with proper dependency injection
- Settings persistence triggers service updates automatically
- Clean separation allows for easy testing and maintenance

## Release Process
1. Update `manifest.json` version (semantic versioning)
2. Update `minAppVersion` if using newer APIs
3. Run `npm run build` to generate `main.js`
4. Create GitHub release with exact version number (no `v` prefix)
5. Attach `manifest.json`, `main.js`, and `styles.css` as release assets

## Development Notes
- Plugin uses modular architecture with separate services, commands, and settings
- Build process bundles all TypeScript modules into single `main.js` artifact
- Service layer enables clean testing and API interaction separation
- Settings system provides comprehensive user configuration with dynamic UI updates
- Mobile compatibility controlled by `isDesktopOnly` flag in manifest