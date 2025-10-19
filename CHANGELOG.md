# Changelog

All notable changes to Voice MD will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2024-10-19

### Added
- 📱 **Mobile support** - Plugin now works on Obsidian iOS and Android apps
- Enhanced audio format detection for cross-platform compatibility
- Support for iOS Safari's MP4/AAC audio format
- Support for Android Chrome's WebM/Opus audio format

### Changed
- Updated `manifest.json` to enable mobile platforms (`isDesktopOnly: false`)
- Improved MIME type fallback chain for better mobile compatibility
- Enhanced audio recorder to prioritize platform-specific formats

### Technical
- Updated `getSupportedMimeType()` to include mobile-specific audio formats
- Added format priority: WebM (desktop) → MP4 (iOS) → OGG → WAV (fallback)
- Verified compatibility with Capacitor WebView (Obsidian mobile runtime)

## [1.0.0] - 2024-10-19

### Added
- 🎤 Voice recording with real-time microphone access
- 🤖 OpenAI Whisper API integration for accurate transcription
- ⚡ Automatic text insertion at cursor position
- ⚙️ Configurable settings (API key, max duration, language)
- 🎨 Recording modal with timer and visual feedback
- 🔒 Privacy-first design (ephemeral audio, no local storage)
- 📝 Comprehensive error handling with user-friendly messages
- 🎨 Custom CSS styling for recording interface

### Technical
- TypeScript with strict mode
- Layered architecture (audio/API/commands/utils)
- MediaRecorder API for audio capture
- OpenAI SDK v4.20.0 integration
- Desktop-only initial release (changed in 1.0.1)

[1.0.1]: https://github.com/DenizOkcu/voice-md/releases/tag/1.0.1
[1.0.0]: https://github.com/DenizOkcu/voice-md/releases/tag/1.0.0
