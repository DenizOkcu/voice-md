# Code Research: Move Meeting Mode to Recording Overlay

**Issue:** move-meeting-mode-to-overlay
**Date:** 2025-10-19
**Risk Level:** LOW

## 1. Summary

### Key Findings
- Meeting mode is currently a global setting stored in `VoiceMDSettings`
- Settings flow: `main.ts` → `VoiceCommand` → `OpenAIClient.transcribe()`
- Recording modal (`RecordingModal`) is already passing settings/config to completion handler
- Modal UI uses standard Obsidian DOM API with clean separation from business logic
- No existing checkbox UI in modal - only buttons and timer display

### Risk Assessment: **LOW**
- **Rationale:** Clean architecture with well-defined boundaries, straightforward UI changes
- **Concerns:** State management shift from persistent settings to ephemeral modal state
- **Benefits:** User can toggle per-recording instead of per-session, improves UX flexibility

### Top Recommendations
1. Add checkbox state as modal instance property (not persisted)
2. Pass checkbox value through completion handler closure
3. Keep setting in `VoiceMDSettings` interface but deprecate UI (backward compatibility)
4. Add CSS for checkbox styling to match Obsidian's design system
5. Position checkbox near max duration info (line 50-55 in audio-modal.ts)

## 2. Integration Points

### Files to Modify

**Primary Changes:**

1. **src/audio/audio-modal.ts:33-82** - Modal UI construction
   - Add checkbox element after timer display (line ~48)
   - Add instance property: `private meetingModeEnabled: boolean = false`
   - Wire checkbox change handler to update instance property
   - Checkbox should be enabled/disabled based on recording state

2. **src/audio/audio-modal.ts:126-152** - Stop recording handler
   - Pass `this.meetingModeEnabled` value through completion handler
   - Modify: `this.onRecordingComplete(blob, this.meetingModeEnabled)`

3. **src/audio/audio-modal.ts:20-31** - Constructor signature
   - Update: `onRecordingComplete: (blob: Blob, enableMeetingMode: boolean) => void`

4. **src/commands/voice-command.ts:35-44** - Modal instantiation
   - Update completion handler signature to accept `enableMeetingMode` parameter
   - Pass to `handleRecording`: `(audioBlob, meetingMode) => { await this.handleRecording(audioBlob, editor, meetingMode); }`

5. **src/commands/voice-command.ts:50-138** - Recording handler
   - Add parameter: `meetingMode: boolean` to `handleRecording` method
   - Replace `this.settings.enableMeetingMode` with `meetingMode` parameter (lines 62, 74)

6. **main.ts:110-118** - Settings UI (REMOVAL)
   - Remove "Enable Meeting Mode" toggle setting
   - Keep `enableMeetingMode` in `DEFAULT_SETTINGS` for backward compatibility (line 13)

7. **styles.css** - Add checkbox styling
   - Add new class: `.voice-md-meeting-mode` for checkbox container
   - Style checkbox to match Obsidian design system

### Reusable Patterns

**Checkbox creation pattern (Obsidian API):**
```typescript
const checkboxContainer = contentEl.createDiv({ cls: 'voice-md-meeting-mode' });
const label = checkboxContainer.createEl('label');
const checkbox = label.createEl('input', { type: 'checkbox' });
checkbox.checked = false; // unchecked by default
label.appendText(' Enable Meeting Mode (Speaker Identification)');

checkbox.addEventListener('change', () => {
    this.meetingModeEnabled = checkbox.checked;
});
```

**Similar patterns in codebase:**
- `main.ts:103-108` - Toggle pattern for autoStartRecording
- `main.ts:113-118` - Toggle pattern for enableMeetingMode (current implementation)

### Anti-Patterns to Avoid
- ❌ Don't save checkbox state to plugin settings (should be ephemeral per-recording)
- ❌ Don't disable checkbox during recording (should be toggleable even while recording)
- ❌ Don't remove `enableMeetingMode` from `VoiceMDSettings` interface (breaking change for users with saved settings)

## 3. Technical Context

### Stack
- **Framework:** Obsidian Plugin API (v1.7.2+)
- **Language:** TypeScript (ES6, strict mode)
- **Build:** esbuild (watch mode for dev)
- **UI:** Vanilla DOM API via Obsidian wrappers (`contentEl.createDiv`, `createEl`)

### Architecture Patterns
- **Plugin lifecycle:** Main plugin class delegates to feature modules
- **Modal pattern:** Extend `Modal`, manage state in instance, use callbacks for results
- **State management:** Settings loaded once at plugin initialization, passed to commands
- **Event handling:** Direct event listeners (no framework), manual cleanup via `onClose()`

### Conventions
- **Naming:** camelCase for methods/variables, PascalCase for classes
- **Files:** Kebab-case (e.g., `audio-modal.ts`)
- **CSS classes:** Prefix with `voice-md-` for plugin namespace
- **Error handling:** Try-catch with user-facing `Notice` messages
- **Type safety:** Strict null checks, explicit types for public APIs

## 4. Risks & Concerns

### Technical Debt
- None identified in affected modules - clean, well-structured code

### Breaking Changes
- **Low risk:** Signature change to `onRecordingComplete` callback is internal-only
- **Mitigation:** Keep `enableMeetingMode` in settings schema (don't load it, just preserve)

### Performance
- **Negligible impact:** Adding one checkbox element has no measurable performance cost
- **Modal already lightweight:** Renders in <50ms, no complex state

### Security
- **No concerns:** Checkbox state is ephemeral, not persisted to disk
- **OpenAI API:** Meeting mode selection doesn't change security posture

### Mobile Compatibility
- **Checkbox should work:** Standard HTML input[type=checkbox] supported on iOS/Android
- **Touch targets:** Ensure label/checkbox area is large enough for touch (min 44x44px)
- **Testing required:** Verify checkbox visibility and interaction on mobile

## 5. Key Files Reference

```
main.ts:5-14              - DEFAULT_SETTINGS with enableMeetingMode
main.ts:110-118           - Settings UI (to be removed)

src/types.ts:5-14         - VoiceMDSettings interface
src/types.ts:32-38        - TranscriptionResult with segments

src/audio/audio-modal.ts:7-31      - RecordingModal class definition
src/audio/audio-modal.ts:33-82     - Modal UI construction (onOpen)
src/audio/audio-modal.ts:98-124    - Start recording handler
src/audio/audio-modal.ts:126-152   - Stop recording handler

src/commands/voice-command.ts:24-45  - VoiceCommand.execute() method
src/commands/voice-command.ts:50-138 - handleRecording() method
src/commands/voice-command.ts:59-63  - OpenAI transcribe call with meeting mode
src/commands/voice-command.ts:72-76  - Speaker formatting logic

src/api/openai-client.ts:25-63     - transcribe() method with meeting mode parameter
src/api/openai-client.ts:36-48     - Model selection based on meeting mode

styles.css:1-55           - Existing modal styles
```

## 6. Open Questions

### Critical Decisions

**Q1: Should meeting mode state be preserved between modal opens?**
- **Recommendation:** No - always default to unchecked for safety (user expectation, cost control)
- **Rationale:** Meeting mode uses more expensive API model, should be opt-in per recording

**Q2: Should checkbox be disabled during recording or toggleable?**
- **Recommendation:** Toggleable even during recording (per user requirements)
- **Implementation:** Store checkbox state at time of `stopRecording()`, not at `startRecording()`
- **Note:** This is unusual UX but explicitly requested

**Q3: Should we remove the setting entirely or just hide the UI?**
- **Recommendation:** Hide the UI toggle, keep setting property for backward compatibility
- **Rationale:** Users with existing settings won't break, no migration needed

**Q4: Mobile checkbox touch target size?**
- **Recommendation:** Use Obsidian's standard checkbox styling (already mobile-optimized)
- **Fallback:** If issues, wrap in larger label with padding for 44x44px touch area

### Clarifications Required

None - requirements are clear and technically straightforward.

## 7. Implementation Strategy

### Phase 1: Modal UI Changes (Low Risk)
1. Add checkbox instance property to `RecordingModal`
2. Add checkbox UI element in `onOpen()` method
3. Wire change handler to update instance property
4. Add CSS styling for checkbox container

### Phase 2: State Flow Changes (Medium Risk)
1. Update `onRecordingComplete` callback signature
2. Pass checkbox value through completion handler
3. Update `VoiceCommand.execute()` to accept new parameter
4. Update `handleRecording()` to use parameter instead of setting

### Phase 3: Settings Cleanup (Low Risk)
1. Remove "Enable Meeting Mode" toggle from settings UI
2. Keep `enableMeetingMode` in `DEFAULT_SETTINGS` (backward compat)
3. Add comment in settings noting deprecation

### Phase 4: Testing & Validation
1. Test checkbox interaction (check/uncheck during recording)
2. Test meeting mode API calls (verify correct model used)
3. Test speaker formatting in output
4. Test on mobile (iOS/Android touch interaction)

## 8. Related Documentation

- **Obsidian Modal API:** https://docs.obsidian.md/Plugins/User+interface/Modals
- **Obsidian Settings API:** https://docs.obsidian.md/Plugins/User+interface/Settings
- **OpenAI Transcription Models:** https://platform.openai.com/docs/guides/speech-to-text
- **GPT-4o Diarization:** Uses `gpt-4o-transcribe-diarize` model for speaker identification

## 9. Previous Implementation Context

This feature was added in commit `d5cc84a` (meeting mode with speaker identification). The original implementation added:
- Setting toggle in UI
- Model selection logic in `OpenAIClient.transcribe()`
- Speaker label formatting in `VoiceCommand.formatWithSpeakers()`

The current change moves user control from settings to modal UI, improving per-recording flexibility without changing core logic.

---

## Next Steps

Run `/issue-planner move-meeting-mode-to-overlay` to create detailed implementation plan.
