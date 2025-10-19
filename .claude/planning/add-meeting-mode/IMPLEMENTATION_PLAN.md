# Implementation Plan: Meeting Mode with Speaker Diarization

## 1. Overview

**Goal:** Add speaker diarization to Voice MD using OpenAI's `gpt-4o-transcribe-diarize` model, enabling meeting/interview transcriptions with speaker identification.

**Success Criteria:**
- Meeting mode toggle appears in settings and persists correctly
- Transcriptions include speaker labels (e.g., "**Speaker 1:** text here") when enabled
- Default model upgraded from `whisper-1` to `gpt-4o-mini-transcribe` for all users
- Automatic model switching: `gpt-4o-transcribe-diarize` when meeting mode enabled
- Post-processing preserves speaker labels when both features enabled
- Backward compatible: existing recordings unaffected
- Works on desktop and mobile platforms

## 2. Implementation Phases

### Phase 1: Type Definitions & Settings Infrastructure (Complexity: Low)
**Files:** `src/types.ts`, `main.ts`

- `src/types.ts:7` - Update `whisperModel` type to `'gpt-4o-mini-transcribe' | 'gpt-4o-transcribe-diarize'`
- `src/types.ts:13` - Add `enableMeetingMode: boolean` to `VoiceMDSettings`
- `src/types.ts:28-32` - Extend `TranscriptionResult` with optional `segments` array:
  ```typescript
  segments?: Array<{
    text: string;
    start: number;
    end: number;
    speaker?: string;
  }>;
  ```
- `main.ts:7` - Update default `whisperModel` to `'gpt-4o-mini-transcribe'`
- `main.ts:13` - Add `enableMeetingMode: false` to `DEFAULT_SETTINGS`

### Phase 2: Settings UI (Complexity: Low)
**Files:** `main.ts`

- `main.ts:109` - Add meeting mode toggle after autoStartRecording setting:
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

### Phase 3: API Client - Model Switching & Diarization (Complexity: Medium)
**Files:** `src/api/openai-client.ts`

- `openai-client.ts:26-29` - Update method signature to accept `enableMeetingMode`:
  ```typescript
  async transcribe(
    audioBlob: Blob,
    options?: TranscriptionOptions,
    enableMeetingMode?: boolean
  ): Promise<TranscriptionResult>
  ```
- `openai-client.ts:37-43` - Add model selection logic:
  ```typescript
  const model = enableMeetingMode ? 'gpt-4o-transcribe-diarize' : this.model;
  const response = await this.client.audio.transcriptions.create({
    file: audioFile,
    model: model,
    language: options?.language,
    prompt: options?.prompt,
    response_format: 'verbose_json',
    timestamp_granularities: enableMeetingMode ? ['segment'] : undefined
  });
  ```
- `openai-client.ts:46-56` - Parse segments with speaker info from response:
  ```typescript
  return {
    text: response.text,
    language: (response as any).language,
    duration: (response as any).duration,
    segments: enableMeetingMode ? (response as any).segments : undefined
  };
  ```

### Phase 4: Voice Command - Speaker Label Formatting (Complexity: Medium)
**Files:** `src/commands/voice-command.ts`

- `voice-command.ts:62-64` - Pass meeting mode to transcribe:
  ```typescript
  const result = await client.transcribe(
    audioBlob,
    { language: this.settings.language },
    this.settings.enableMeetingMode
  );
  ```
- `voice-command.ts:66-72` - Format transcription with speaker labels:
  ```typescript
  // Format with speaker labels if meeting mode enabled
  let formattedText = result.text;
  if (this.settings.enableMeetingMode && result.segments) {
    formattedText = this.formatWithSpeakers(result.segments);
  }
  ```
- `voice-command.ts:170+` - Add helper method:
  ```typescript
  private formatWithSpeakers(segments: Array<{text: string; speaker?: string}>): string {
    let currentSpeaker: string | undefined = undefined;
    let formatted = '';

    for (const segment of segments) {
      if (segment.speaker && segment.speaker !== currentSpeaker) {
        currentSpeaker = segment.speaker;
        // Convert "SPEAKER_00" to "Speaker 1"
        const speakerNum = parseInt(segment.speaker.split('_')[1]) + 1;
        formatted += `\n\n**Speaker ${speakerNum}:** `;
      }
      formatted += segment.text.trim() + ' ';
    }

    return formatted.trim();
  }
  ```
- `voice-command.ts:74-94` - Update post-processing to use `formattedText` instead of `result.text`
- `voice-command.ts:91-94` - Pass `formattedText` to file creation
- `voice-command.ts:110-120` - Fallback to `formattedText` on post-processing error

### Phase 5: Post-Processing Integration (Complexity: Low)
**Files:** `src/api/openai-client.ts`

- `openai-client.ts:71-74` - Update system prompt to preserve speaker labels:
  ```typescript
  const systemPrompt = customPrompt ||
    "You are a helpful assistant that formats voice transcriptions into well-structured markdown. " +
    "Use appropriate headings (##, ###), bullet points, numbered lists, and paragraphs. " +
    "IMPORTANT: If the text contains speaker labels (e.g., **Speaker 1:**), preserve them exactly. " +
    "Preserve all content from the original transcription while improving readability.";
  ```

## 3. Testing

### Unit Testing (Manual)
- Settings persistence: Toggle meeting mode, restart Obsidian, verify state
- Model switching: Verify API calls use correct model based on toggle
- Speaker formatting: Test with 1, 2, and 3+ speaker recordings
- Empty transcription handling: Ensure graceful failure

### Integration Testing
- Meeting mode + post-processing: Both enabled, verify speaker labels preserved
- Meeting mode disabled: Standard transcription works as before
- Error handling: Test with invalid API key, network errors
- Mobile compatibility: Test on iOS/Android if available

### Edge Cases
- Single speaker recording: Should work (no labels or "Speaker 1" only)
- No speaker info in response: Gracefully fallback to plain text
- Very long recording (5min): Check performance and formatting
- Short recording (<30s): Diarization may be less accurate
- Post-processing failure: Fallback to raw with speaker labels

## 4. Effort Estimates

| Phase | Complexity | Estimated Time |
|-------|-----------|----------------|
| 1. Type Definitions & Settings | Low | 15 min |
| 2. Settings UI | Low | 10 min |
| 3. API Client Changes | Medium | 30 min |
| 4. Voice Command Formatting | Medium | 45 min |
| 5. Post-Processing Integration | Low | 10 min |
| **Testing & Validation** | Medium | 30 min |
| **Documentation Updates** | Low | 10 min |
| **Total** | - | **2.5 hours** |

## 5. Risk Mitigation

**Risk:** Diarization increases API response time
- **Mitigation:** Keep existing "Transcribing..." notice, users expect delay

**Risk:** Speaker labels break post-processing
- **Mitigation:** Update system prompt to explicitly preserve labels

**Risk:** Mobile UI issues
- **Mitigation:** Test on mobile, use concise setting description

**Risk:** Backward compatibility
- **Mitigation:** Default disabled, settings auto-migrate via `Object.assign()`

## 6. Rollback Plan

If issues arise post-deployment:
1. Revert default model change: `whisperModel: 'whisper-1'` in `main.ts:7`
2. Remove meeting mode toggle from UI (comment out lines in `main.ts:109+`)
3. Keep type definitions for future retry
4. Document known issues in GitHub Issues

## 7. Success Metrics

After implementation, verify:
- [ ] Meeting mode setting appears in UI
- [ ] Default model is `gpt-4o-mini-transcribe`
- [ ] Meeting mode transcriptions show speaker labels
- [ ] Standard mode (disabled) works unchanged
- [ ] Post-processing preserves speaker information
- [ ] No console errors or warnings
- [ ] Settings persist across Obsidian restarts
- [ ] Mobile UI displays correctly
