# Voice MD v1.0.1 📱 - Mobile Support

**Now on your phone!** Voice MD works seamlessly on iOS and Android.

## 🎉 What's New

### 📱 Mobile Support
Your voice recording plugin is no longer desktop-bound. Record and transcribe directly in Obsidian mobile:

- ✅ **iOS Support** - iPhone and iPad (iOS 14.5+)
- ✅ **Android Support** - Modern Android devices
- ✅ **Same Great Features** - Recording, transcription, instant insertion

### 🔧 Technical Improvements

**Enhanced Audio Format Detection**
The plugin now intelligently selects the best audio format for your device:
- **iOS**: Uses MP4/AAC (native Safari format)
- **Android**: Uses WebM/Opus (native Chrome format)
- **Desktop**: Uses WebM/Opus (best quality)
- **Fallback**: WAV (universal compatibility)

**Capacitor WebView Compatibility**
Verified to work flawlessly in Obsidian's mobile runtime environment with full access to:
- Microphone capture
- OpenAI Whisper API
- Real-time UI feedback
- All desktop features

## 🚀 Try It On Mobile

1. **Already have it?** Just update via BRAT
2. **New install?** Add `DenizOkcu/voice-md` in BRAT
3. **Configure** your OpenAI API key
4. **Tap the mic** and start talking!

## 📋 Full Changelog

### Added
- Mobile platform support (iOS & Android)
- iOS-specific audio format handling (MP4/AAC)
- Android-specific audio format handling (WebM/Opus)
- Enhanced MIME type detection algorithm

### Changed
- `manifest.json`: `isDesktopOnly: false`
- Audio recorder now prioritizes platform-native formats
- Improved format fallback chain for reliability

### Technical Details
- Updated `getSupportedMimeType()` with mobile formats
- Added comprehensive format priority list
- Verified MediaRecorder API compatibility in Capacitor WebView
- No Node.js or Electron dependencies (pure web APIs)

## 🐛 Known Mobile Considerations

**Works Great:**
- ✅ Microphone permissions (handled by OS)
- ✅ Recording quality (excellent on modern devices)
- ✅ Network reliability (error handling included)
- ✅ UI responsiveness (adapts to screen size)

**Be Aware:**
- 📶 Requires internet connection (API calls)
- 🔋 Recording + API calls use battery (expected behavior)
- 📱 Background recording may pause if app minimized (OS behavior)

## 💡 Perfect Mobile Use Cases

- **On-the-go notes** - Capture thoughts during walks
- **Meeting notes** - Hands-free note-taking
- **Quick ideas** - Brain dumps without typing
- **Multilingual** - Speak in any language, auto-detected

## 🙏 Feedback

First mobile release! Let me know how it works on your device:

**Issues?** https://github.com/DenizOkcu/voice-md/issues
**Love it?** Star the repo ⭐
**Suggestions?** Drop a feature request

---

**Tested on** iPhone 13 Pro, iPad Air, Samsung Galaxy S21 | **Verified** Capacitor WebView compatibility
