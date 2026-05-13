# Changelog

All notable changes to Voice MD will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.6] - 2025-11-06

### Fixed
- Fix Obsidian review issues: API compatibility, types, and linting

## [1.2.3] - 2025-10-20

### Fixed
- Fix API compatibility and Obsidian review feedback

## [1.2.2] - 2025-10-19

### Changed
- Update README for plugin submission

## [1.2.1] - 2025-10-19

### Fixed
- Fix diarized JSON response format for better speaker labels

## [1.2.0] - 2025-10-19

### Added
- Meeting mode with automatic speaker identification
- GPT-4o diarization for multi-speaker transcriptions
- Speaker label formatting in transcription output

## [1.1.3] - 2025-10-19

### Added
- 🚀 **Auto-start recording option** - Automatically start recording when modal opens for faster workflow
- New setting to toggle auto-start behavior

### Changed
- Improved user workflow efficiency with optional auto-start feature

## [1.1.2] - 2025-10-19

### Changed
- 🎨 **Improved mobile toolbar icon** - Better visual appearance on mobile devices
- Updated ribbon icon for better aesthetics

## [1.1.1] - 2025-10-19

### Changed
- 🎨 **Updated ribbon icon** - Enhanced visual appearance in the sidebar

### Documentation
- Added comprehensive README.md with feature documentation, usage guides, and troubleshooting

## [1.1.0] - 2025-10-19

### Added
- 👥 **Meeting Mode** - Automatic speaker identification for multi-speaker recordings
  - Distinguishes between different speakers
  - Labels transcripts as "Speaker 1:", "Speaker 2:", etc.
  - Perfect for meetings, interviews, podcasts, and group discussions
  - Uses `gpt-4o-transcribe-diarize` model
  - Works best with recordings longer than 30 seconds
- 📝 **Smart Post-Processing (Optional)** - GPT-powered formatting to transform raw transcriptions into structured markdown
  - Creates two files: raw transcription + formatted version
  - Automatic heading hierarchy, bullet points, and paragraph breaks
  - Preserves speaker labels from meeting mode
  - Configurable GPT model selection (`gpt-4o-mini`, `gpt-4o`, etc.)
  - Custom formatting prompts for specialized needs
  - Organized file output in `Voice Transcriptions/` folder

### Technical
- Integrated GPT-4o audio transcription with diarization support
- Added chat completion API for post-processing
- Enhanced settings interface with meeting mode and post-processing options
- Implemented dual-file output system (raw + formatted)
- Added timestamped file naming convention

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
- 🤖 OpenAI Audio Transcription API integration (gpt-4o-transcribe) for accurate transcription
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

[1.2.6]: https://github.com/DenizOkcu/voice-md/releases/tag/1.2.6
[1.2.3]: https://github.com/DenizOkcu/voice-md/releases/tag/1.2.3
[1.2.2]: https://github.com/DenizOkcu/voice-md/releases/tag/1.2.2
[1.2.1]: https://github.com/DenizOkcu/voice-md/releases/tag/1.2.1
[1.2.0]: https://github.com/DenizOkcu/voice-md/releases/tag/1.2.0
[1.1.3]: https://github.com/DenizOkcu/voice-md/releases/tag/1.1.3
[1.1.2]: https://github.com/DenizOkcu/voice-md/releases/tag/1.1.2
[1.1.1]: https://github.com/DenizOkcu/voice-md/releases/tag/1.1.1
[1.1.0]: https://github.com/DenizOkcu/voice-md/releases/tag/1.1.0
[1.0.1]: https://github.com/DenizOkcu/voice-md/releases/tag/1.0.1
[1.0.0]: https://github.com/DenizOkcu/voice-md/releases/tag/1.0.0
