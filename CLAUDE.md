# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Type

This is an **Obsidian Community Plugin** built with TypeScript, compiled to JavaScript using esbuild. The plugin integrates with Obsidian's Plugin API to extend the note-taking application's functionality.

## Build Commands

```bash
# Install dependencies (required first time and after dependency changes)
npm install

# Development mode (watch mode with live reloading)
npm run dev

# Production build (type-check + minified bundle)
npm run build

# Lint code with ESLint
eslint main.ts
# Or for a directory:
eslint ./src/

# Version bump (updates manifest.json and versions.json)
npm version patch|minor|major
```

## Architecture Overview

### Build System
- **Bundler**: esbuild configured in `esbuild.config.mjs`
- **Entry point**: `main.ts` → compiled to `main.js`
- **Target**: ES2018, CommonJS format
- **External dependencies**: `obsidian`, `electron`, CodeMirror packages, and Node built-ins are marked external (provided by Obsidian runtime)
- **Development mode**: Watch mode with inline source maps
- **Production mode**: Minified output without source maps

### TypeScript Configuration
- `tsconfig.json` uses strict type checking (`strictNullChecks`, `noImplicitAny`)
- Target: ES6 with ESNext modules
- Includes inline source maps for debugging

### Plugin Structure
Currently a single-file plugin (`main.ts`). The `AGENTS.md` file recommends organizing larger plugins into:
- `src/main.ts` - Plugin entry point (lifecycle management only)
- `src/settings.ts` - Settings interface and defaults
- `src/commands/` - Command implementations
- `src/ui/` - UI components, modals, views
- `src/utils/` - Utility functions and helpers
- `src/types.ts` - TypeScript interfaces and types

When splitting into multiple files, keep `main.ts` minimal and focused solely on plugin lifecycle (`onload`, `onunload`) and registration.

### Plugin Lifecycle
1. `onload()` - Initialize plugin, load settings, register commands/events/UI elements
2. `onunload()` - Cleanup (automatic for registered listeners via `register*` helpers)
3. Settings persistence via `loadData()` / `saveData()`

### Key Obsidian API Patterns
- **Commands**: Registered via `this.addCommand()` with stable IDs
- **Settings**: Persisted using `loadData()` / `saveData()`, managed through `PluginSettingTab`
- **Event listeners**: Must use `registerDomEvent()`, `registerEvent()`, `registerInterval()` for automatic cleanup
- **Modals**: Extend `Modal` class, manage content in `onOpen()` / `onClose()`

## Code Organization Principles

When code grows beyond ~200-300 lines in a single file:
1. Split functionality into separate modules
2. Keep `main.ts` as the minimal plugin entry point
3. Use clear module boundaries with single responsibilities
4. Import and delegate to feature modules from main plugin class

## ESLint Configuration

Custom rules in `.eslintrc`:
- TypeScript unused vars checking (ignores unused function arguments)
- `@typescript-eslint/ban-ts-comment` disabled
- `no-prototype-builtins` disabled
- `@typescript-eslint/no-empty-function` disabled

## Testing & Development Workflow

1. Run `npm run dev` to start watch mode
2. Plugin files are compiled to the current directory (not `dist/`)
3. For testing in Obsidian:
   - Ensure this plugin directory is inside `<Vault>/.obsidian/plugins/<plugin-id>/`
   - Restart Obsidian or reload the plugin after changes
   - Enable the plugin in **Settings → Community plugins**

## Release Process

1. Update `minAppVersion` in `manifest.json` if using newer Obsidian APIs
2. Run `npm version patch|minor|major` (auto-updates `manifest.json`, `package.json`, `versions.json`)
3. Run `npm run build` to create production `main.js`
4. Create GitHub release with tag matching the version (e.g., `1.2.3`, not `v1.2.3`)
5. Attach `manifest.json`, `main.js`, and `styles.css` (if present) to the release

## Important Constraints

### Security & Privacy
- Default to local/offline operation
- No network requests without user awareness
- No telemetry without explicit opt-in
- Never execute remote code or auto-update outside normal releases
- Only access files within the vault
- Clean up all listeners using `register*` helpers

### Mobile Compatibility
- Set `isDesktopOnly` appropriately in `manifest.json`
- Avoid Node/Electron APIs if targeting mobile
- Test on iOS/Android when possible

### Performance
- Keep `onload()` lightweight, defer heavy initialization
- Batch disk operations
- Debounce/throttle file system event handlers

## Custom Claude Code Commands

This repository includes specialized slash commands in `.claude/commands/`:
- `/research-code` - Deep codebase research and analysis
- `/issue-planner` - Transform issues into implementation plans
- `/execute-plan` - Execute implementation from plan documents
- `/review-code` - Comprehensive code review with linting/testing
- `/language:typescript-pro` - Advanced TypeScript assistance

## References

- Obsidian API: https://docs.obsidian.md
- Sample Plugin: https://github.com/obsidianmd/obsidian-sample-plugin
- Developer Policies: https://docs.obsidian.md/Developer+policies
- Plugin Guidelines: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
