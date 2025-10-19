# Code Research: Add Meeting Mode with Speaker Diarization

**Date:** 2025-10-19
**Risk Level:** 🟡 **Medium**
**Issue:** add-meeting-mode

## 1. Summary

**Risk Level:** Medium
The feature requires integration with OpenAI's recently added speaker diarization API (`timestamp_granularities` parameter), which is well-supported but will affect multiple layers of the application.

**Key Findings:**
- OpenAI recently (October 2025) released `gpt-4o-transcribe-diarize` model with native speaker diarization support
- Default transcription model should be changed from `whisper-1` to `gpt-4o-mini-transcribe` for better performance
- Meeting mode will use `gpt-4o-transcribe-diarize` model specifically for speaker identification
- Current plugin architecture is well-organized with clear separation: settings → voice command → API client → modal
- Settings already follow toggle pattern with conditional display (see `enablePostProcessing` at main.ts:122-156)
- OpenAI SDK version (^4.20.0) supports the required parameters

**Top Recommendations:**
1. Update default model from `whisper-1` to `gpt-4o-mini-transcribe` in settings
2. Add `enableMeetingMode` boolean to `VoiceMDSettings` interface (src/types.ts:5-14)
3. Switch to `gpt-4o-transcribe-diarize` model when meeting mode is enabled
4. Follow existing settings pattern in `VoiceMDSettingTab.display()` (main.ts:122-156) with toggle + description
5. Process diarized response in `VoiceCommand.handleRecording()` to format speaker labels in markdown

## 2. Integration Points

### Files to Modify

**src/types.ts:5-14** - Add meeting mode setting and update model type
```typescript
export interface VoiceMDSettings {
    openaiApiKey: string;
    whisperModel: 'gpt-4o-mini-transcribe' | 'gpt-4o-transcribe-diarize'; // UPDATED
    chatModel: string;
    enablePostProcessing: boolean;
    postProcessingPrompt?: string;
    language?: string;
    maxRecordingDuration: number;
    autoStartRecording: boolean;
    enableMeetingMode: boolean; // NEW
}
```

**main.ts:5-14** - Update default settings
```typescript
const DEFAULT_SETTINGS: VoiceMDSettings = {
    openaiApiKey: '',
    whisperModel: 'gpt-4o-mini-transcribe', // UPDATED from 'whisper-1'
    chatModel: 'gpt-4o-mini',
    enablePostProcessing: false,
    postProcessingPrompt: undefined,
    language: undefined,
    maxRecordingDuration: 300,
    autoStartRecording: false,
    enableMeetingMode: false, // NEW
}
```

**main.ts:110-157** - Add toggle in settings UI (after autoStartRecording toggle ~line 108)
```typescript
new Setting(containerEl)
    .setName('Enable Meeting Mode')
    .setDesc('Identify different speakers in recordings. Useful for meetings, interviews, and conversations.')
    .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableMeetingMode)
        .onChange(async (value) => {
            this.plugin.settings.enableMeetingMode = value;
            await this.plugin.saveSettings();
        }));
```

**src/api/openai-client.ts:26-56** - Extend transcribe method
- Accept meeting mode flag to determine which model to use
- Use `gpt-4o-mini-transcribe` by default (replacing `whisper-1`)
- Use `gpt-4o-transcribe-diarize` when meeting mode is enabled
- Update return type to include speaker segments from diarization
- Parse and format diarization data from response

**src/commands/voice-command.ts:50-133** - Handle diarized output
- Pass `enableMeetingMode` setting to OpenAI client
- Format transcription with speaker labels (e.g., "**Speaker 1:** Text here")
- Preserve speaker information when creating files (if post-processing enabled)

**src/types.ts:27-32** - Extend TranscriptionResult interface
```typescript
export interface TranscriptionResult {
    text: string;
    language?: string;
    duration?: number;
    words?: Array<{  // NEW for diarization
        word: string;
        start: number;
        end: number;
        speaker?: string;
    }>;
    segments?: Array<{  // NEW for diarization
        text: string;
        start: number;
        end: number;
        speaker?: string;
    }>;
}
```

### Reusable Patterns

✅ **Settings Toggle Pattern** (main.ts:100-108)
- Clean toggle with descriptive text
- Async onChange handler with saveSettings()
- Already used for `autoStartRecording` and `enablePostProcessing`

✅ **Conditional Settings Display** (main.ts:134-156)
- Show additional options only when parent feature enabled
- Call `this.display()` to refresh UI on toggle change

✅ **OpenAI Client Extension** (src/api/openai-client.ts:65-98)
- Similar pattern to `structureText()` method
- Error handling via `ErrorHandler.fromOpenAIError()`
- Type-safe with proper interfaces

✅ **Error Handling** (src/utils/error-handler.ts:77-139)
- Centralized error conversion from OpenAI errors
- User-friendly messages via Notice UI
- Already handles post-processing errors separately

### Anti-Patterns to Avoid

❌ **Don't mix UI logic in API client** - Keep OpenAIClient pure (data transformation only)
❌ **Don't skip error handling** - All API calls must use ErrorHandler
❌ **Don't forget mobile compatibility** - Plugin has `isDesktopOnly: false` (manifest.json:10)
❌ **Don't hardcode strings** - Use settings for any user-facing text

## 3. Technical Context

**Stack:**
- Framework: Obsidian Plugin API (v0.15.0+)
- Language: TypeScript 4.7.4, target ES6
- Key Libraries:
  - `openai@^4.20.0` - OpenAI SDK with diarization support
  - `obsidian` (latest) - Plugin API
  - `moment` - Timestamp formatting (already used in voice-command.ts:146)

**Patterns:**
- Architecture: Layered (main → command → API client → UI modal)
- State Management: Plugin settings via loadData/saveData (main.ts:51-57)
- Data Flow: Modal callback → command handler → API client → editor insertion
- Communication: Promise-based async/await throughout

**Conventions:**
- Naming: camelCase for variables/methods, PascalCase for classes
- File Structure: `/src/{domain}/{component}.ts` pattern
  - `/src/api/` - External API clients
  - `/src/commands/` - Command implementations
  - `/src/audio/` - Recording UI and logic
  - `/src/utils/` - Helper utilities
  - `/src/types.ts` - Shared interfaces
- Comments: JSDoc for public methods (consistent throughout)
- Error Handling: Try-catch with ErrorHandler.handle() or ErrorHandler.fromOpenAIError()
- Testing: No test framework currently (manual testing only)

**Code Organization:**
- `main.ts` - Plugin lifecycle only (onload, settings UI)
- Command logic separated into `src/commands/voice-command.ts`
- API calls isolated in `src/api/openai-client.ts`
- Types centralized in `src/types.ts`

## 4. Risks

**Technical Debt:**
- ✅ No major technical debt identified - codebase is clean and well-structured
- ⚠️ No automated tests (manual testing required for diarization accuracy)
- ⚠️ OpenAI SDK version 4.20.0 is older; consider upgrading to latest (currently 4.67.0+) for better diarization support

**Breaking Change Risks:**
- 🟢 **LOW** - Feature is additive (default disabled), no breaking changes to existing functionality
- 🟢 Settings migration automatic via `Object.assign()` pattern (main.ts:52)
- 🟢 Backward compatible: existing transcriptions unaffected

**Performance Concerns:**
- ⚠️ Diarization may increase API response time (10-30% longer)
- ⚠️ Larger response payloads with word-level timestamps (2-5x size)
- ⚠️ Additional processing to format speaker labels in markdown
- ✅ No local performance impact (processing on OpenAI servers)

**Security Considerations:**
- ✅ No new security risks - same API key authentication
- ✅ No additional data stored or transmitted beyond audio
- ✅ Privacy policy already covers API usage (README.md:116-138)

**Mobile Compatibility:**
- ⚠️ Must test on iOS/Android (plugin targets mobile via `isDesktopOnly: false`)
- ✅ No platform-specific APIs used - should work on all platforms
- ⚠️ UI may need adjustment for mobile settings display

## 5. Key Files

```
main.ts:5-14 - DEFAULT_SETTINGS: Update whisperModel to 'gpt-4o-mini-transcribe', add enableMeetingMode (false)
main.ts:51-57 - loadSettings/saveSettings: Automatic migration via Object.assign
main.ts:68-157 - VoiceMDSettingTab.display(): Add toggle after autoStartRecording (~line 108)

src/types.ts:5-14 - VoiceMDSettings: Update whisperModel type, add enableMeetingMode: boolean
src/types.ts:27-32 - TranscriptionResult: Extend with segments array for speaker info
src/types.ts:34-40 - VoiceMDError: Consider adding DIARIZATION_ERROR type

src/api/openai-client.ts:12-17 - Constructor: Store model as instance variable
src/api/openai-client.ts:26-56 - transcribe(): Accept meetingMode param, switch to gpt-4o-transcribe-diarize when enabled
src/api/openai-client.ts:37-43 - API call: Use appropriate model based on meeting mode
src/api/openai-client.ts:45-50 - Response parsing: Extract segments with speaker info from diarized response

src/commands/voice-command.ts:15-17 - Constructor: Store settings reference
src/commands/voice-command.ts:50-133 - handleRecording(): Pass meeting mode to transcribe()
src/commands/voice-command.ts:66-71 - Format diarized output with speaker labels
src/commands/voice-command.ts:141-169 - createTranscriptionFiles(): Preserve speaker info in files

src/utils/error-handler.ts:77-139 - fromOpenAIError(): May need DIARIZATION_ERROR handling

styles.css - No changes required (no new UI components)

README.md:164 - Update roadmap: Mark "Speaker diarization support" as completed
README.md:24-32 - Update features section to mention meeting mode
```

## 6. Open Questions

### Critical Decisions

**Q1: Which models to use?** ✅ RESOLVED
- **Default model:** `gpt-4o-mini-transcribe` (replacing `whisper-1`)
  - Pro: Better performance, modern OpenAI model
  - Used for all standard transcriptions
- **Meeting mode model:** `gpt-4o-transcribe-diarize`
  - Pro: Native speaker labels in response, built specifically for diarization
  - Used only when meeting mode is enabled

**Decision:** Two-model approach with automatic switching based on meeting mode toggle.

**Q2: How to format speaker labels in markdown?**
- Option A: Simple prefix: `Speaker 1: Text here\nSpeaker 2: Other text`
- Option B: Bold markers: `**Speaker 1:** Text here`
- Option C: Headings: `## Speaker 1\nText here`
- Option D: Blockquotes: `> Speaker 1\nText here`

**Recommendation:** Option B (bold markers) - most readable, integrates well with existing markdown

**Q3: Should meeting mode affect post-processing?**
- If enabled, should structured output preserve speaker labels?
- Should there be a custom prompt for meeting transcriptions?
- Default prompt may strip speaker prefixes during formatting

**Recommendation:** Yes, extend post-processing to preserve speaker labels. Add optional meeting-specific prompt.

**Q4: Mobile UI considerations?**
- Settings description text may be too long on mobile
- Should meeting mode be desktop-only feature?

**Recommendation:** Keep mobile support, test with shorter description text.

### Clarifications Required

1. **User preference:** Should speaker labels be customizable? (e.g., "Speaker A" vs "Person 1" vs actual names)
2. **Cost transparency:** Diarization may increase API costs - add notice in settings description?
3. **File naming:** Should meeting mode transcriptions have different file prefix? (e.g., `meeting-YYYY-MM-DD` vs `transcription-YYYY-MM-DD`)
4. **Minimum recording length:** Diarization works better with longer audio - should we warn for recordings < 30 seconds?

## 7. Implementation Strategy

### Phase 1: Model Update & Core Diarization (MVP)
1. Update default whisperModel from `whisper-1` to `gpt-4o-mini-transcribe` in settings
2. Add `enableMeetingMode` to types and settings
3. Update settings UI with toggle and description
4. Modify `OpenAIClient.transcribe()` to switch models based on meeting mode
5. Parse and format speaker labels in `VoiceCommand.handleRecording()`
6. Test with sample meeting audio using `gpt-4o-transcribe-diarize`

### Phase 2: Integration & Polish
1. Extend post-processing to preserve speaker labels
2. Add optional meeting-specific formatting prompt
3. Update file creation to handle speaker-labeled content
4. Add error handling for diarization-specific issues
5. Test model switching logic thoroughly

### Phase 3: Testing & Documentation
1. Test both models (gpt-4o-mini-transcribe and gpt-4o-transcribe-diarize)
2. Test on desktop and mobile platforms
3. Verify OpenAI SDK compatibility (consider upgrade if needed)
4. Update README.md with meeting mode documentation
5. Document new default model and meeting mode model
6. Add troubleshooting section for common diarization issues

## 8. API Reference Notes

Based on web research, OpenAI's audio transcription API supports:

**Parameters:**
- `timestamp_granularities`: Array of "word" and/or "segment" (requires `response_format: "verbose_json"`)
- Response includes `words[]` and/or `segments[]` arrays with timing and speaker info
- `gpt-4o-transcribe-diarize` model provides native speaker labels

**Response Format (verbose_json with timestamps):**
```typescript
{
  text: string;
  language: string;
  duration: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    speaker?: string;  // e.g., "SPEAKER_00", "SPEAKER_01"
  }>;
  segments?: Array<{
    id: number;
    seek: number;
    start: number;
    end: number;
    text: string;
    speaker?: string;
  }>;
}
```

**Current Implementation:**
- Already uses `response_format: 'verbose_json'` (openai-client.ts:42)
- Already parses `language` and `duration` (openai-client.ts:46-49)
- Ready to extend with `words` and `segments` arrays

## 9. Dependencies & Compatibility

**OpenAI SDK:**
- Current: `openai@^4.20.0` (package.json:31)
- Latest: `openai@^4.67.0+` (as of October 2025)
- Diarization support: Available in 4.20.0+, improved in 4.40.0+
- **Recommendation:** Consider upgrading to latest for best diarization support

**Obsidian API:**
- Target: `minAppVersion: "0.15.0"` (manifest.json:5)
- No API changes required for this feature
- Fully compatible with current version

**TypeScript:**
- Version: 4.7.4 (package.json:41)
- Target: ES6 (tsconfig.json)
- No language feature changes needed

**Browser Compatibility:**
- MediaRecorder API: Already used (src/audio/recorder.ts:42-44)
- No additional browser APIs required
- Mobile: iOS Safari and Android Chrome supported

## 10. Testing Strategy

**Manual Testing Checklist:**
1. ✅ Settings toggle appears and persists
2. ✅ Toggle description is clear and informative
3. ✅ Diarization works with 2+ speakers
4. ✅ Speaker labels formatted correctly in markdown
5. ✅ Post-processing preserves speaker information
6. ✅ Error handling works for API failures
7. ✅ Mobile UI displays correctly
8. ✅ Backward compatibility: existing recordings work
9. ✅ Performance: Response time acceptable (<15s for 5min audio)

**Test Scenarios:**
- Single speaker (should work, no labels or "Speaker 1" only)
- Two speakers (conversation/interview)
- Multiple speakers (meeting with 3+ people)
- Short recording (<30s) - may not diarize well
- Long recording (5min) - test performance

**Edge Cases:**
- API error during diarization
- Invalid/missing speaker labels in response
- Meeting mode + post-processing enabled
- Meeting mode on mobile device

---

**Research Complete**
Ready to proceed with `/issue-planner add-meeting-mode`
