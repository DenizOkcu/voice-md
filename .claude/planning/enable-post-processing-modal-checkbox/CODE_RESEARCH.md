# Code Research: Enable Post-Processing Modal Checkbox

## 1. Summary

**Risk Level:** Low

**Key Findings:**
- Recording modal already has a checkbox pattern implemented for "Meeting Mode" that can be replicated
- Settings persistence uses Obsidian's native `saveSettings()` method (async via `plugin.saveData()`)
- Modal currently passes boolean flags through callback, needs to accept additional post-processing parameter
- Global settings structure already includes `enablePostProcessing` boolean field

**Top Recommendations:**
- Clone the Meeting Mode checkbox implementation pattern in `audio-modal.ts:52-61`
- Add new property `postProcessingEnabled: boolean` to modal state, similar to `meetingModeEnabled`
- Update modal callback signature to pass 3 parameters: `(blob, meetingMode, postProcessing)`
- Access plugin instance in VoiceCommand to call `plugin.saveSettings()` for persistence
- Reuse existing CSS class `.voice-md-meeting-mode` for consistent styling

## 2. Integration Points

### Files to Modify:

**src/audio/audio-modal.ts:16-32**
- Add `postProcessingEnabled` property alongside `meetingModeEnabled` (line 16)
- Update callback signature from `(blob, meetingMode)` to `(blob, meetingMode, postProcessing)` (line 17)
- Add plugin instance reference to constructor to enable settings persistence

**src/audio/audio-modal.ts:51-68**
- Add second checkbox after Meeting Mode checkbox (duplicate pattern from lines 52-61)
- Position between Meeting Mode checkbox and Max Duration info
- Wire change handler to save to settings immediately using `plugin.saveSettings()`

**src/audio/audio-modal.ts:155**
- Update `onRecordingComplete` callback invocation to include post-processing flag

**src/commands/voice-command.ts:24-44**
- Update modal instantiation to pass plugin instance
- Update callback signature to accept `postProcessing` parameter (line 38)
- Pass post-processing parameter through to `handleRecording` method

**src/commands/voice-command.ts:50**
- Update `handleRecording` signature to accept `postProcessing` parameter
- Logic already handles post-processing via `this.settings.enablePostProcessing` (line 79)

**main.ts:26-27, 37**
- Pass `this` (plugin instance) to VoiceCommand constructor
- VoiceCommand needs access to plugin to save settings

**src/types.ts:5-13**
- No changes needed - `VoiceMDSettings` interface already has `enablePostProcessing: boolean`

### Reusable Patterns:

**Checkbox UI Pattern (audio-modal.ts:52-61):**
```typescript
const checkboxContainer = contentEl.createDiv({ cls: 'voice-md-meeting-mode' });
const label = checkboxContainer.createEl('label');
const checkbox = label.createEl('input', { type: 'checkbox' });
checkbox.checked = false; // or load from settings
label.appendText(' Enable Feature Name');

checkbox.addEventListener('change', () => {
  this.featureEnabled = checkbox.checked;
  // Persist to settings if plugin instance available
});
```

**Settings Persistence Pattern (main.ts:54-56):**
```typescript
async saveSettings() {
  await this.saveData(this.settings);
}
```

### Anti-patterns to Avoid:

- **Don't create new CSS classes** - reuse `.voice-md-meeting-mode` for both checkboxes
- **Don't change global settings default** - modal checkbox should read from existing global setting
- **Don't use synchronous storage** - use `await this.plugin.saveSettings()`
- **Don't block UI** - settings save should be fire-and-forget from checkbox handler

## 3. Technical Context

**Stack:**
- TypeScript (strict mode)
- Obsidian Plugin API
- No external UI framework (vanilla DOM)

**Patterns:**
- Modal extends Obsidian's `Modal` class
- Callback-based async communication between modal and command
- Settings persistence via `loadData()` / `saveData()` (JSON serialization)
- Property-based state management in modal class

**Conventions:**
- Private methods prefixed with `private`
- Async methods always return `Promise<T>`
- Settings changes trigger immediate persistence
- DOM elements created via Obsidian API (`createEl`, `createDiv`)
- CSS classes prefixed with `voice-md-`

## 4. Risks

**Technical Debt:**
- Modal doesn't have access to plugin instance (needed for `saveSettings()`)
- Callback signature will change (backward compatibility not an issue - internal API)
- VoiceCommand constructor needs plugin reference added

**Breaking Change Risks:**
- None - all changes are internal to the plugin

**Performance Concerns:**
- Settings save on checkbox toggle is async - no performance impact
- No additional API calls or network requests

**Security Concerns:**
- None - all data stored locally via Obsidian's secure storage API

## 5. Key Files

```
src/audio/audio-modal.ts:16 - Add postProcessingEnabled property
src/audio/audio-modal.ts:17 - Update callback signature
src/audio/audio-modal.ts:21-32 - Add plugin parameter to constructor
src/audio/audio-modal.ts:52-61 - Meeting Mode checkbox pattern to clone
src/audio/audio-modal.ts:62-68 - Insert new checkbox here (after Meeting Mode)
src/audio/audio-modal.ts:155 - Update callback invocation
src/commands/voice-command.ts:11-17 - Add plugin property to VoiceCommand
src/commands/voice-command.ts:38-40 - Update modal instantiation and callback
src/commands/voice-command.ts:50 - Update handleRecording signature
main.ts:26-27 - Pass plugin to VoiceCommand (ribbon icon handler)
main.ts:36-38 - Pass plugin to VoiceCommand (command handler)
main.ts:54-56 - Settings save pattern for reference
styles.css:56-85 - Reusable checkbox styling
```

## 6. Open Questions

**None** - Implementation path is clear. All patterns exist in codebase.

## Architecture Flow

**Current Flow:**
1. User opens recording modal via command
2. User checks "Meeting Mode" checkbox (stored in modal state only)
3. User records audio
4. Modal callback passes `(blob, meetingMode)` to VoiceCommand
5. VoiceCommand uses global `settings.enablePostProcessing` for post-processing decision

**Proposed Flow:**
1. User opens recording modal via command
2. Modal reads `settings.enablePostProcessing` and sets checkbox initial state
3. User checks/unchecks "Enable Post-Processing" checkbox
4. Checkbox change triggers `plugin.saveSettings()` (persists immediately)
5. User records audio
6. Modal callback passes `(blob, meetingMode, postProcessing)` to VoiceCommand
7. VoiceCommand can use either callback parameter or `settings.enablePostProcessing` (both in sync)

## Implementation Strategy

**Phase 1: Add Plugin Reference Chain**
1. Update VoiceCommand constructor to accept plugin instance
2. Update main.ts call sites to pass plugin instance
3. Update RecordingModal constructor to accept plugin instance
4. Update VoiceCommand modal instantiation to pass plugin

**Phase 2: Add Checkbox UI**
1. Add `postProcessingEnabled` property to RecordingModal
2. Clone Meeting Mode checkbox code block
3. Load initial state from `plugin.settings.enablePostProcessing`
4. Wire change handler to update property + save settings

**Phase 3: Update Callback Chain**
1. Update modal callback signature to include post-processing parameter
2. Update callback invocation in modal to pass 3 parameters
3. Update VoiceCommand callback to accept 3 parameters
4. Update handleRecording signature (parameter can be ignored if using settings)

**Phase 4: Styling**
1. Reuse existing `.voice-md-meeting-mode` CSS class
2. Consider renaming class to `.voice-md-checkbox-container` for clarity (optional)

## Testing Checklist

- [ ] Checkbox appears below Meeting Mode checkbox
- [ ] Initial checkbox state matches global settings value
- [ ] Checking checkbox immediately persists to settings
- [ ] Settings file updates correctly (check data.json)
- [ ] Recording still works with both checkboxes enabled/disabled
- [ ] Mobile touch target is adequate (44x44px min)
- [ ] CSS styling matches Meeting Mode checkbox
- [ ] No console errors during checkbox interaction
