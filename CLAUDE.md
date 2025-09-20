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
The plugin follows Obsidian's standard plugin architecture:
- **Main Plugin Class**: `MyPlugin` extends `Plugin` from obsidian API
- **Settings System**: Interface-based settings with persistence via `loadData()`/`saveData()`
- **Commands**: Registered via `addCommand()` with unique IDs
- **UI Components**: Modal and settings tab classes
- **Lifecycle Management**: Uses `registerDomEvent()`, `registerInterval()` for cleanup

### Key Files
- `main.ts`: Plugin entry point containing all core functionality
- `manifest.json`: Plugin metadata (ID, version, compatibility)
- `package.json`: npm configuration with build scripts
- `esbuild.config.mjs`: Build configuration
- `tsconfig.json`: TypeScript compiler settings
- `.eslintrc`: ESLint configuration with TypeScript support

## Plugin Architecture Patterns

### Settings Management
Settings are defined as TypeScript interfaces with default values and persisted automatically:
```typescript
interface MyPluginSettings {
    mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
    mySetting: 'default'
}
```

### Command Registration
Commands should have stable IDs and descriptive names:
- Use `addCommand()` for simple commands
- Use `editorCallback` for editor-specific commands
- Use `checkCallback` for conditional commands

### UI Components
- Modals extend `Modal` class with `onOpen()`/`onClose()` lifecycle
- Settings tabs extend `PluginSettingTab` with `display()` method
- Use Obsidian's `Setting` class for form controls

### Resource Cleanup
Critical for plugin stability:
- Use `registerDomEvent()` for DOM listeners
- Use `registerInterval()` for timers
- Use `registerEvent()` for Obsidian app events

## Release Process
1. Update `manifest.json` version (semantic versioning)
2. Update `minAppVersion` if using newer APIs
3. Run `npm run build` to generate `main.js`
4. Create GitHub release with exact version number (no `v` prefix)
5. Attach `manifest.json`, `main.js`, and `styles.css` as release assets

## Development Notes
- This is currently the default Obsidian sample plugin template
- All functionality is in `main.ts` - consider splitting into modules for real development
- Plugin demonstrates ribbon icons, status bar, commands, modals, and settings
- Mobile compatibility controlled by `isDesktopOnly` flag in manifest