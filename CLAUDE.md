# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Voice MD** is an Obsidian Community Plugin for voice-to-text transcription with AI-powered formatting. Uses OpenAI's Audio Transcription API (`gpt-4o-mini-transcribe` / `gpt-4o-transcribe-diarize`) for transcription and configurable GPT models for optional post-processing. Works on desktop and mobile (iOS/Android).

## Build Commands

```bash
npm install          # Install dependencies
npm run dev          # Watch mode with live reloading (esbuild)
npm run build        # Production build (tsc type-check + esbuild minified)
npm run lint         # Check linting (ESLint v9 flat config)
npm run lint:fix     # Auto-fix linting issues
```

Note: `npm version patch|minor|major` script references `version-bump.mjs` which does not exist. Use `npm run update-version` (`update-version.mjs`) to bump versions instead.

## Architecture

### Build & Compilation
- **Bundler**: esbuild (`esbuild.config.mjs`) — entry `main.ts` → output `main.js`
- **Target**: ES2018, CommonJS format
- **External**: `obsidian`, `electron`, CodeMirror packages, Node built-ins (provided by Obsidian runtime)
- **Dev mode**: watch with inline source maps; **Prod**: minified, no source maps
- **TypeScript**: strict (`strictNullChecks`, `noImplicitAny`), ES6 target, ESNext modules

### Module Structure
```
main.ts                           # Plugin lifecycle (onload/onunload), settings UI
src/
  types.ts                        # All interfaces (VoiceMDSettings, RecordingState, TranscriptionResult, etc.)
  audio/recorder.ts               # MediaRecorder wrapper with platform-specific MIME type detection
  audio/audio-modal.ts            # Recording UI modal (timer, meeting mode + post-processing checkboxes)
  api/openai-client.ts            # OpenAI SDK client (transcription + chat completions for structuring)
  commands/voice-command.ts       # Orchestrator: modal → transcribe → insert/edit
  utils/error-handler.ts          # Centralized error handling, OpenAI error → VoiceMDError mapping
styles.css                        # Modal styling
```

### Data Flow
1. User triggers command/ribbon → `VoiceCommand.execute()`
2. Opens `RecordingModal` with timer UI, meeting mode checkbox, post-processing checkbox
3. `AudioRecorder` captures via MediaRecorder (WebM/MP4/OGG/WAV depending on platform)
4. Recording stops → `OpenAIClient.transcribe()` sends audio to OpenAI
5. Standard mode: `gpt-4o-mini-transcribe` with `json` format
6. Meeting mode: `gpt-4o-transcribe-diarize` with `diarized_json` format + segment timestamp granularities
7. If post-processing enabled: `OpenAIClient.structureText()` calls GPT chat completions → creates two files (raw + structured) in `Voice Transcriptions/` folder with cross-links
8. Text inserted at cursor position via `editor.replaceSelection()`

### Settings
Settings are persisted via Obsidian's `loadData()`/`saveData()`. The `VoiceMDSettings` interface is in `src/types.ts`. The settings UI (`VoiceMDSettingTab` in `main.ts`) conditionally shows chat model and custom prompt fields only when post-processing is enabled.

## ESLint & Style

Uses ESLint v9 flat config with `eslint-plugin-obsidianmd`. Key rule:
- **`obsidianmd/ui/sentence-case`**: All UI text (headings, buttons, labels) must use sentence case. Ignored terms: `OpenAI`, `GPT`, `Voice MD`.

## Release Process

1. Update `minAppVersion` in `manifest.json` if using newer Obsidian APIs
2. Update `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format
3. Run `npm run update-version` to bump version in `manifest.json`, `package.json`, `versions.json`
4. Run `npm run build` to create production `main.js`
5. Commit and create GitHub release with tag matching version (e.g., `1.2.3`, not `v1.2.3`)
6. Attach `manifest.json`, `main.js`, and `styles.css` to the release

## Mobile Compatibility

- `manifest.json`: `isDesktopOnly: false`
- Audio MIME type detection adapts: WebM (desktop) → MP4 (iOS) → OGG → WAV (fallback)
- No Node.js/Electron APIs — uses web-standard MediaRecorder
- UI optimized for touch interaction

## References

- Obsidian API: https://docs.obsidian.md
- Sample Plugin: https://github.com/obsidianmd/obsidian-sample-plugin
- Developer Policies: https://docs.obsidian.md/Developer+policies
- Plugin Guidelines: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
