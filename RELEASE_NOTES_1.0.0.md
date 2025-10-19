# Voice MD v1.0.0 🎤→📝

**Talk. Write. Done.** Transform your voice into markdown text instantly with OpenAI Whisper.

## Why Voice MD?

Stop context-switching between recording apps and Obsidian. Capture fleeting thoughts, dictate long-form content, or transcribe meeting notes—all without leaving your vault.

## ✨ What's Inside

**🎙️ One-Click Recording**
Click the ribbon icon or hit the command palette. That's it. No complex setup, no external apps.

**🤖 Whisper-Powered Transcription**
OpenAI's state-of-the-art speech recognition handles accents, background noise, and technical terminology with impressive accuracy.

**⚡ Instant Insertion**
Transcribed text appears exactly where your cursor is. No copy-paste, no file juggling.

**🎨 Real-Time Feedback**
Visual timer, recording status, and processing indicators keep you informed every step of the way.

**🔒 Privacy-First**
Audio is ephemeral—sent to Whisper API and immediately discarded. No local storage, no data retention.

## 🚀 Quick Start

1. **Get an API key**: https://platform.openai.com/api-keys (free tier available)
2. **Install via BRAT**: `DenizOkcu/voice-md`
3. **Paste your API key** in plugin settings
4. **Hit record** and start talking

## 💡 Perfect For

- Brain dumps when typing feels slow
- Meeting notes while your hands are busy
- Capturing ideas during walks (mobile coming soon™)
- Multilingual note-taking (auto-detects 90+ languages)
- Accessibility-first workflows

## 🎯 Tech Highlights

- **TypeScript** with strict mode for reliability
- **Layered architecture**: Clean separation between audio capture, API calls, and editor integration
- **MediaRecorder API**: Native browser audio recording (no dependencies)
- **Desktop-only** for now (MediaRecorder consistency + API reliability)

## ⚙️ Requirements

- Obsidian v0.15.0+
- Desktop (Windows/Mac/Linux)
- OpenAI API key
- Microphone access

## 📦 Installation

### BRAT (Recommended for Beta Testing)
```
1. Install BRAT plugin
2. Add Beta Plugin → DenizOkcu/voice-md
3. Configure API key in settings
```

### Manual
Download `main.js`, `manifest.json`, `styles.css` → Drop in `.obsidian/plugins/voice-md/`

## 🐛 Known Limitations

- Desktop only (mobile support planned)
- Requires internet connection (local Whisper model support considered)
- OpenAI API costs apply (~$0.006/minute of audio)

## 🛣️ What's Next?

- [ ] Mobile support
- [ ] Local Whisper models (offline mode)
- [ ] Custom prompt templates for domain-specific transcription
- [ ] Edit-before-insert option
- [ ] Hotkey customization

## 🙏 Feedback Wanted!

This is v1.0.0—battle-tested on my own vault, but your use cases will shape what comes next.

**Found a bug?** https://github.com/DenizOkcu/voice-md/issues
**Have an idea?** Drop a feature request!
**Love it?** Star the repo and tell your Obsidian friends.

---

**Built with** ☕ + TypeScript | **Powered by** OpenAI Whisper | **Made for** Obsidian
