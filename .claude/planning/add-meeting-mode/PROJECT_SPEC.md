# Project Specification: Meeting Mode with Speaker Diarization

## 1. Requirements

### Functional Requirements
- **FR1:** Add "Enable Meeting Mode" toggle in plugin settings
- **FR2:** Upgrade default transcription model from `whisper-1` to `gpt-4o-mini-transcribe`
- **FR3:** Use `gpt-4o-transcribe-diarize` model when meeting mode is enabled
- **FR4:** Format transcriptions with speaker labels (e.g., "**Speaker 1:** text here")
- **FR5:** Preserve speaker labels when post-processing is enabled
- **FR6:** Maintain backward compatibility with existing transcriptions

### Non-Functional Requirements
- **NFR1:** Settings must persist across Obsidian restarts (via `loadData()` / `saveData()`)
- **NFR2:** Mobile compatibility (iOS Safari, Android Chrome) - plugin has `isDesktopOnly: false`
- **NFR3:** Performance: Diarization may add 10-30% to API response time (acceptable)
- **NFR4:** Error handling: Graceful fallback if speaker info unavailable
- **NFR5:** Security: No additional data transmission beyond existing audio upload
- **NFR6:** User experience: Clear, concise setting descriptions

## 2. Technical Design

### Architecture Pattern
**Layered Architecture** (unchanged from existing)
```
main.ts (Plugin Lifecycle)
  ↓
src/commands/voice-command.ts (Orchestration)
  ↓
src/api/openai-client.ts (API Communication)
  ↓
OpenAI API
```

### Components & Responsibilities

| Component | File | Responsibility |
|-----------|------|----------------|
| **Settings** | `main.ts`, `src/types.ts` | Store and persist meeting mode preference |
| **Settings UI** | `main.ts:68-157` | Render toggle, handle user input |
| **Voice Command** | `src/commands/voice-command.ts` | Orchestrate recording → transcription → insertion |
| **OpenAI Client** | `src/api/openai-client.ts` | Handle model switching, parse diarization data |
| **Speaker Formatter** | `src/commands/voice-command.ts` (new method) | Convert speaker segments to markdown |
| **Error Handler** | `src/utils/error-handler.ts` | Handle diarization-related errors |

### Data Flow

```
User records audio
  ↓
RecordingModal captures audioBlob
  ↓
VoiceCommand.handleRecording() receives blob
  ↓
OpenAIClient.transcribe(blob, options, enableMeetingMode)
  ↓ [if meeting mode enabled]
  Model: gpt-4o-transcribe-diarize
  Params: timestamp_granularities: ['segment']
  ↓
  Response includes segments[] with speaker info
  ↓
VoiceCommand.formatWithSpeakers(segments)
  ↓
  Output: "**Speaker 1:** text\n\n**Speaker 2:** more text"
  ↓ [if post-processing enabled]
  OpenAIClient.structureText(formattedText)
  ↓
  System prompt preserves speaker labels
  ↓
Editor.replaceSelection(finalText)
+ createTranscriptionFiles(rawText, structuredText)
```

### Key Types & Interfaces

**Updated Settings Interface** (`src/types.ts:5-14`)
```typescript
export interface VoiceMDSettings {
  openaiApiKey: string;
  whisperModel: 'gpt-4o-mini-transcribe' | 'gpt-4o-transcribe-diarize';
  chatModel: string;
  enablePostProcessing: boolean;
  postProcessingPrompt?: string;
  language?: string;
  maxRecordingDuration: number;
  autoStartRecording: boolean;
  enableMeetingMode: boolean; // NEW
}
```

**Extended Transcription Result** (`src/types.ts:28-40`)
```typescript
export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  segments?: Array<{  // NEW: For diarization
    text: string;
    start: number;
    end: number;
    speaker?: string; // e.g., "SPEAKER_00", "SPEAKER_01"
  }>;
}
```

**OpenAI API Response Structure** (from API)
```typescript
// When timestamp_granularities: ['segment'] is used
{
  text: string;                    // Full transcription text
  language: string;                // Detected language
  duration: number;                // Audio length in seconds
  segments: Array<{
    id: number;
    seek: number;
    start: number;                 // Segment start time
    end: number;                   // Segment end time
    text: string;                  // Segment text
    speaker?: string;              // "SPEAKER_00", "SPEAKER_01", etc.
    tokens: number[];
    temperature: number;
    avg_logprob: number;
    compression_ratio: number;
    no_speech_prob: number;
  }>;
}
```

### Files to Create/Modify

```
✏️  main.ts:7 - Update: Change default whisperModel to 'gpt-4o-mini-transcribe'
✏️  main.ts:13 - Add: enableMeetingMode: false to DEFAULT_SETTINGS
✏️  main.ts:109+ - Add: Meeting mode toggle in settings UI (8 lines)

✏️  src/types.ts:7 - Update: whisperModel type union
✏️  src/types.ts:13 - Add: enableMeetingMode: boolean
✏️  src/types.ts:32-40 - Add: segments array to TranscriptionResult

✏️  src/api/openai-client.ts:26-29 - Update: Add enableMeetingMode param
✏️  src/api/openai-client.ts:37-43 - Update: Model selection logic
✏️  src/api/openai-client.ts:37-43 - Add: timestamp_granularities param
✏️  src/api/openai-client.ts:46-56 - Update: Parse segments from response
✏️  src/api/openai-client.ts:71-74 - Update: System prompt to preserve labels

✏️  src/commands/voice-command.ts:62-64 - Update: Pass enableMeetingMode
✏️  src/commands/voice-command.ts:66-72 - Add: Format with speakers logic
✏️  src/commands/voice-command.ts:74-120 - Update: Use formattedText throughout
✏️  src/commands/voice-command.ts:170+ - Add: formatWithSpeakers() helper method

📄  README.md:24-32 - Update: Mention meeting mode in features
📄  README.md:164 - Update: Mark speaker diarization as completed
```

## 3. Error Handling

### Validation Strategy
- Settings validation automatic via TypeScript types
- API key validation already exists in `voice-command.ts:26-32`
- Empty transcription check already exists in `voice-command.ts:67-71`

### Error Scenarios

| Error Type | Handling | User Feedback |
|------------|----------|---------------|
| **No speaker info in response** | Fallback to plain text (no labels) | None (silent fallback) |
| **API error during diarization** | Standard `ErrorHandler.fromOpenAIError()` | Notice with error message |
| **Post-processing strips labels** | Updated system prompt prevents this | N/A (preventative) |
| **Invalid model name** | OpenAI SDK will throw, caught by ErrorHandler | Notice: "API Error: Invalid model" |
| **Network timeout** | Existing error handling in `openai-client.ts:52-55` | Notice: "Network error" |

### Fallback Behavior
1. **Diarization fails:** Return plain text without speaker labels
2. **Post-processing fails:** Insert raw text with speaker labels (if available)
3. **Invalid meeting mode setting:** Default to `false` via Object.assign pattern

### User Feedback
- Processing notice: "Transcribing audio..." (existing)
- Success notice: "✓ Transcription complete!" (existing)
- Error notices: User-friendly via `ErrorHandler.handle()`

## 4. Configuration

### Environment Variables
None required. Uses existing `openaiApiKey` from settings.

### Configuration Files
**manifest.json** - No changes required
- Version will be bumped in release process
- `minAppVersion` remains `0.15.0`

**package.json** - No changes required
- OpenAI SDK version `^4.20.0` supports required features
- Consider upgrading to `^4.67.0+` in future for improved diarization

**tsconfig.json** - No changes required
- Strict type checking already enabled
- Target ES6 sufficient for new code

### External Dependencies
**OpenAI SDK** (`openai@^4.20.0`)
- Already installed and supports:
  - `timestamp_granularities` parameter
  - `verbose_json` response format
  - Segment-level timestamps
- Models available:
  - `gpt-4o-mini-transcribe` (NEW default)
  - `gpt-4o-transcribe-diarize` (NEW for meeting mode)
  - `whisper-1` (OLD default, deprecated)

**Obsidian API** (`obsidian@latest`)
- No new API usage required
- Uses existing: `Notice`, `Setting`, `Editor`, `Vault`

## 5. Speaker Label Formatting

### Output Format
**Standard format:** Bold speaker prefix + colon
```markdown
**Speaker 1:** Hello, welcome to the meeting.

**Speaker 2:** Thank you for having me. Let's discuss the project timeline.

**Speaker 1:** Great, I'll start with an overview.
```

### Formatting Rules
1. **Speaker numbering:** Convert API format (`SPEAKER_00`) to user-friendly (`Speaker 1`)
2. **Paragraph breaks:** New line before each speaker change
3. **Text preservation:** Keep all transcribed content
4. **Whitespace:** Trim excess spaces, single space after punctuation
5. **Continuation:** If same speaker, append to current block (no new label)

### Algorithm
```typescript
private formatWithSpeakers(segments: Array<{text: string; speaker?: string}>): string {
  let currentSpeaker: string | undefined = undefined;
  let formatted = '';

  for (const segment of segments) {
    if (segment.speaker && segment.speaker !== currentSpeaker) {
      // Speaker changed
      currentSpeaker = segment.speaker;
      const speakerNum = parseInt(segment.speaker.split('_')[1]) + 1;
      formatted += `\n\n**Speaker ${speakerNum}:** `;
    }
    formatted += segment.text.trim() + ' ';
  }

  return formatted.trim();
}
```

## 6. Post-Processing Integration

### System Prompt Enhancement
**Current prompt:**
```
"You are a helpful assistant that formats voice transcriptions into well-structured markdown.
Use appropriate headings (##, ###), bullet points, numbered lists, and paragraphs.
Preserve all content from the original transcription while improving readability."
```

**Enhanced prompt:**
```
"You are a helpful assistant that formats voice transcriptions into well-structured markdown.
Use appropriate headings (##, ###), bullet points, numbered lists, and paragraphs.
IMPORTANT: If the text contains speaker labels (e.g., **Speaker 1:**), preserve them exactly.
Preserve all content from the original transcription while improving readability."
```

### File Creation
**When both meeting mode + post-processing enabled:**
```
Voice Transcriptions/
  transcription-2025-10-19-123456-raw.md    # Raw with speaker labels
  transcription-2025-10-19-123456.md        # Structured with speaker labels
```

**Raw file content:**
```markdown
**Speaker 1:** Hello everyone welcome to the meeting.

**Speaker 2:** Thanks for joining let's start with updates.
```

**Structured file content:**
```markdown
> Raw transcription: [[transcription-2025-10-19-123456-raw]]

## Meeting Transcript

**Speaker 1:** Hello everyone, welcome to the meeting.

**Speaker 2:** Thanks for joining. Let's start with updates.
```

## 7. Testing Checklist

### Unit Tests (Manual)
- [ ] Settings toggle renders correctly
- [ ] Meeting mode setting persists after restart
- [ ] Default model is `gpt-4o-mini-transcribe`
- [ ] Model switches to `gpt-4o-transcribe-diarize` when enabled
- [ ] Speaker labels formatted correctly (1, 2, 3+ speakers)
- [ ] Empty transcription handled gracefully
- [ ] Speaker info missing: fallback to plain text

### Integration Tests
- [ ] Meeting mode OFF + post-processing OFF: Standard transcription
- [ ] Meeting mode ON + post-processing OFF: Raw with speaker labels
- [ ] Meeting mode ON + post-processing ON: Both files with speaker labels
- [ ] Meeting mode OFF + post-processing ON: Structured without labels
- [ ] API error: User-friendly error message displayed
- [ ] Network timeout: Handled gracefully

### Cross-Platform Tests
- [ ] Desktop (macOS): Full functionality
- [ ] Desktop (Windows): Full functionality
- [ ] Desktop (Linux): Full functionality
- [ ] Mobile (iOS): UI displays correctly, recording works
- [ ] Mobile (Android): UI displays correctly, recording works

### Edge Cases
- [ ] Single speaker recording (no speaker changes)
- [ ] Very short recording (<10 seconds)
- [ ] Long recording (5+ minutes)
- [ ] No speech detected (silent audio)
- [ ] Multiple rapid speaker changes
- [ ] API returns no speaker info (diarization failed)

## 8. Migration & Backward Compatibility

### Settings Migration
**Automatic via `Object.assign()` pattern** (main.ts:52)
```typescript
async loadSettings() {
  this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
}
```

**Migration behavior:**
- Existing users: `enableMeetingMode` defaults to `false` (no change in behavior)
- `whisperModel` updates to `gpt-4o-mini-transcribe` (transparent upgrade)
- Old recordings: Unaffected, stored as static markdown files

### Breaking Changes
**None.** All changes are additive:
- New setting defaults to disabled
- Model change improves performance (same input/output format)
- Speaker labels only appear when explicitly enabled

### Rollback Strategy
If issues discovered post-release:
1. Update `DEFAULT_SETTINGS.whisperModel` to `'whisper-1'`
2. Comment out meeting mode toggle (lines in `main.ts:109+`)
3. Users can disable manually if already enabled
4. Document known issues in GitHub

## 9. Documentation Updates

### README.md Changes
**Section: Features** (line ~24)
```markdown
## Features

- 🎙️ Record audio directly in Obsidian
- 🗣️ Transcribe using OpenAI Whisper API (gpt-4o-mini-transcribe)
- 👥 **NEW:** Meeting mode with speaker diarization
- 📝 Optional post-processing to structure transcriptions
- 🌍 Multi-language support (auto-detect or specify)
- ⏱️ Configurable recording duration
- 🚀 Auto-start recording option
- 📱 Mobile compatible (iOS & Android)
```

**Section: Roadmap** (line ~164)
```markdown
## Roadmap

- [x] Speaker diarization support (v1.2.0) ✓
- [ ] Local transcription models (offline support)
- [ ] Custom vocabulary/terminology support
```

**Section: Settings** (new subsection)
```markdown
### Meeting Mode

Enable **Meeting Mode** to identify different speakers in your recordings. This is useful for:
- Meeting transcriptions
- Interview recordings
- Podcast or multi-person conversations

When enabled, transcriptions will include speaker labels like:

**Speaker 1:** Hello, welcome to the meeting.

**Speaker 2:** Thank you for having me.

**Note:** Meeting mode uses the `gpt-4o-transcribe-diarize` model, which may increase API response time by 10-30%.
```

## 10. Release Notes (Draft)

### Version 1.2.0 - Meeting Mode

**New Features:**
- ✨ **Meeting Mode:** Identify different speakers in recordings with automatic speaker diarization
- 🔄 **Model Upgrade:** Default transcription model upgraded from `whisper-1` to `gpt-4o-mini-transcribe` for better performance
- 🎯 **Smart Formatting:** Speaker labels automatically formatted as bold markdown (e.g., `**Speaker 1:**`)
- 🔗 **Post-Processing Integration:** Structured transcriptions preserve speaker information

**Improvements:**
- Better transcription accuracy with new default model
- Mobile-friendly settings UI
- Enhanced error handling for API issues

**Technical Details:**
- Uses OpenAI's `gpt-4o-transcribe-diarize` model when meeting mode is enabled
- Backward compatible: existing transcriptions and settings unaffected
- Settings automatically migrated on upgrade

**Usage:**
1. Enable "Meeting Mode" in Voice MD settings
2. Record audio with multiple speakers
3. Transcription will include speaker labels automatically

**Requirements:**
- OpenAI API key with access to GPT-4o models
- Obsidian 0.15.0 or higher
