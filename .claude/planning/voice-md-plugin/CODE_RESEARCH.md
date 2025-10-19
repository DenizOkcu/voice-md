# Code Research: Voice MD Plugin

## 1. Summary

**Risk Level:** Low

**Key Findings:**
- Clean slate implementation - currently a standard Obsidian sample plugin with no custom functionality
- All required APIs (MediaRecorder, AudioContext, Fetch) are browser-native and already available in Obsidian runtime
- Build system (esbuild) and TypeScript configuration are properly set up and ready for development
- No conflicting functionality or technical debt to work around

**Top Recommendations:**
- Follow the modular architecture pattern recommended in AGENTS.md (separate files for settings, recorder, transcriber, utils)
- Keep main.ts minimal (lifecycle only) and delegate all feature logic to separate modules
- Leverage existing patterns from sample plugin for settings persistence, commands, and UI components
- Use proper cleanup with `register*` helpers for DOM events and intervals

## 2. Integration Points

### Files to Modify

**manifest.json:1-11**
- Change `id` from "sample-plugin" to "voice-md"
- Update `name` to "Voice MD"
- Update `description` to reflect voice recording and transcription functionality
- Keep `isDesktopOnly: false` since MediaRecorder API works on mobile browsers

**main.ts:13-92**
- Replace `MyPlugin` class with `VoiceMDPlugin`
- Remove sample commands and ribbon icon
- Add new commands: "Start Recording" and "Stop Recording and Transcribe"
- Add microphone ribbon icon (🎙️)
- Integrate with recorder, transcriber, and settings modules

**styles.css:1-9**
- Currently empty, ready for custom CSS
- Add styles for recording indicator, status bar item, and any custom UI elements

### Reusable Patterns

**Settings Management (main.ts:85-91)**
```typescript
async loadSettings() {
  this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
}
async saveSettings() {
  await this.saveData(this.settings);
}
```
- This pattern works perfectly for storing OpenAI API key, model selection, and other settings

**Settings Tab (main.ts:110-134)**
- Existing `SampleSettingTab` class structure is ideal for API key input with password field
- Can extend with dropdown for model selection, toggles for autoInsert/trimSilence

**Command Registration (main.ts:32-66)**
- Use `addCommand` for "Start Recording" and "Stop Recording"
- Use `editorCallback` pattern for inserting transcription at cursor position
- Use `checkCallback` to ensure active file exists before transcribing

**Status Bar & Ribbon (main.ts:19-29)**
- Status bar item for "Recording..." indicator
- Ribbon icon for quick access to recording toggle

### Anti-Patterns to Avoid

- **Don't put all logic in main.ts** - AGENTS.md explicitly recommends splitting into modules when file exceeds 200-300 lines
- **Don't use console.log for errors** - Use Obsidian's `Notice` API for user-facing messages
- **Don't forget cleanup** - Must use `registerDomEvent` for MediaRecorder event listeners to prevent leaks

## 3. Technical Context

**Stack:**
- TypeScript 4.7.4 with strict mode enabled
- esbuild 0.17.3 bundler
- Obsidian API 1.10.0
- Target: ES2018 (browser environment)
- No external runtime dependencies (all deps are dev-only)

**Build Configuration:**
- Entry: `main.ts` → Output: `main.js` (root directory)
- External modules: obsidian, electron, CodeMirror, Node builtins
- Dev mode: watch mode with inline source maps
- Production: minified, no source maps

**Architectural Patterns:**
- Plugin lifecycle: `onload()` for initialization, `onunload()` for cleanup
- Settings persistence: `loadData()` / `saveData()` (JSON serialization to vault)
- Command pattern: register commands with stable IDs
- Event cleanup: `register*` helpers for automatic cleanup on plugin disable

**Browser API Availability:**
- `navigator.mediaDevices.getUserMedia` - ✅ Available in Obsidian (Electron)
- `MediaRecorder` - ✅ Available with webm/ogg support
- `AudioContext` - ✅ Available for silence trimming
- `fetch` with `FormData` - ✅ Available for OpenAI API calls
- All required APIs work on both desktop and mobile Obsidian

**Conventions:**
- Naming: PascalCase for classes, camelCase for methods/variables
- File structure: Recommended to use `src/` for source files (currently flat)
- Async: Prefer `async/await` over promise chains
- Error handling: Try-catch with user-friendly Notice messages
- TypeScript: Strict null checks and no implicit any

## 4. Risks

**Technical Debt:**
- None - fresh codebase based on official sample

**Breaking Change Risks:**
- Low - no existing functionality to break
- OpenAI API model names may change (recommend fallback from gpt-4o-mini-transcribe to whisper-1)

**Performance Concerns:**
- Audio recording in memory only (no disk writes) - good for privacy but requires attention to memory usage
- Large audio files could cause memory issues - recommend max recording duration (e.g., 10 minutes)
- AudioContext silence trimming is synchronous - may block UI for very long recordings

**Security Concerns:**
- API key storage in plain text via `loadData()` - Obsidian stores this in vault/.obsidian/plugins/voice-md/data.json
  - ⚠️ Users need to know this is not encrypted
  - Document in settings UI with warning message
- Microphone permission prompt required on first use
- OpenAI API calls expose audio data to external service - requires clear disclosure per Obsidian guidelines

**Mobile Compatibility:**
- MediaRecorder mime type support varies (webm on desktop, may need ogg fallback on mobile)
- File size limits on mobile browsers - silence trimming becomes more critical
- Microphone permissions work differently on iOS/Android

## 5. Key Files

```
manifest.json:1-11 - Plugin metadata, currently set to sample-plugin
main.ts:1-135 - Complete sample plugin with settings, commands, modal, and settings tab
esbuild.config.mjs:1-50 - Build configuration with watch mode and production build
tsconfig.json:1-24 - TypeScript strict mode, ES6 target, inline source maps
package.json:6-9 - Build scripts: dev (watch), build (production), version (bump)
styles.css:1-9 - Empty CSS file ready for custom styles
AGENTS.md:43-62 - Recommended file structure with src/ organization
AGENTS.md:164-178 - Example of minimal main.ts with module imports
CLAUDE.md:1-233 - Project-specific guidance on architecture and patterns
```

## 6. Recommended File Structure

Based on AGENTS.md guidance and plugin complexity:

```
voice-md/
├── src/
│   ├── main.ts              # Minimal plugin lifecycle only
│   ├── settings.ts          # VoiceMDSettings interface, DEFAULT_SETTINGS, SettingTab
│   ├── commands/
│   │   └── recording.ts     # Command registration and orchestration
│   ├── recorder.ts          # MediaRecorder wrapper, audio capture logic
│   ├── transcriber.ts       # OpenAI API integration
│   └── utils/
│       ├── audioTrim.ts     # AudioContext silence trimming
│       └── insertion.ts     # Editor text insertion with formatting
├── manifest.json
├── styles.css
├── esbuild.config.mjs       # Update entryPoint to src/main.ts
├── tsconfig.json
└── package.json
```

**Update Required:** esbuild.config.mjs line 18: `entryPoints: ["src/main.ts"]`

## 7. Open Questions

**Critical Decisions Needed:**
1. ✅ **Mobile support strategy?** - Spec says support mobile, so use feature detection for mime type fallback
2. ✅ **Max recording duration?** - Not specified in spec, recommend 10-minute limit for memory safety
3. ✅ **API key security disclosure?** - Must add warning in settings that key is stored unencrypted
4. ✅ **Error retry logic?** - Spec doesn't mention, recommend single attempt with clear error message

**Clarifications Required:**
1. Should there be a single toggle command (start/stop) or two separate commands as specified?
2. Should recording state persist across Obsidian restarts? (Recommend: No, always start clean)
3. What format for timestamp insertion? ISO 8601 or user locale format?

## 8. Implementation Strategy

**Phase 1: Core Audio Recording**
- Create recorder.ts with MediaRecorder integration
- Implement mime type detection and fallback
- Add basic error handling for permission denials

**Phase 2: Settings & Storage**
- Define VoiceMDSettings interface
- Create settings tab with API key, model dropdown, toggles
- Add validation for required API key

**Phase 3: Transcription Integration**
- Implement transcriber.ts with OpenAI API
- Add FormData construction and fetch logic
- Handle network errors and API responses

**Phase 4: Optional Features**
- Implement audioTrim.ts for silence detection
- Add conditional trimming based on settings
- Optimize for performance

**Phase 5: UI Integration**
- Create commands for start/stop recording
- Add ribbon icon and status bar indicator
- Implement editor insertion with formatting

**Phase 6: Polish**
- Add comprehensive error messages
- Implement proper cleanup and memory management
- Add mobile-specific optimizations if needed

## 9. Dependencies & External Services

**No New Dependencies Required:**
- All browser APIs are native
- TypeScript and build tools already installed
- No runtime dependencies needed

**External Service:**
- OpenAI API (https://api.openai.com/v1/audio/transcriptions)
- Requires user-provided API key
- Network connectivity required for transcription
- Must be disclosed in README and settings per Obsidian guidelines

## 10. Testing Strategy

**Manual Testing Required:**
1. Permission handling (allow/deny microphone)
2. Recording start/stop flow
3. Silence trimming accuracy
4. API error scenarios (invalid key, network failure, rate limits)
5. Editor insertion at different cursor positions
6. Settings persistence across reloads
7. Mobile compatibility (iOS Safari, Android Chrome)
8. Long recording sessions (memory management)

**Test Environments:**
- Desktop: macOS, Windows, Linux
- Mobile: iOS Obsidian app, Android Obsidian app
- Obsidian versions: minAppVersion and latest

## 11. Next Steps

1. Run `/issue-planner` to create detailed implementation plan
2. Set up modular file structure with src/ directory
3. Update esbuild config for new entry point
4. Implement Phase 1 (core recording) first
5. Iterate through remaining phases with testing

---

**Research completed:** 2025-10-19
**Estimated complexity:** Medium (5-8 files, ~500-800 LOC total)
**Estimated development time:** 2-3 sessions
