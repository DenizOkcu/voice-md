# Project Specification: Voice MD Recording Plugin

## 1. Requirements

### Functional Requirements
- Record audio from user's microphone using browser MediaStream API
- Transcribe audio using OpenAI Whisper API (audio-to-text)
- Insert transcribed markdown text at cursor position in active editor
- Provide visual feedback during recording and transcription states
- Store and manage OpenAI API key securely in plugin settings
- Support keyboard shortcuts and ribbon icons for quick access

### Non-Functional Requirements
- **Performance**: Transcription completes within 2-5 seconds for 1-minute audio clips
- **Security**: API key stored in Obsidian's encrypted data storage
- **Compatibility**: Desktop-only (requires reliable microphone access)
- **User Experience**: Clear visual indicators for recording/processing states
- **Error Recovery**: Graceful handling of API failures with actionable error messages

## 2. Technical Design

### Architecture
**Pattern**: Layered architecture with separation of concerns
- **Presentation Layer**: Modal UI, status indicators, commands
- **Business Logic**: Recording orchestration, state management
- **Data Access**: Audio capture (MediaStream), OpenAI API client
- **Configuration**: Settings persistence via Obsidian's data API

### Components
1. **VoiceMDPlugin** (`main.ts`) - Plugin entry point, lifecycle management
2. **AudioRecorder** (`src/audio/recorder.ts`) - MediaStream recording wrapper
3. **RecordingModal** (`src/audio/audio-modal.ts`) - Recording UI and controls
4. **OpenAIClient** (`src/api/openai-client.ts`) - Whisper API integration
5. **VoiceCommand** (`src/commands/voice-command.ts`) - Workflow orchestrator
6. **ErrorHandler** (`src/utils/error-handler.ts`) - Error mapping and notices

### Data Flow
```
User triggers command
  → RecordingModal opens
  → AudioRecorder starts capture
  → User stops recording
  → Audio blob created
  → OpenAIClient sends to Whisper API
  → Transcription received
  → Text inserted at cursor via Editor API
  → Modal closes, success notice shown
```

### Key Types/Interfaces

```typescript
// Settings
interface VoiceMDSettings {
  openaiApiKey: string;
  whisperModel: 'whisper-1'; // Future: support different models
  language?: string; // Optional: force language (auto-detect by default)
  maxRecordingDuration: number; // In seconds, default 300 (5 min)
}

// Audio Recorder
interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // In seconds
  audioBlob: Blob | null;
}

class AudioRecorder {
  private mediaRecorder: MediaRecorder | null;
  private audioChunks: Blob[];

  async start(): Promise<void>;
  stop(): Promise<Blob>;
  getState(): RecordingState;
  cleanup(): void;
}

// OpenAI Client
interface TranscriptionOptions {
  language?: string;
  prompt?: string; // Context for better accuracy
}

interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
}

class OpenAIClient {
  constructor(apiKey: string);
  async transcribe(audioBlob: Blob, options?: TranscriptionOptions): Promise<TranscriptionResult>;
}

// Error types
type VoiceMDError =
  | { type: 'NO_MICROPHONE'; message: string }
  | { type: 'PERMISSION_DENIED'; message: string }
  | { type: 'API_ERROR'; code: string; message: string }
  | { type: 'NETWORK_ERROR'; message: string }
  | { type: 'INVALID_API_KEY'; message: string };
```

### Files to Create/Modify

```
main.ts:1-135 - Modify: Replace sample plugin with VoiceMDPlugin implementation
manifest.json:2-10 - Modify: Update plugin metadata
package.json:14-24 - Modify: Add openai SDK dependency

src/audio/recorder.ts - New: Audio recording logic with MediaRecorder
src/audio/audio-modal.ts - New: Recording UI modal component
src/api/openai-client.ts - New: OpenAI Whisper API client
src/commands/voice-command.ts - New: Command handler for voice recording workflow
src/utils/error-handler.ts - New: Error handling utilities
src/types.ts - New: Shared TypeScript interfaces
```

## 3. Error Handling

### Validation Strategy
- **Pre-flight checks**: Verify API key exists before allowing recording
- **Microphone permissions**: Request and validate before MediaRecorder init
- **Input validation**: Check audio blob size/format before API submission

### Error Scenarios

1. **No API Key Configured**
   - Display notice: "OpenAI API key not configured. Please set it in plugin settings."
   - Open settings tab automatically

2. **Microphone Access Denied**
   - Display notice: "Microphone access denied. Please grant permission in browser settings."
   - Provide help link to browser permission docs

3. **API Request Failed (401/403)**
   - Display notice: "Invalid API key. Please check your OpenAI API key in settings."
   - Log full error for debugging

4. **Network Timeout**
   - Display notice: "Transcription timed out. Please check your internet connection and try again."
   - Offer retry option

5. **Rate Limit Exceeded (429)**
   - Display notice: "OpenAI rate limit exceeded. Please wait a moment and try again."
   - Show estimated retry time if available in headers

### User Feedback Approach
- **Notices**: Use Obsidian's `Notice` class for transient status messages
- **Modal States**: Show loading spinners during processing
- **Status Bar**: Indicate recording state for ambient awareness
- **Logging**: Console.error for debugging, no sensitive data logged

## 4. Configuration

### Environment Variables
None required. API key stored in plugin settings.

### Configuration Files
**Plugin Settings** (via Obsidian's data.json):
```json
{
  "openaiApiKey": "sk-...",
  "whisperModel": "whisper-1",
  "maxRecordingDuration": 300,
  "language": null
}
```

### External Dependencies

**NPM Packages:**
```json
{
  "openai": "^4.20.0"
}
```

**Browser APIs:**
- `MediaDevices.getUserMedia()` - Microphone access
- `MediaRecorder` - Audio recording
- `Blob` - Audio data handling

**Obsidian APIs:**
- `Plugin` - Plugin lifecycle
- `Editor` - Text insertion
- `Modal` - Recording UI
- `Notice` - User notifications
- `PluginSettingTab` - Settings UI

### Manifest Configuration
```json
{
  "isDesktopOnly": true
}
```
*Reason*: Mobile browsers have inconsistent MediaRecorder support and microphone permissions are more restricted.

## 5. Security Considerations

- **API Key Storage**: Use Obsidian's encrypted `loadData()` / `saveData()` methods
- **No Local Audio Storage**: Audio blobs deleted immediately after transcription
- **HTTPS Only**: OpenAI API enforces HTTPS; no insecure connections
- **No Telemetry**: Plugin does not collect usage data or send audio elsewhere

## 6. Future Enhancements (Out of Scope)

- Support for multiple Whisper models (currently hardcoded to `whisper-1`)
- Offline transcription using local models
- Audio file import (vs. live recording only)
- Custom prompt templates for domain-specific transcription
- Transcription editing before insertion
- Language auto-detection override
