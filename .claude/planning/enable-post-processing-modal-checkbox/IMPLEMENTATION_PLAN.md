# Implementation Plan: Enable Post-Processing Modal Checkbox

## 1. Overview

**Goal:** Add a checkbox to the recording modal that allows users to enable/disable post-processing per recording, overriding the global setting.

**Success Criteria:**
- Checkbox appears in recording modal UI below Meeting Mode checkbox
- Checkbox state defaults to global `enablePostProcessing` setting value
- User can toggle checkbox before/during recording
- Post-processing decision respects checkbox state instead of global setting
- UI remains consistent with existing modal design patterns

## 2. Phases

### Phase 1: Extend Modal State (Complexity: Low)
- **Task 1:** `src/audio/audio-modal.ts:16-32` - Add private property `postProcessingEnabled: boolean` to store checkbox state
- **Task 2:** `src/audio/audio-modal.ts:21-32` - Update constructor to accept `enablePostProcessing: boolean` parameter (from settings)
- **Task 3:** `src/audio/audio-modal.ts:17` - Update callback signature to `(blob: Blob, enableMeetingMode: boolean, enablePostProcessing: boolean) => void`

### Phase 2: Update Modal UI (Complexity: Low)
- **Task 1:** `src/audio/audio-modal.ts:51-61` - Add post-processing checkbox container after meeting mode checkbox
- **Task 2:** `src/audio/audio-modal.ts:52-61` - Wire checkbox change handler to update `this.postProcessingEnabled`
- **Task 3:** `src/audio/audio-modal.ts:155` - Pass `this.postProcessingEnabled` to completion callback
- **Task 4:** `styles.css:56-86` - Reuse existing `.voice-md-meeting-mode` styles or create `.voice-md-post-processing` class (optional)

### Phase 3: Update Voice Command (Complexity: Low)
- **Task 1:** `src/commands/voice-command.ts:35-44` - Pass `this.settings.enablePostProcessing` to RecordingModal constructor
- **Task 2:** `src/commands/voice-command.ts:38-40` - Update callback signature to receive `enablePostProcessing` parameter
- **Task 3:** `src/commands/voice-command.ts:50` - Update `handleRecording` method signature to accept `enablePostProcessing: boolean`
- **Task 4:** `src/commands/voice-command.ts:78-79` - Replace `this.settings.enablePostProcessing` check with local `enablePostProcessing` parameter

### Phase 4: Testing & Validation (Complexity: Low)
- **Task 1:** Test with global setting enabled, checkbox unchecked → no post-processing
- **Task 2:** Test with global setting disabled, checkbox checked → post-processing runs
- **Task 3:** Test checkbox state persists during recording (doesn't reset)
- **Task 4:** Test on mobile devices (iOS/Android) - ensure checkbox is tappable
- **Task 5:** Verify backward compatibility - existing recordings still work

## 3. Testing

**Unit Testing:**
- RecordingModal constructor initializes `postProcessingEnabled` from parameter
- Checkbox change handler correctly updates modal state
- Completion callback receives correct boolean values

**Integration Testing:**
- End-to-end flow: Open modal → Toggle checkbox → Record → Verify post-processing behavior
- Global setting disabled + checkbox enabled → post-processing runs
- Global setting enabled + checkbox disabled → raw transcription only
- Meeting Mode + Post-Processing both enabled → both features work together

**Edge Cases:**
- Empty transcription with post-processing enabled
- Post-processing API failure fallback behavior
- Auto-start recording with default checkbox state
- Rapid checkbox toggling during recording

## 4. Estimates

| Phase | Effort  |
|-------|---------|
| 1     | 15 min  |
| 2     | 20 min  |
| 3     | 15 min  |
| 4     | 20 min  |
| **Total** | **70 min** |

## Notes

- **No breaking changes** - existing code paths remain functional
- **Backward compatible** - old recordings/workflows unaffected
- **Follows existing patterns** - mirrors Meeting Mode checkbox implementation
- **Mobile-friendly** - reuses touch-optimized CSS from `.voice-md-meeting-mode`
- **Settings precedence** - Modal checkbox overrides global setting for that recording only
