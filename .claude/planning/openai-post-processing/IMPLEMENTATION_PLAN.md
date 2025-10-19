# Implementation Plan: OpenAI Post-Processing with Markdown Structuring

**Goal:** Add optional post-processing of voice transcriptions using OpenAI chat completions to structure raw text into well-formatted markdown.

**Success Criteria:**
- Post-processing toggle in settings (opt-in by default)
- Configurable chat model (default: "gpt-4o-mini")
- Creates two files: raw transcription + structured markdown with cross-links
- Graceful error handling with fallback to raw-only
- Progress notifications for user feedback during processing

---

## Phase 1: Core Settings & Types (Complexity: Low)

**Task 1:** `src/types.ts:5-10` - Extend VoiceMDSettings interface
- Add `chatModel: string` field
- Add `enablePostProcessing: boolean` field
- Add `postProcessingPrompt?: string` field (optional custom prompt)

**Task 2:** `main.ts:5-20` - Update DEFAULT_SETTINGS
- Set `chatModel: 'gpt-4o-mini'` (cost-effective default)
- Set `enablePostProcessing: false` (opt-in for safety)
- Set `postProcessingPrompt: undefined` (use hardcoded default)

**Task 3:** `src/types.ts:30-35` - Extend VoiceMDError type
- Add `{ type: 'POST_PROCESSING_ERROR'; message: string }` union member

---

## Phase 2: OpenAI Client Extension (Complexity: Medium)

**Task 1:** `src/api/openai-client.ts:57-100` - Add `structureText()` method
- Accept parameters: `rawText: string, model: string, customPrompt?: string`
- Build chat completion request with system prompt:
  ```
  "You are a helpful assistant that formats voice transcriptions into well-structured markdown.
  Use appropriate headings (##, ###), bullet points, numbered lists, and paragraphs.
  Preserve all content from the original transcription while improving readability."
  ```
- Use user message: `"Format the following transcription as clear markdown:\n\n${rawText}"`
- Set temperature: 0.3 (consistent formatting)
- Set max_tokens: 4096 (handle long transcriptions)
- Return `completion.choices[0].message.content`
- Wrap in try-catch, throw POST_PROCESSING_ERROR on failure

**Task 2:** `src/utils/error-handler.ts:72-108` - Update `fromOpenAIError()`
- Add handling for chat completion errors
- Map rate limit errors (429) to user-friendly messages
- Map invalid model errors to specific feedback

---

## Phase 3: File Management & Workflow (Complexity: High)

**Task 1:** `src/commands/voice-command.ts:49-81` - Refactor `handleRecording()`
- After transcription succeeds, check `this.settings.enablePostProcessing`
- If enabled:
  1. Update notice: "Structuring text..."
  2. Call `client.structureText(result.text, this.settings.chatModel)`
  3. Create both files using new helper method
  4. Insert structured text at cursor (backward compatibility)
  5. Show success notice with file links
- If disabled or post-processing fails:
  1. Insert raw text at cursor (current behavior)
  2. Show appropriate notice

**Task 2:** `src/commands/voice-command.ts:85-150` - Add `createTranscriptionFiles()` helper
- Generate timestamp: `moment().format('YYYY-MM-DD-HHmmss')`
- Define folder path: `"Voice Transcriptions"`
- Check if folder exists using `this.app.vault.getAbstractFileByPath(folderPath)`
- If not, create with `await this.app.vault.createFolder(folderPath)`
- Create raw file: `transcription-{timestamp}-raw.md` with raw text
- Create structured file: `transcription-{timestamp}.md` with:
  ```markdown
  > Raw transcription: [[transcription-{timestamp}-raw]]

  {structured text}
  ```
- Return both file paths for user feedback

**Task 3:** `src/commands/voice-command.ts:24-32` - Update pre-flight checks
- No changes needed (API key check is sufficient)

---

## Phase 4: Settings UI (Complexity: Low)

**Task 1:** `main.ts:55-106` - Add post-processing toggle in `VoiceMDSettingTab.display()`
- Add setting: "Enable Post-Processing"
  - Description: "Structure transcriptions into formatted markdown using GPT. Creates two files: raw and structured. This feature makes additional API calls."
  - Toggle control bound to `enablePostProcessing`

**Task 2:** `main.ts:55-106` - Add chat model input
- Add setting: "Chat Model"
  - Description: "OpenAI model for post-processing (e.g., gpt-4o-mini, gpt-4o). Note: Adds cost per transcription."
  - Text input bound to `chatModel`
  - Only visible when `enablePostProcessing` is true

**Task 3:** `main.ts:55-106` - Add custom prompt input (optional)
- Add setting: "Custom Formatting Prompt"
  - Description: "Override the default prompt for structuring. Leave blank to use default."
  - Text area bound to `postProcessingPrompt`
  - Only visible when `enablePostProcessing` is true

---

## Testing

**Unit Tests:** (Manual - no test suite exists)
- `OpenAIClient.structureText()` with sample text
- Error handling for invalid API responses
- File creation with various timestamp formats

**Integration Tests:**
- End-to-end: Record → Transcribe → Post-process → File creation
- Settings toggle: Verify post-processing only runs when enabled
- Error recovery: Simulate API failure, verify fallback to raw-only
- File system: Check folder creation, file naming, and cross-links

**Edge Cases:**
- Empty transcription (should not post-process)
- Very long transcription (>4096 tokens - should truncate gracefully)
- API rate limiting (429 error - show user-friendly message)
- Invalid chat model name (catch error, show notice)
- Folder "Voice Transcriptions" already exists as a file (catch error)
- Special characters in timestamp (ensure valid file names)

---

## Estimates

| Phase | Tasks | Effort  |
|-------|-------|---------|
| 1     | 3     | 20 min  |
| 2     | 2     | 30 min  |
| 3     | 3     | 45 min  |
| 4     | 3     | 25 min  |
| **Total** | **11** | **2 hrs** |

---

## Notes

- **Cost consideration:** Users should be aware that post-processing adds OpenAI API costs (chat completion per transcription)
- **Default model:** Using `gpt-4o-mini` for cost efficiency; users can upgrade to `gpt-4o` if desired
- **Backward compatibility:** When post-processing is disabled, behavior is unchanged (insert at cursor)
- **Mobile support:** All APIs used (Vault, OpenAI) work on mobile platforms
- **Future enhancements:**
  - User-configurable file paths/naming
  - Retry logic for transient failures
  - Token usage tracking/display
