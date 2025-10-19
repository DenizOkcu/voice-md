# Implementation Plan: Voice MD Recording

## 1. Overview

**Goal:** Build an Obsidian plugin that records audio, transcribes it using OpenAI Whisper API, and inserts the transcription as markdown into the active note.

**Success Criteria:**
- User can start/stop audio recording via command or ribbon icon
- Audio is captured and sent to OpenAI Whisper API for transcription
- Transcribed text is inserted at cursor position in the active markdown editor
- User can configure OpenAI API key in plugin settings
- Error handling provides clear feedback for network/API failures

## 2. Phases

### Phase 1: Project Setup & Configuration (Complexity: Low)
- `manifest.json:2-10` - Update plugin metadata (id, name, description, author)
- `package.json:2-13` - Update package metadata and add OpenAI SDK dependency
- `main.ts:5-11` - Define `VoiceMDSettings` interface with OpenAI API key
- `main.ts:13` - Rename plugin class to `VoiceMDPlugin`
- `main.ts:110-134` - Update settings tab for API key configuration

### Phase 2: Audio Recording Infrastructure (Complexity: High)
- `src/audio/recorder.ts` - New: Create `AudioRecorder` class
  - Initialize MediaRecorder with browser MediaStream API
  - Handle start/stop recording with state management
  - Convert recorded audio to blob (WAV/MP3 format)
  - Expose audio data for API submission
- `src/audio/audio-modal.ts` - New: Create recording UI modal
  - Display recording status (idle/recording/processing)
  - Show elapsed time during recording
  - Provide start/stop/cancel controls
  - Handle user permissions for microphone access

### Phase 3: OpenAI Whisper Integration (Complexity: Medium)
- `src/api/openai-client.ts` - New: Create OpenAI API client
  - Initialize with API key from settings
  - Implement `transcribe()` method using Whisper API
  - Handle audio file upload (FormData with blob)
  - Parse and return transcription text
  - Handle rate limits and API errors
- `src/utils/error-handler.ts` - New: Centralized error handling
  - Map API errors to user-friendly messages
  - Handle network failures gracefully

### Phase 4: Editor Integration & Commands (Complexity: Medium)
- `main.ts:16-79` - Replace sample code with Voice MD implementation
  - Add ribbon icon with microphone symbol
  - Register command: "Start/Stop Voice Recording"
  - Integrate AudioRecorder and OpenAI client
  - Insert transcribed text at cursor position using `editor.replaceSelection()`
- `main.ts:16-20` - Add status bar indicator for recording state
- `src/commands/voice-command.ts` - New: Encapsulate voice recording logic
  - Orchestrate recording → transcription → insertion workflow
  - Handle loading states and user feedback via Notices

## 3. Testing

**Unit Tests:**
- `AudioRecorder.start()` / `.stop()` state transitions
- OpenAI client request formatting and response parsing
- Error handler message mapping

**Integration Tests:**
- Full workflow: record → transcribe → insert into editor
- Settings persistence (API key save/load)
- Microphone permission handling (granted/denied)

**Edge Cases:**
- No microphone available
- Invalid/expired OpenAI API key
- Network timeout during transcription
- Recording stopped before any audio captured
- API rate limit exceeded
- Very long recordings (>10 minutes)

## 4. Estimates

| Phase | Effort |
|-------|--------|
| 1. Setup & Config | 30min |
| 2. Audio Recording | 2hr |
| 3. OpenAI Integration | 1.5hr |
| 4. Editor Integration | 1hr |
| **Total** | **5hr** |
