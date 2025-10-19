# Project Specification: OpenAI Post-Processing with Markdown Structuring

## 1. Requirements

### Functional Requirements

- **Post-processing toggle:** User can enable/disable automatic structuring of transcriptions via settings
- **Model selection:** User can configure which GPT model to use (default: gpt-4o-mini)
- **Dual file creation:** System creates both raw and structured transcription files with cross-links
- **Editor insertion:** Structured text is inserted at cursor position (backward compatible with current behavior)
- **Custom prompts:** (Optional) User can override default formatting instructions
- **Progress feedback:** User sees status updates during transcription and structuring phases
- **Error handling:** Graceful degradation to raw-only mode if post-processing fails

### Non-Functional Requirements

- **Performance:** Post-processing adds <5 seconds latency for typical transcriptions (depends on OpenAI API)
- **Cost transparency:** Settings UI clearly warns about additional API costs
- **Mobile compatibility:** Works on iOS/Android (OpenAI SDK supports browser environments)
- **Privacy:** No data sent to third parties beyond OpenAI API calls (user-initiated)
- **Reliability:** 100% fallback to raw transcription if post-processing fails
- **Usability:** Opt-in design (disabled by default) to avoid surprising existing users

---

## 2. Technical Design

### Architecture

**Pattern:** Layered architecture with feature extension
- **Commands layer:** `VoiceCommand` orchestrates workflow
- **API layer:** `OpenAIClient` handles both Whisper and Chat APIs
- **Utils layer:** `ErrorHandler` provides unified error management
- **Settings layer:** `VoiceMDSettings` + `VoiceMDSettingTab` for configuration

**Data Flow:**
```
User records audio
    ↓
RecordingModal captures audioBlob
    ↓
VoiceCommand.handleRecording()
    ↓
OpenAIClient.transcribe() → raw text
    ↓
[If enablePostProcessing]
    ↓
OpenAIClient.structureText() → formatted markdown
    ↓
VoiceCommand.createTranscriptionFiles() → save both files
    ↓
editor.replaceSelection() → insert structured text at cursor
    ↓
Notice → confirm success with file links
```

### Components

**1. Settings Management (main.ts, src/types.ts)**
- Extends `VoiceMDSettings` with 3 new fields
- Persists via `loadSettings()` / `saveSettings()`
- UI controls in `VoiceMDSettingTab`

**2. OpenAI Client Extension (src/api/openai-client.ts)**
- New method: `structureText(rawText, model, customPrompt?)`
- Reuses existing OpenAI client instance
- Separate error handling for chat vs. transcription

**3. Workflow Orchestration (src/commands/voice-command.ts)**
- Modified: `handleRecording()` - adds conditional post-processing
- New: `createTranscriptionFiles()` - handles file system operations

**4. Error Handling (src/utils/error-handler.ts)**
- Extended: `fromOpenAIError()` - maps chat API errors
- New error type: `POST_PROCESSING_ERROR`

### Key Types/Interfaces

```typescript
// src/types.ts:5-10 - Extended settings
export interface VoiceMDSettings {
    openaiApiKey: string;
    whisperModel: 'whisper-1';
    chatModel: string;                  // NEW: GPT model for structuring
    enablePostProcessing: boolean;      // NEW: Toggle feature
    postProcessingPrompt?: string;      // NEW: Optional custom prompt
    language?: string;
    maxRecordingDuration: number;
}

// src/types.ts:30-35 - Extended error types
export type VoiceMDError =
    | { type: 'NO_MICROPHONE'; message: string }
    | { type: 'PERMISSION_DENIED'; message: string }
    | { type: 'API_ERROR'; code: string; message: string }
    | { type: 'NETWORK_ERROR'; message: string }
    | { type: 'INVALID_API_KEY'; message: string }
    | { type: 'POST_PROCESSING_ERROR'; message: string };  // NEW

// Internal helper types (not exported)
interface FileCreationResult {
    rawPath: string;
    structuredPath: string;
}
```

### Files to Create/Modify

```
main.ts:5-20               - Modify: Update DEFAULT_SETTINGS
main.ts:55-106             - Modify: Add 3 new settings UI controls
src/types.ts:5-10          - Modify: Extend VoiceMDSettings interface
src/types.ts:30-35         - Modify: Add POST_PROCESSING_ERROR type
src/api/openai-client.ts:57-100   - New: Add structureText() method
src/commands/voice-command.ts:49-81   - Modify: Refactor handleRecording()
src/commands/voice-command.ts:85-150  - New: Add createTranscriptionFiles() helper
src/utils/error-handler.ts:72-108     - Modify: Extend fromOpenAIError()
```

---

## 3. Error Handling

### Validation Strategy

**Pre-flight checks:**
- API key exists and non-empty (already implemented)
- No additional validation for chat model (trust user input, catch runtime errors)

**Runtime validation:**
- Check `enablePostProcessing` boolean before calling `structureText()`
- Verify transcription result is non-empty before post-processing
- Catch OpenAI API errors and wrap in `VoiceMDError` types

### Error Scenarios

1. **Chat API failure (network/rate limit):**
   - Catch in `structureText()`, throw POST_PROCESSING_ERROR
   - `handleRecording()` catches, falls back to raw-only mode
   - Show notice: "Post-processing failed, saved raw transcription only"

2. **Invalid model name:**
   - OpenAI returns 404 error
   - Map to user-friendly message: "Invalid chat model. Check settings."
   - Fallback to raw-only mode

3. **File creation failure:**
   - Vault API throws if path invalid or permissions issue
   - Catch in `createTranscriptionFiles()`
   - Show notice: "Failed to save transcription files"
   - Still insert text at cursor (don't lose transcription)

4. **Folder creation failure:**
   - "Voice Transcriptions" exists as a file, not folder
   - Catch error, show notice: "Cannot create folder, check vault structure"
   - Fallback to inserting text without saving files

5. **Empty transcription:**
   - Skip post-processing entirely
   - Show notice: "Transcription was empty"

### User Feedback

**Progress notifications:**
- "Transcribing audio..." (during Whisper call)
- "Structuring text..." (during GPT call)
- "✓ Transcription complete! Files saved to Voice Transcriptions/" (success)

**Error notifications:**
- Display for 6 seconds (6000ms)
- Include actionable guidance (e.g., "Check your API key in settings")
- Never expose raw error messages (use `ErrorHandler.handle()`)

---

## 4. Configuration

### Settings UI Layout

```
┌─────────────────────────────────────┐
│ Voice MD Settings                   │
├─────────────────────────────────────┤
│ OpenAI API Key: [**************]    │
│                                     │
│ Whisper Model: whisper-1            │
│                                     │
│ ☑ Enable Post-Processing            │
│   Structure transcriptions using    │
│   GPT. Creates raw + formatted      │
│   files. Additional API costs.      │
│                                     │
│   Chat Model: [gpt-4o-mini]         │  ← Only visible if enabled
│   (e.g., gpt-4o-mini, gpt-4o)       │
│   Note: Adds cost per transcription │
│                                     │
│   Custom Formatting Prompt:         │  ← Optional, only if enabled
│   [                               ] │
│   [                               ] │
│   Leave blank for default           │
│                                     │
│ Language: [auto-detect]             │
│                                     │
│ Max Recording Duration: 300s        │
└─────────────────────────────────────┘
```

### Default Configuration

```typescript
const DEFAULT_SETTINGS: VoiceMDSettings = {
    openaiApiKey: '',
    whisperModel: 'whisper-1',
    chatModel: 'gpt-4o-mini',           // Cost-effective default
    enablePostProcessing: false,         // Opt-in for safety
    postProcessingPrompt: undefined,     // Use hardcoded default
    language: undefined,
    maxRecordingDuration: 300
}
```

### Environment Variables

None required (all configuration via plugin settings UI)

### External Dependencies

- **OpenAI SDK v4.20.0** (already installed)
  - `openai.chat.completions.create()` for post-processing
  - Uses existing `dangerouslyAllowBrowser: true` configuration

---

## 5. Implementation Details

### Default System Prompt

```
You are a helpful assistant that formats voice transcriptions into well-structured markdown.
Use appropriate headings (##, ###), bullet points, numbered lists, and paragraphs.
Preserve all content from the original transcription while improving readability.
```

### File Naming Convention

```
Voice Transcriptions/
├── transcription-2025-10-19-143022-raw.md
└── transcription-2025-10-19-143022.md
```

**Format:** `transcription-{YYYY-MM-DD-HHmmss}[-raw].md`

### Markdown Cross-Link Format

**Structured file header:**
```markdown
> Raw transcription: [[transcription-2025-10-19-143022-raw]]

{GPT-formatted content}
```

**Obsidian wiki-link syntax:** `[[filename]]` or `[[filename|display text]]`

### Chat Completion Parameters

```typescript
{
    model: settings.chatModel,          // User-configurable
    messages: [
        {
            role: "system",
            content: customPrompt || DEFAULT_SYSTEM_PROMPT
        },
        {
            role: "user",
            content: `Format the following transcription as clear markdown:\n\n${rawText}`
        }
    ],
    temperature: 0.3,                   // Consistent formatting
    max_tokens: 4096                    // Handle long transcriptions
}
```

---

## 6. Testing Plan

### Manual Testing Checklist

**Phase 1: Settings**
- [ ] Toggle "Enable Post-Processing" on/off
- [ ] Verify chat model input appears when enabled
- [ ] Change chat model to "gpt-4o", confirm persistence
- [ ] Disable post-processing, verify chat settings hidden

**Phase 2: Post-Processing**
- [ ] Record short sample (30s), verify structured output
- [ ] Check "Voice Transcriptions" folder created
- [ ] Verify both files exist with correct names
- [ ] Open structured file, verify cross-link to raw file works
- [ ] Verify structured text has headings/lists/formatting
- [ ] Verify raw file has unformatted transcription

**Phase 3: Error Handling**
- [ ] Test with invalid API key → should show error notice
- [ ] Test with invalid chat model → should fallback to raw-only
- [ ] Disable network → should show network error
- [ ] Test with empty recording → should handle gracefully

**Phase 4: Edge Cases**
- [ ] Record very long audio (>5 min) → check token limits
- [ ] Create "Voice Transcriptions" as a file (not folder) → verify error handling
- [ ] Test on mobile (iOS/Android) if available

### Success Criteria

- All manual tests pass without plugin crashes
- Error messages are user-friendly (no stack traces)
- Files are created with correct cross-links
- Settings persist across Obsidian restarts
- Performance acceptable (<10s total for typical transcription)

---

## 7. Rollout Plan

### Phase 1: Implementation (2 hours)
- Complete all code changes per IMPLEMENTATION_PLAN.md
- Manual testing on desktop

### Phase 2: Documentation (30 min)
- Update README.md with post-processing feature
- Add screenshots of settings UI
- Document file creation behavior

### Phase 3: Release (version bump)
- Update manifest.json version (e.g., 1.0.1 → 1.1.0)
- Create GitHub release with changelog
- Tag: "Added GPT post-processing for structured markdown output"

### Phase 4: User Communication
- Announce feature in release notes
- Highlight opt-in nature (disabled by default)
- Warn about additional API costs
- Provide example of structured output

---

## 8. Future Enhancements

**Not in scope for initial release:**

1. **Customizable file paths:** Let users configure where transcriptions are saved
2. **Retry logic:** Auto-retry failed API calls with exponential backoff
3. **Token usage tracking:** Display estimated costs for transparency
4. **Batch processing:** Apply post-processing to existing raw transcription files
5. **Template system:** Multiple formatting templates (meeting notes, journal entries, etc.)
6. **Streaming responses:** Show partial structured text as it's generated
7. **Local LLM support:** Use Ollama or similar for offline post-processing

---

## 9. Open Questions

**Resolved (per CODE_RESEARCH.md):**
- ✓ File naming strategy: `transcription-{timestamp}[-raw].md`
- ✓ Model default: `gpt-4o-mini` for cost efficiency
- ✓ Opt-in vs opt-out: Disabled by default (opt-in)
- ✓ File placement: Dedicated "Voice Transcriptions" folder

**Still open:**
1. Should we add a "Test Post-Processing" button in settings to preview output?
   - **Recommendation:** Add in future version (v1.2.0) for better UX
2. Should we support multiple output formats (e.g., plain text, JSON)?
   - **Recommendation:** Start with markdown only, add formats if users request
3. Should we log token usage for cost tracking?
   - **Recommendation:** Add in future version with local storage

---

## 10. Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| OpenAI API rate limits | Medium | High | Add clear error messages, suggest retrying later |
| High API costs for users | Medium | Medium | Default to gpt-4o-mini, add cost warning in settings UI |
| Post-processing quality issues | Low | Medium | Allow custom prompts, provide fallback to raw-only |
| File system conflicts | Low | Low | Check folder existence, handle errors gracefully |
| Mobile compatibility issues | Low | Medium | Test on iOS/Android, OpenAI SDK already supports browser |

---

## 11. Success Metrics

**Feature adoption:**
- Track via GitHub issue discussions/reactions
- Monitor user feedback on structured output quality

**Quality indicators:**
- Zero plugin crashes related to post-processing
- <5% error rate for post-processing calls (based on user reports)
- Positive feedback on markdown structure quality

**Performance targets:**
- Post-processing adds <5s latency (90th percentile)
- File creation completes <1s after API calls finish
