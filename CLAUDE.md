# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Voice MD** is an Obsidian Community Plugin that enables voice-to-text transcription with AI-powered formatting. Built with TypeScript and compiled using esbuild, it integrates OpenAI's Audio Transcription API (gpt-4o-transcribe models) for transcription and GPT models for intelligent post-processing.

### Key Features
- 🎤 **Voice Recording** - One-click audio capture with real-time feedback
- 🤖 **AI Transcription** - OpenAI gpt-4o-mini-transcribe for standard mode, gpt-4o-transcribe-diarize for meeting mode
- 👥 **Meeting Mode** - Automatic speaker identification using GPT-4o diarization
- 📝 **Smart Post-Processing** - Optional GPT-powered formatting to structure transcriptions
- 📱 **Mobile Support** - Works on iOS and Android (not desktop-only)
- 🔒 **Privacy-First** - Ephemeral audio processing, local settings storage

## Build Commands

```bash
# Install dependencies (required first time and after dependency changes)
npm install

# Development mode (watch mode with live reloading)
npm run dev

# Production build (type-check + minified bundle)
npm run build

# Lint code with ESLint
npm run lint
# Auto-fix linting issues:
npm run lint:fix

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
The plugin follows a modular architecture with clear separation of concerns:

```
voice-md/
├── main.ts                           # Plugin entry point (lifecycle management)
├── src/
│   ├── types.ts                      # TypeScript interfaces and types
│   ├── audio/
│   │   ├── recorder.ts              # Audio recording logic with MediaRecorder API
│   │   └── audio-modal.ts           # Recording UI modal with timer
│   ├── api/
│   │   └── openai-client.ts         # OpenAI API client (Audio Transcription + GPT)
│   ├── commands/
│   │   └── voice-command.ts         # Voice recording command implementation
│   └── utils/
│       └── error-handler.ts         # Centralized error handling
├── styles.css                        # Custom CSS for recording interface
└── manifest.json                     # Plugin metadata
```

**Architecture Principles:**
- `main.ts` handles only plugin lifecycle (`onload`, `onunload`) and registration
- Feature modules are imported and delegated from the main plugin class
- Single responsibility per module with clear boundaries
- TypeScript strict mode enabled for type safety

### Plugin Lifecycle
1. `onload()` - Initialize plugin, load settings, register commands/events/UI elements
2. `onunload()` - Cleanup (automatic for registered listeners via `register*` helpers)
3. Settings persistence via `loadData()` / `saveData()`

### Key Obsidian API Patterns
- **Commands**: Registered via `this.addCommand()` with stable IDs
- **Settings**: Persisted using `loadData()` / `saveData()`, managed through `PluginSettingTab`
- **Event listeners**: Must use `registerDomEvent()`, `registerEvent()`, `registerInterval()` for automatic cleanup
- **Modals**: Extend `Modal` class, manage content in `onOpen()` / `onClose()`

## Plugin-Specific Implementation Details

### OpenAI API Integration
- **Transcription**: Uses OpenAI Audio Transcription API via the official `openai` SDK (v4.104.0)
- **Standard Mode**: Uses `gpt-4o-mini-transcribe` model (fast, cost-effective) with `json` format
- **Meeting Mode**: Uses `gpt-4o-transcribe-diarize` model for speaker identification with `json` format
- **Post-Processing**: Configurable GPT model selection (`gpt-4o-mini`, `gpt-4o`, etc.)
- **Audio Formats**: Supports WebM (Opus), MP4 (AAC), OGG (Opus), and WAV
- **File Handling**: Audio processed in-memory as Blob, sent via FormData to OpenAI

### Settings Architecture
```typescript
interface VoiceMDSettings {
  openaiApiKey: string;              // OpenAI API key
  maxRecordingDuration: number;      // Max seconds (default: 300)
  language?: string;                 // Language code or empty for auto-detect
  enablePostProcessing: boolean;     // Toggle GPT formatting
  chatModel: string;                 // GPT model for post-processing
  postProcessingPrompt?: string;     // Custom formatting instructions
  autoStartRecording: boolean;       // Auto-start on modal open
}
```

**Note:** Meeting Mode (speaker identification) is now controlled per-recording via a checkbox in the recording modal, not via global settings.

### Audio Recording Flow
1. User triggers command → `VoiceCommand.execute()`
2. Opens `VoiceRecordingModal` with timer UI
3. `AudioRecorder` starts MediaRecorder with platform-specific MIME type
4. Recording stops → audio blob sent to OpenAI API
5. Transcription returned and inserted at cursor position
6. If post-processing enabled → creates two files (raw + formatted)

### Mobile Compatibility
- `manifest.json` sets `isDesktopOnly: false`
- Audio format priority: WebM (desktop) → MP4 (iOS) → OGG → WAV (fallback)
- Tested on iOS Safari and Android Chrome WebView (Capacitor)
- Uses `getSupportedMimeType()` for platform-specific format detection

## Code Organization Principles

- **Modularity**: Feature code organized in `src/` with clear domain boundaries
- **Single Responsibility**: Each module handles one aspect (audio, API, commands, etc.)
- **Type Safety**: Strict TypeScript with comprehensive interface definitions
- **Error Handling**: Centralized error management with user-friendly messages
- **Clean Architecture**: Main plugin delegates to feature modules, no business logic in `main.ts`

## ESLint Configuration

**Configuration:** `eslint.config.mjs` (ESLint v9+ flat config format)

Custom rules:
- TypeScript unused vars checking (ignores unused function arguments and `_` prefixed variables)
- `@typescript-eslint/ban-ts-comment` disabled
- `no-prototype-builtins` disabled
- `@typescript-eslint/no-empty-function` disabled
- Globals: Node.js and browser environments (for Obsidian plugin context)
- Ignores: `node_modules/`, `main.js`, build scripts (`*.mjs`)

**Usage:**
```bash
npm run lint        # Check for linting errors
npm run lint:fix    # Auto-fix linting issues
```

## Testing & Development Workflow

1. Run `npm run dev` to start watch mode
2. Plugin files are compiled to the current directory (not `dist/`)
3. For testing in Obsidian:
   - Ensure this plugin directory is inside `<Vault>/.obsidian/plugins/<plugin-id>/`
   - Restart Obsidian or reload the plugin after changes
   - Enable the plugin in **Settings → Community plugins**

## Release Process

1. Update `minAppVersion` in `manifest.json` if using newer Obsidian APIs
2. Update `CHANGELOG.md` with new version details following [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format
3. Run `npm version patch|minor|major` (auto-updates `manifest.json`, `package.json`, `versions.json`)
4. Run `npm run build` to create production `main.js`
5. Commit changes with version bump message
6. Create GitHub release with tag matching the version (e.g., `1.2.3`, not `v1.2.3`)
7. Attach `manifest.json`, `main.js`, and `styles.css` to the release

**Version History:**
- **v1.1.3** (2025-10-19) - Auto-start recording option
- **v1.1.2** (2025-10-19) - Improved mobile toolbar icon
- **v1.1.1** (2025-10-19) - Updated ribbon icon, added README
- **v1.1.0** (2025-10-19) - Meeting Mode + Smart Post-Processing
- **v1.0.1** (2024-10-19) - Mobile support (iOS/Android)
- **v1.0.0** (2024-10-19) - Initial release

## Important Constraints

### Security & Privacy
- **Audio Privacy**: Audio processed in-memory as Blob, never saved to disk locally
- **API Transparency**: Network requests only to OpenAI API (user-configured)
- **Local Storage**: API key and settings stored locally via Obsidian's `saveData()`
- **No Telemetry**: Zero tracking, analytics, or third-party services beyond OpenAI
- **Vault Security**: Only accesses files within vault, creates files in `Voice Transcriptions/`
- **Clean Cleanup**: All listeners registered via `register*` helpers for automatic cleanup
- **No Remote Code**: Never executes remote code or auto-updates outside normal releases

**OpenAI Data Handling:**
- Audio sent to OpenAI Audio Transcription API for transcription (ephemeral)
- If post-processing enabled, text sent to GPT API for formatting
- See [OpenAI Privacy Policy](https://openai.com/policies/privacy-policy) for API data handling

### Mobile Compatibility
- `manifest.json` has `isDesktopOnly: false` (plugin works on mobile)
- No Node.js or Electron-specific APIs used (web-standard MediaRecorder)
- Audio format detection adapts to platform (MP4 for iOS, WebM for desktop/Android)
- Tested on iOS Safari and Android Chrome via Obsidian mobile apps
- UI optimized for mobile touch interaction

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
