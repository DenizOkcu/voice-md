# Project Specification: Enable Post-Processing Modal Checkbox

## 1. Requirements

### Functional Requirements
- Per-recording post-processing toggle in recording modal UI
- Checkbox defaults to global `enablePostProcessing` setting value
- User can change checkbox state before or during recording
- Checkbox state passed to completion handler for post-processing decision
- Post-processing behavior respects modal checkbox instead of global setting

### Non-Functional Requirements
- **Performance:** No impact on recording/transcription performance
- **Compatibility:** Works on desktop (macOS, Windows, Linux) and mobile (iOS, Android)
- **Accessibility:** Checkbox meets 44x44px touch target for mobile
- **Backward Compatibility:** Existing recordings and workflows unaffected
- **Security:** No new data storage or API calls introduced

## 2. Technical Design

### Architecture

**Pattern:** Extend existing modal state architecture (follows Meeting Mode checkbox pattern)

**Components:**
- `RecordingModal` - Owns checkbox UI and state management
- `VoiceCommand` - Passes global setting to modal, receives per-recording decision
- Callback interface - Updated to include `enablePostProcessing` parameter

**Data Flow:**
1. User triggers voice recording command
2. `VoiceCommand` reads global `settings.enablePostProcessing`
3. `RecordingModal` constructor receives global setting as default
4. User toggles checkbox in modal (overrides default)
5. Recording completes → callback receives `(blob, meetingMode, postProcessing)`
6. `VoiceCommand.handleRecording()` uses local `postProcessing` param instead of global setting

### Key Type Changes

```typescript
// src/audio/audio-modal.ts
export class RecordingModal extends Modal {
  private postProcessingEnabled: boolean = false; // NEW

  private onRecordingComplete: (
    blob: Blob,
    enableMeetingMode: boolean,
    enablePostProcessing: boolean  // NEW
  ) => void;

  constructor(
    app: App,
    maxDuration: number,
    onRecordingComplete: (blob: Blob, enableMeetingMode: boolean, enablePostProcessing: boolean) => void,
    autoStart: boolean,
    enablePostProcessing: boolean  // NEW - default from global setting
  ) {
    // ...
    this.postProcessingEnabled = enablePostProcessing;
  }
}
```

```typescript
// src/commands/voice-command.ts
private async handleRecording(
  audioBlob: Blob,
  editor: Editor,
  meetingMode: boolean,
  enablePostProcessing: boolean  // NEW - from modal checkbox
): Promise<void> {
  // ...
  if (enablePostProcessing) {  // Use param instead of this.settings.enablePostProcessing
    // Post-processing logic
  }
}
```

### Files to Modify

```
src/audio/audio-modal.ts:16-32 - Add postProcessingEnabled property + constructor param
src/audio/audio-modal.ts:51-61 - Add checkbox UI after meeting mode checkbox
src/audio/audio-modal.ts:155 - Pass postProcessingEnabled to callback
src/commands/voice-command.ts:35-44 - Pass settings.enablePostProcessing to modal
src/commands/voice-command.ts:38-40 - Update callback signature
src/commands/voice-command.ts:50 - Update handleRecording signature
src/commands/voice-command.ts:78-79 - Replace settings check with parameter
styles.css:56-86 - Reuse or extend checkbox styles (optional)
```

### UI Design

**Checkbox Placement:**
```
┌─────────────────────────────────────┐
│  Voice Recording                    │
├─────────────────────────────────────┤
│  Status: Recording...               │
│  Timer: 01:23                       │
│                                     │
│  ☑ Enable Meeting Mode (Speaker ID)│
│  ☑ Enable Post-Processing           │  ← NEW
│                                     │
│  Max duration: 05:00                │
│  [Start] [Stop] [Cancel]            │
└─────────────────────────────────────┘
```

**Label Text Options:**
- `Enable Post-Processing (GPT Formatting)` - explicit
- `Format with GPT` - concise
- `Enable Smart Formatting` - user-friendly

**Recommended:** `Enable Post-Processing (Smart Formatting)`

### CSS Classes

**Option 1 - Reuse existing styles:**
```css
/* No changes needed - reuse .voice-md-meeting-mode */
```

**Option 2 - Create dedicated class (optional):**
```css
.voice-md-post-processing {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 15px 0;
  padding: 10px;
}

.voice-md-post-processing label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-normal);
  min-height: 44px;
  padding: 10px;
}

.voice-md-post-processing input[type="checkbox"] {
  cursor: pointer;
  width: 18px;
  height: 18px;
  margin: 0;
}
```

## 3. Error Handling

### Validation
- No validation required - boolean flag is always valid
- Checkbox state cannot cause errors

### Error Scenarios
1. **Post-processing enabled but API key invalid** - Existing error handler catches this (`ErrorHandler.handle()`)
2. **Post-processing fails mid-request** - Existing fallback to raw transcription applies
3. **Checkbox toggled during recording** - State captured at stop time, no race conditions

### User Feedback
- **No changes needed** - existing notices already handle post-processing success/failure
- Checkbox provides visual confirmation of user's choice

## 4. Configuration

### Settings Changes
- **No new settings added** - feature uses existing `enablePostProcessing` as default
- Global setting remains in `VoiceMDSettings` interface (no modifications)

### Environment Variables
- None

### External Dependencies
- None (no new packages)

### Migration
- **Not required** - pure additive change, no data model changes

## 5. User Experience Flow

### Scenario 1: Override Global Setting (Enabled → Disabled)
1. Global setting: `enablePostProcessing = true`
2. User opens recording modal → checkbox is checked by default
3. User unchecks checkbox
4. User records audio
5. **Result:** Raw transcription inserted, no file creation, no GPT call

### Scenario 2: Override Global Setting (Disabled → Enabled)
1. Global setting: `enablePostProcessing = false`
2. User opens recording modal → checkbox is unchecked by default
3. User checks checkbox
4. User records audio
5. **Result:** Post-processing runs, two files created (raw + structured)

### Scenario 3: Use Default Global Setting
1. Global setting: `enablePostProcessing = true`
2. User opens recording modal → checkbox is checked
3. User does not change checkbox
4. User records audio
5. **Result:** Post-processing runs (same as current behavior)

## 6. Implementation Checklist

- [ ] Phase 1: Add modal state properties
- [ ] Phase 1: Update callback signature
- [ ] Phase 2: Add checkbox UI element
- [ ] Phase 2: Wire change handler
- [ ] Phase 3: Update VoiceCommand constructor call
- [ ] Phase 3: Update handleRecording method
- [ ] Phase 3: Replace global setting check with parameter
- [ ] Phase 4: Test on desktop (npm run dev)
- [ ] Phase 4: Test on mobile (iOS/Android)
- [ ] Phase 4: Test all 4 combinations (global on/off × modal on/off)
- [ ] Phase 4: Verify Meeting Mode + Post-Processing both work
- [ ] Update CHANGELOG.md with new feature
- [ ] Version bump (patch)

## 7. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Callback signature breaks existing code | High | TypeScript compiler will catch all call sites |
| Checkbox state doesn't persist during recording | Medium | Store in instance property, accessed at stop time |
| Mobile touch target too small | Medium | Reuse existing `.voice-md-meeting-mode` styles (44x44px) |
| User confusion about two settings | Low | Clear label text, follows Meeting Mode pattern |

## 8. Future Enhancements

- **Remember last checkbox state** - Store per-user preference (separate from global setting)
- **Conditional checkbox visibility** - Only show if API key configured and global setting enabled
- **Tooltip explanation** - Hover/long-press to see what post-processing does
- **Cost indicator** - Show estimated API cost for post-processing (e.g., "~$0.02")
