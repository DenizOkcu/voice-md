# Project Specification: Move Meeting Mode to Recording Overlay

**Issue:** move-meeting-mode-to-overlay
**Date:** 2025-10-19
**Risk:** Low

---

## 1. Requirements

### Functional Requirements
- **F1:** Meeting mode toggle appears as checkbox in recording modal UI
- **F2:** Checkbox state defaults to unchecked (false) when modal opens
- **F3:** Checkbox is interactive during recording (can be toggled anytime)
- **F4:** Final checkbox state (at `stopRecording()` time) determines API behavior
- **F5:** Meeting mode ON → use `gpt-4o-transcribe-diarize` model + speaker formatting
- **F6:** Meeting mode OFF → use standard Whisper transcription (existing behavior)
- **F7:** Settings UI toggle removed (no longer visible to user)
- **F8:** Existing saved settings with `enableMeetingMode` still load without errors

### Non-Functional Requirements
- **NFR1:** Mobile compatibility - checkbox must have 44x44px touch target minimum
- **NFR2:** Performance - no measurable impact on modal render time (<50ms)
- **NFR3:** Backward compatibility - no breaking changes to existing user settings
- **NFR4:** Visual consistency - checkbox styling matches Obsidian design system
- **NFR5:** Privacy - checkbox state is ephemeral (not persisted to disk)

---

## 2. Technical Design

### Architecture Pattern
**Event-driven state flow with callback-based communication:**
```
User clicks "Start Recording"
  ↓
RecordingModal opens (checkbox: unchecked by default)
  ↓
User checks/unchecks meeting mode during recording
  ↓
User clicks "Stop Recording" → captures checkbox state
  ↓
Callback fires: onRecordingComplete(blob, meetingModeEnabled)
  ↓
VoiceCommand.handleRecording(blob, editor, meetingMode)
  ↓
OpenAIClient.transcribe(blob, options, meetingMode)
  ↓
API call: meetingMode ? 'gpt-4o-transcribe-diarize' : 'whisper-1'
  ↓
Transcription result (with segments if meeting mode ON)
  ↓
Format with speakers (if meeting mode ON)
  ↓
Insert into editor
```

### Component Changes

**Modified Components:**
1. `RecordingModal` - Add checkbox UI and state management
2. `VoiceCommand` - Accept meeting mode parameter, use instead of setting
3. `VoiceMDSettingTab` - Remove meeting mode toggle UI

**Unchanged Components:**
- `AudioRecorder` - No changes (only handles MediaRecorder)
- `OpenAIClient` - No changes (already accepts meeting mode parameter)
- `ErrorHandler` - No changes

### Data Flow

**Before (settings-based):**
```typescript
// Global setting loaded at plugin initialization
settings.enableMeetingMode: boolean

// Used everywhere in the chain
VoiceCommand → uses this.settings.enableMeetingMode
OpenAIClient.transcribe() → receives meeting mode from settings
```

**After (modal-based):**
```typescript
// Ephemeral modal state (not persisted)
RecordingModal.meetingModeEnabled: boolean

// Passed through completion handler
onRecordingComplete: (blob: Blob, enableMeetingMode: boolean) => void
  ↓
VoiceCommand.handleRecording(blob, editor, meetingMode: boolean)
  ↓
OpenAIClient.transcribe(blob, options, meetingMode: boolean)
```

---

## 3. Key Types & Interfaces

### Type Changes

**Before:**
```typescript
// src/audio/audio-modal.ts:16
private onRecordingComplete: (blob: Blob) => void;
```

**After:**
```typescript
// src/audio/audio-modal.ts:16
private onRecordingComplete: (blob: Blob, enableMeetingMode: boolean) => void;
```

**Method Signature Changes:**
```typescript
// src/commands/voice-command.ts:50
// Before:
private async handleRecording(audioBlob: Blob, editor: Editor): Promise<void>

// After:
private async handleRecording(audioBlob: Blob, editor: Editor, meetingMode: boolean): Promise<void>
```

### No Breaking Changes to Public Types
```typescript
// src/types.ts:5-14 (unchanged - backward compatible)
export interface VoiceMDSettings {
  openaiApiKey: string;
  chatModel: string;
  enablePostProcessing: boolean;
  postProcessingPrompt?: string;
  language?: string;
  maxRecordingDuration: number;
  autoStartRecording: boolean;
  enableMeetingMode: boolean; // ← Kept for backward compatibility, deprecated
}
```

---

## 4. Files to Create/Modify

### Files to Modify

```
src/audio/audio-modal.ts
  Lines 8-18:    Add private meetingModeEnabled: boolean = false;
  Lines 16:      Update onRecordingComplete callback signature
  Lines 20-24:   Update constructor parameter signature
  Lines 46-55:   Insert checkbox UI after timer display
  Line 142:      Pass meetingModeEnabled to callback

src/commands/voice-command.ts
  Line 38-40:    Update modal instantiation callback signature
  Line 50:       Update handleRecording method signature
  Line 62:       Replace this.settings.enableMeetingMode with meetingMode param
  Line 74:       Replace this.settings.enableMeetingMode with meetingMode param

main.ts
  Lines 110-118: Remove "Enable Meeting Mode" settings toggle (delete block)
  Line 13:       Add deprecation comment for enableMeetingMode

src/types.ts
  Line 13:       Add @deprecated JSDoc comment for enableMeetingMode

styles.css
  Lines 55+:     Add .voice-md-meeting-mode styles (new section)
```

### No New Files Created
All changes are modifications to existing files.

---

## 5. UI Implementation Details

### Checkbox UI Pattern (Obsidian API)

```typescript
// Position: After timer display, before max duration info
// src/audio/audio-modal.ts:~48 (after line 48, before line 50)

const checkboxContainer = contentEl.createDiv({ cls: 'voice-md-meeting-mode' });
const label = checkboxContainer.createEl('label');
const checkbox = label.createEl('input', { type: 'checkbox' });
checkbox.checked = false; // Default: unchecked
label.appendText(' Enable Meeting Mode (Speaker Identification)');

// Wire change handler
checkbox.addEventListener('change', () => {
    this.meetingModeEnabled = checkbox.checked;
});
```

### CSS Styling

```css
/* styles.css:55+ */

.voice-md-meeting-mode {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 15px 0;
    padding: 10px;
}

.voice-md-meeting-mode label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
    color: var(--text-normal);
    /* Minimum touch target: 44x44px for mobile */
    min-height: 44px;
    min-width: 44px;
    padding: 10px;
}

.voice-md-meeting-mode input[type="checkbox"] {
    cursor: pointer;
    width: 18px;
    height: 18px;
    margin: 0;
}

.voice-md-meeting-mode label:hover {
    color: var(--text-muted);
}
```

**Mobile Considerations:**
- Label padding ensures 44x44px touch target
- Flexbox layout centers checkbox and text
- Cursor pointer for desktop hover feedback

---

## 6. API Integration

### OpenAI API Model Selection

**Meeting Mode OFF (default):**
```typescript
// OpenAI Whisper API
model: "whisper-1"
response_format: "verbose_json" // No speaker diarization
```

**Meeting Mode ON:**
```typescript
// GPT-4o Transcription with Diarization
model: "gpt-4o-transcribe-diarize"
response_format: "verbose_json"
// Returns segments with speaker labels: SPEAKER_00, SPEAKER_01, etc.
```

### Speaker Formatting Logic

**Already implemented in `VoiceCommand.formatWithSpeakers()` (lines 181-197):**
- Converts `SPEAKER_00` → "Speaker 1"
- Groups consecutive segments by speaker
- Adds markdown bold formatting: `**Speaker 1:**`
- Preserves segment text with proper spacing

**No changes needed** - existing logic already handles meeting mode output.

---

## 7. Error Handling

### Validation Strategy
- No validation needed for checkbox state (boolean, always valid)
- Existing API error handling unchanged
- Meeting mode errors handled by `OpenAIClient` (already implemented)

### Error Scenarios

| Scenario | Current Behavior | After Changes |
|----------|------------------|---------------|
| Meeting mode API failure | ErrorHandler shows user-friendly message | Unchanged |
| Empty transcription | Notice: "Transcription was empty" | Unchanged |
| Permission denied (mic) | Modal shows error, doesn't close | Unchanged |
| Invalid API key | Notice before modal opens | Unchanged |

**No new error scenarios introduced** - checkbox is purely UI state.

---

## 8. Configuration

### Environment Variables
None required.

### Config Files
**main.ts:5-14 - DEFAULT_SETTINGS:**
```typescript
const DEFAULT_SETTINGS: VoiceMDSettings = {
  openaiApiKey: '',
  chatModel: 'gpt-4o-mini',
  enablePostProcessing: false,
  postProcessingPrompt: undefined,
  language: undefined,
  maxRecordingDuration: 300,
  autoStartRecording: false,
  enableMeetingMode: false // ← Kept for backward compatibility (deprecated)
}
```

**Change:** Add JSDoc comment indicating deprecation, but keep property to prevent settings load errors.

### External Dependencies
No new dependencies required. Uses existing:
- Obsidian Plugin API (Modal, DOM creation)
- OpenAI SDK (already supports meeting mode parameter)

---

## 9. Testing Strategy

### Unit Testing Focus
- `RecordingModal`: Checkbox state management (get, set, reset on open)
- `VoiceCommand`: Meeting mode parameter flow (correct API calls)

### Integration Testing Focus
- End-to-end: Modal → record → stop → transcribe with meeting mode ON/OFF
- Speaker formatting: Verify "Speaker 1", "Speaker 2" labels in output
- Post-processing + meeting mode combination

### Mobile Testing Focus
- iOS Safari: Touch interaction with checkbox
- Android Chrome: Touch interaction with checkbox
- Touch target size: Verify 44x44px minimum (accessibility)

### Edge Cases
- Toggle checkbox rapidly during recording → verify final state used
- Auto-start recording enabled + meeting mode checkbox interaction
- Meeting mode ON + empty audio → verify error handling
- Meeting mode ON + API error → verify fallback to standard error message

---

## 10. Backward Compatibility

### Settings Migration
**None required** - `enableMeetingMode` property remains in settings schema.

### User Impact
- **Zero breaking changes:** Existing settings files load without errors
- **UX improvement:** Per-recording control instead of global toggle
- **Cost control:** Users opt-in per recording (more expensive API model)

### Deprecation Strategy
1. Keep `enableMeetingMode` in `VoiceMDSettings` interface (no removal)
2. Remove UI toggle from settings tab (visual deprecation)
3. Add `@deprecated` JSDoc comment in types file
4. Document in CHANGELOG.md as "moved to recording modal"

**Timeline:** No removal planned - property remains indefinitely for backward compatibility.

---

## 11. Security & Privacy

### Data Handling
- **Checkbox state:** Ephemeral (modal instance property), not persisted
- **Audio processing:** Unchanged (already ephemeral Blob, not saved to disk)
- **API calls:** Unchanged (OpenAI Whisper/GPT-4o, user-configured)

### Privacy Implications
- **No new data collection:** Checkbox state not logged or transmitted
- **No new network requests:** Same OpenAI API calls, just model selection changes
- **No new local storage:** Checkbox state discarded on modal close

---

## 12. Performance Considerations

### Render Performance
- **Modal open:** Adding one checkbox element has negligible impact (<1ms)
- **Checkbox interaction:** Standard DOM event handling (no performance concern)

### API Performance
- **Meeting mode ON:** Slightly slower API response (diarization processing)
- **Meeting mode OFF:** Unchanged (standard Whisper speed)

**Benchmark (estimated):**
- Standard Whisper: ~5-10s for 1min audio
- Meeting mode: ~8-15s for 1min audio (30-50% slower)

---

## 13. Related Documentation

### Obsidian API References
- [Modals](https://docs.obsidian.md/Plugins/User+interface/Modals)
- [Settings API](https://docs.obsidian.md/Plugins/User+interface/Settings)
- [HTML Elements](https://docs.obsidian.md/Plugins/User+interface/HTML+elements)

### OpenAI API References
- [Whisper Transcription](https://platform.openai.com/docs/guides/speech-to-text)
- [GPT-4o Diarization](https://platform.openai.com/docs/guides/speech-to-text/speaker-diarization)

### Plugin Development
- [Plugin Guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
- [Mobile Compatibility](https://docs.obsidian.md/Plugins/User+interface/Mobile+development)

---

## Next Steps

1. Review this specification for completeness
2. Run `/execute-plan move-meeting-mode-to-overlay` to begin implementation
3. Follow phased approach: UI → State Flow → Settings Cleanup → Testing
4. Test on desktop and mobile before release
5. Update documentation (README, CHANGELOG) post-implementation
