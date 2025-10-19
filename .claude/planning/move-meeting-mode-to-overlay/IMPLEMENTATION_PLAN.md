# Implementation Plan: Move Meeting Mode to Recording Overlay

**Issue:** move-meeting-mode-to-overlay
**Date:** 2025-10-19
**Complexity:** Medium (UI + state flow changes)

## 1. Overview

**Goal:** Move meeting mode toggle from plugin settings to recording modal UI for per-recording control.

**Success Criteria:**
- Meeting mode checkbox visible in recording modal
- Checkbox state passed through recording flow to transcription API
- Settings UI toggle removed (backward compatibility maintained)
- Mobile-friendly checkbox interaction
- No breaking changes to existing saved settings

## 2. Phases

### Phase 1: Modal UI Enhancement (Complexity: Low)
**Goal:** Add meeting mode checkbox to recording modal

1. `src/audio/audio-modal.ts:8-18` - Add instance property
   - Add: `private meetingModeEnabled: boolean = false;`
   - Position after line 15 (other modal state properties)

2. `src/audio/audio-modal.ts:46-55` - Add checkbox UI
   - Insert after timer display and before max duration info (line 47-48)
   - Create checkbox container div with class `voice-md-meeting-mode`
   - Create label element containing checkbox input
   - Set checkbox default state: `unchecked` (false)
   - Add descriptive label text: "Enable Meeting Mode (Speaker Identification)"
   - Wire change event: `checkbox.addEventListener('change', () => { this.meetingModeEnabled = checkbox.checked; })`

3. `styles.css:55+` - Add checkbox styling
   - Add `.voice-md-meeting-mode` container styles
   - Ensure minimum 44x44px touch target for mobile
   - Match Obsidian design system (use CSS variables)
   - Add margin/padding for visual separation

**Testing:**
- Verify checkbox renders correctly in modal
- Test check/uncheck interaction (before and during recording)
- Verify mobile touch target size on iOS/Android

---

### Phase 2: State Flow Update (Complexity: Medium)
**Goal:** Pass meeting mode state from modal through completion handler

1. `src/audio/audio-modal.ts:16` - Update completion handler signature
   - Change: `private onRecordingComplete: (blob: Blob) => void;`
   - To: `private onRecordingComplete: (blob: Blob, enableMeetingMode: boolean) => void;`

2. `src/audio/audio-modal.ts:20-24` - Update constructor parameter
   - Update parameter type to match new signature
   - Line 24: `onRecordingComplete: (blob: Blob, enableMeetingMode: boolean) => void`

3. `src/audio/audio-modal.ts:142` - Pass checkbox state on completion
   - Change: `this.onRecordingComplete(blob);`
   - To: `this.onRecordingComplete(blob, this.meetingModeEnabled);`

4. `src/commands/voice-command.ts:38-40` - Update modal callback
   - Update lambda signature: `async (audioBlob, meetingMode) => { ... }`
   - Pass to handler: `await this.handleRecording(audioBlob, editor, meetingMode);`

5. `src/commands/voice-command.ts:50` - Update method signature
   - Change: `private async handleRecording(audioBlob: Blob, editor: Editor): Promise<void>`
   - To: `private async handleRecording(audioBlob: Blob, editor: Editor, meetingMode: boolean): Promise<void>`

6. `src/commands/voice-command.ts:62, 74` - Use parameter instead of setting
   - Line 62: Change `this.settings.enableMeetingMode` to `meetingMode`
   - Line 74: Change `this.settings.enableMeetingMode` to `meetingMode`

**Testing:**
- Unit test: Verify checkbox state captured at `stopRecording()` time
- Integration test: Verify meeting mode API call made when checkbox checked
- Integration test: Verify standard API call made when checkbox unchecked
- Test speaker formatting appears only when meeting mode enabled

---

### Phase 3: Settings Cleanup (Complexity: Low)
**Goal:** Remove settings UI while maintaining backward compatibility

1. `main.ts:110-118` - Remove settings toggle UI
   - Delete entire `new Setting(containerEl)` block for "Enable Meeting Mode"
   - Keep lines 110-118 removed, no replacement needed

2. `main.ts:13` - Keep setting property (backward compatibility)
   - No changes needed - `enableMeetingMode: false` remains in `DEFAULT_SETTINGS`
   - Add comment: `// Deprecated: Now controlled per-recording via modal UI`

3. `src/types.ts:13` - Document deprecation
   - Add JSDoc comment above `enableMeetingMode` property:
   - `/** @deprecated Now controlled per-recording via modal checkbox */`

**Testing:**
- Verify settings UI no longer shows meeting mode toggle
- Verify existing settings files load without errors
- Verify plugin initializes correctly with old saved settings

---

### Phase 4: Validation & Testing (Complexity: Low)
**Goal:** Comprehensive testing across platforms and scenarios

**Manual Testing:**
- Recording flow: Start → check box → stop → verify meeting mode API call
- Recording flow: Start → uncheck box → stop → verify standard API call
- Toggle during recording: Check box mid-recording → verify final state captured
- Speaker formatting: Verify "Speaker 1", "Speaker 2" labels in output
- Mobile: Test checkbox on iOS Safari (touch interaction)
- Mobile: Test checkbox on Android Chrome (touch interaction)

**Edge Cases:**
- Empty transcription with meeting mode enabled
- API error with meeting mode enabled (verify error handling)
- Auto-start recording + meeting mode checkbox interaction
- Rapid open/close modal (verify checkbox resets to unchecked)

**Regression Testing:**
- Standard recording (no meeting mode) still works
- Post-processing still works with meeting mode
- Settings save/load still works
- API key validation still works

---

## 3. Testing

### Unit Tests
- `AudioRecorder`: Checkbox state management (set, get, reset)
- `VoiceCommand.handleRecording()`: Parameter passing with meeting mode flag

### Integration Tests
- End-to-end: Modal → recording → transcription → insertion with meeting mode ON
- End-to-end: Modal → recording → transcription → insertion with meeting mode OFF
- Post-processing + meeting mode combination
- Speaker formatting logic with multi-speaker segments

### Edge Cases
- Checkbox toggled multiple times during single recording
- Meeting mode enabled with empty/silent audio
- Meeting mode API error fallback behavior
- Mobile touch target accessibility (44x44px minimum)

---

## 4. Estimates

| Phase | Effort | Description |
|-------|--------|-------------|
| 1     | 30min  | Modal UI (checkbox + styles) |
| 2     | 45min  | State flow updates (6 file changes) |
| 3     | 15min  | Settings cleanup + deprecation |
| 4     | 45min  | Testing (manual + mobile) |
| **Total** | **2.25hr** | **Full implementation + testing** |

---

## 5. Rollback Plan

If issues arise during implementation:

1. **Phase 1 rollback:** Remove checkbox UI elements and CSS
2. **Phase 2 rollback:** Revert callback signatures, use `this.settings.enableMeetingMode` again
3. **Phase 3 rollback:** Re-add settings UI toggle

**Risk mitigation:**
- Make changes in separate commits per phase
- Test each phase independently before proceeding
- Keep `enableMeetingMode` in settings schema (zero migration risk)

---

## 6. Post-Implementation

### Documentation Updates
- Update README.md with new meeting mode UX (modal checkbox instead of setting)
- Add screenshot of modal with checkbox to documentation
- Update CHANGELOG.md with feature enhancement note

### User Communication
- Version bump: Minor (1.2.0) - feature enhancement, no breaking changes
- Release notes: Highlight improved UX for meeting mode control
- Migration guide: None needed (backward compatible)

---

## Next Steps

Run `/execute-plan move-meeting-mode-to-overlay` to begin implementation following this plan.
