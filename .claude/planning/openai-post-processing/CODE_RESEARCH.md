# Code Research: OpenAI Post-Processing with Markdown Structuring

**Risk:** Medium | **Date:** 2025-10-19

## 1. Summary

**Risk Level:** Medium
- Adding chat completions API requires careful state management
- Need to handle two OpenAI API calls sequentially (Whisper → Chat)
- File creation patterns are well-documented in Obsidian API

**Key Findings:**
- Plugin uses modular architecture with clean separation (commands, API, utils)
- OpenAI client already exists but only handles Whisper transcription
- Settings management is centralized in main.ts with simple pattern
- Obsidian Vault API provides straightforward file creation: `vault.create(path, data)`
- OpenAI package v4.20.0 is installed with chat completions support

**Top Recommendations:**
- Extend OpenAIClient to support chat completions alongside transcription
- Add new settings: `chatModel` (default: "gpt-4-chat-latest"), `enablePostProcessing` toggle
- Create separate files for raw vs structured transcription
- Add markdown link formatting: `[[filename]]` for Obsidian wiki-links
- Handle post-processing errors gracefully with fallback to raw transcription

## 2. Integration Points

**Files to modify:**

1. `src/types.ts:5-10` - Add settings for chat model and post-processing toggle
   ```typescript
   export interface VoiceMDSettings {
       openaiApiKey: string;
       whisperModel: 'whisper-1';
       chatModel: string; // NEW: for GPT model selection
       enablePostProcessing: boolean; // NEW: toggle feature
       language?: string;
       maxRecordingDuration: number;
   }
   ```

2. `main.ts:5-10` - Update DEFAULT_SETTINGS with new fields
   ```typescript
   const DEFAULT_SETTINGS: VoiceMDSettings = {
       openaiApiKey: '',
       whisperModel: 'whisper-1',
       chatModel: 'gpt-4-chat-latest', // NEW
       enablePostProcessing: true, // NEW
       language: undefined,
       maxRecordingDuration: 300
   }
   ```

3. `main.ts:55-106` - Add new settings UI controls in `VoiceMDSettingTab.display()`
   - Add dropdown/text field for chat model selection
   - Add toggle switch for enabling post-processing

4. `src/api/openai-client.ts:8-56` - Extend OpenAIClient class
   - Add method: `structureText(rawText: string, model: string): Promise<string>`
   - Use `this.client.chat.completions.create()` with appropriate prompt

5. `src/commands/voice-command.ts:49-81` - Update `handleRecording()` workflow
   - After transcription, conditionally call post-processing
   - Create two files: raw transcription + structured version
   - Link structured file to raw file using `[[raw-filename]]`

**Reusable Patterns:**

- Settings persistence: `loadSettings()` / `saveSettings()` pattern (main.ts:46-52)
- API client initialization: Constructor with API key + model (openai-client.ts:12-18)
- Error handling: `ErrorHandler.handle()` for user-friendly messages (voice-command.ts:79)
- Notice display: `new Notice(message, duration)` for user feedback (voice-command.ts:27-31, 72)
- File insertion: `editor.replaceSelection(text)` (voice-command.ts:69)

**Obsidian Vault API patterns:**
- Create file: `this.app.vault.create(path, content)` → Returns `Promise<TFile>`
- Markdown links: Use `[[filename]]` or `[[folder/filename|display text]]` format
- Path handling: All paths are vault-relative, e.g., `"notes/transcription-2025-01-19.md"`

**Anti-patterns to avoid:**
- Don't use hardcoded model names beyond defaults
- Don't create files without checking if path exists (Vault API throws error)
- Don't block UI during long API calls - use async/await properly
- Don't forget to handle both API failures gracefully

## 3. Technical Context

**Stack:**
- TypeScript 4.7.4 with strict type checking
- OpenAI SDK v4.20.0 (includes chat.completions API)
- Obsidian Plugin API (latest)
- esbuild for bundling

**Patterns:**
- Architecture: Layered architecture (commands → API → utils)
- State: Settings-based configuration with persistence
- Async: Promise-based async/await throughout
- Error handling: Centralized ErrorHandler with typed errors
- UI: Modal-based recording, Notice for feedback

**Conventions:**
- Naming: PascalCase for classes, camelCase for methods/variables
- File structure: Feature-based folders (commands, api, audio, utils)
- Imports: Relative imports with explicit file extensions omitted
- Error types: Custom VoiceMDError union type (types.ts:30-35)
- Comments: JSDoc style for public methods

## 4. Risks

**Technical Debt Areas:**
- No existing test suite - new feature will be untested
- Error handling doesn't distinguish between different OpenAI error types for chat
- No retry logic for transient API failures

**Breaking Change Risks:**
- Low: Adding optional settings won't break existing functionality
- Medium: If post-processing is enabled by default and fails, could disrupt workflow
- Recommendation: Make post-processing opt-in initially or add clear error recovery

**Performance/Security Concerns:**
- Performance: Two sequential API calls doubles latency (Whisper + Chat)
  - Mitigation: Show progress notices to user
- Security: API key already handled securely via settings
- Cost: Chat API calls add cost on top of Whisper - user should be aware
  - Recommendation: Add notice in settings about additional API costs
- Rate limiting: Two calls increases likelihood of hitting rate limits
  - Mitigation: Reuse ErrorHandler patterns for 429 errors

**Mobile Compatibility:**
- Plugin is not desktop-only (manifest.json:10: `"isDesktopOnly": false`)
- OpenAI SDK with `dangerouslyAllowBrowser: true` should work on mobile
- File creation via Vault API is mobile-compatible

## 5. Key Files

```
main.ts:5-10 - DEFAULT_SETTINGS definition, add chatModel and enablePostProcessing
main.ts:38-39 - Settings tab registration
main.ts:55-106 - VoiceMDSettingTab.display(), add new UI controls
src/types.ts:5-10 - VoiceMDSettings interface, extend with new fields
src/types.ts:24-28 - TranscriptionResult interface, may need extension
src/api/openai-client.ts:8-56 - OpenAIClient class, add structureText() method
src/api/openai-client.ts:12-18 - Constructor pattern for new chat client
src/commands/voice-command.ts:49-81 - handleRecording(), add post-processing workflow
src/commands/voice-command.ts:61-69 - Transcription + insertion logic
src/utils/error-handler.ts:72-108 - fromOpenAIError(), may need chat error handling
node_modules/obsidian/obsidian.d.ts:5956 - vault.create(path, data) method signature
node_modules/obsidian/obsidian.d.ts:6037 - vault.modify(file, data) method signature
```

## 6. Open Questions

**Critical Decisions:**
1. **File naming strategy:** How should we name the raw and structured files?
   - Option A: `transcription-{timestamp}.md` (structured) + `transcription-{timestamp}-raw.md`
   - Option B: `transcription-{timestamp}/structured.md` + `transcription-{timestamp}/raw.md` (folder approach)
   - Option C: User configurable folder paths in settings
   - **Recommendation:** Start with Option A for simplicity

2. **Post-processing prompt:** What should the system prompt be for structuring?
   - Should it be user-configurable?
   - Default prompt ideas:
     - "Format the following transcription as clear markdown with proper headings, lists, and structure."
     - "Convert this voice transcription into well-structured markdown. Add appropriate headings, bullet points, and formatting."
   - **Recommendation:** Hardcode initially, add customization in future version

3. **File placement:** Where should transcription files be created?
   - Option A: Current note's folder
   - Option B: Root of vault
   - Option C: Dedicated "Voice Transcriptions" folder (create if not exists)
   - Option D: User-configurable path in settings
   - **Recommendation:** Option C with D as future enhancement

4. **Insertion behavior:** Should structured text be inserted into editor or just saved?
   - Current: `editor.replaceSelection(result.text)` (inserts at cursor)
   - Option A: Insert structured text at cursor + create both files
   - Option B: Only create files, insert link to structured file at cursor
   - Option C: Configurable behavior
   - **Recommendation:** Option A for backward compatibility

5. **Model validation:** Should we validate that "gpt-4-chat-latest" exists?
   - OpenAI API doesn't provide model validation endpoint
   - **Recommendation:** Trust user input, catch API errors gracefully

**Clarifications Needed:**
1. Should raw transcription file link to structured, or vice versa?
   - **Suggested:** Structured file should reference raw at top: `> Raw transcription: [[raw-filename]]`

2. What level of markdown formatting is desired?
   - Headings, lists, paragraphs?
   - Preserve speaker labels if detected?
   - **Suggested:** Start with basic formatting (headings, lists, paragraphs)

3. Should the feature be opt-in or opt-out by default?
   - **Suggested:** Opt-in (`enablePostProcessing: false` by default) for safety

## 7. Implementation Strategy

**Phase 1: Core Post-Processing**
1. Extend VoiceMDSettings type and defaults
2. Add `structureText()` method to OpenAIClient
3. Update voice-command workflow to call post-processing conditionally
4. Create structured file with link to raw

**Phase 2: Settings UI**
1. Add chat model text input to settings tab
2. Add enable/disable toggle for post-processing
3. Add description/warning about API costs

**Phase 3: File Management**
1. Implement file naming strategy (timestamp-based)
2. Create dedicated folder if it doesn't exist
3. Add markdown link from structured to raw file

**Phase 4: Error Handling & Polish**
1. Handle chat API errors gracefully
2. Fallback to raw-only if post-processing fails
3. Show progress notices ("Transcribing...", "Structuring text...", "Complete!")
4. Add error types for chat completion failures

## 8. Example Code Snippets

**Chat Completion Call (OpenAI v4 SDK):**
```typescript
const completion = await this.client.chat.completions.create({
    model: "gpt-4-chat-latest",
    messages: [
        {
            role: "system",
            content: "You are a helpful assistant that formats voice transcriptions into well-structured markdown."
        },
        {
            role: "user",
            content: `Format the following transcription as clear markdown:\n\n${rawText}`
        }
    ],
    temperature: 0.3,
    max_tokens: 4096
});

return completion.choices[0].message.content;
```

**File Creation with Vault API:**
```typescript
const timestamp = moment().format('YYYY-MM-DD-HHmmss');
const rawPath = `Voice Transcriptions/transcription-${timestamp}-raw.md`;
const structuredPath = `Voice Transcriptions/transcription-${timestamp}.md`;

// Create folder if not exists
const folderPath = 'Voice Transcriptions';
if (!this.app.vault.getAbstractFileByPath(folderPath)) {
    await this.app.vault.createFolder(folderPath);
}

// Create raw file
await this.app.vault.create(rawPath, rawTranscription);

// Create structured file with link to raw
const structuredContent = `> Raw transcription: [[${rawPath}]]\n\n${structuredText}`;
await this.app.vault.create(structuredPath, structuredContent);
```

**Markdown Link Format:**
```markdown
[[transcription-2025-10-19-143022-raw]]
[[Voice Transcriptions/transcription-2025-10-19-143022-raw|View Raw]]
```
