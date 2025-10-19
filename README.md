# Voice MD

**Transform your voice into formatted markdown notes.** Record, transcribe, and structure your thoughts—all without leaving Obsidian.

Voice MD leverages OpenAI's powerful transcription models to turn your spoken words into text, with optional GPT-powered formatting that transforms raw transcriptions into well-organized markdown.

[![GitHub release](https://img.shields.io/github/v/release/DenizOkcu/voice-md?style=flat-square)](https://github.com/DenizOkcu/voice-md/releases)
[![License](https://img.shields.io/github/license/DenizOkcu/voice-md?style=flat-square)](LICENSE)

---

## ✨ Features

### 🎯 Core Functionality
- **One-click recording** via ribbon icon or command palette
- **Accurate transcription** powered by OpenAI's GPT-4o audio models
- **Inline insertion** at your cursor position
- **Auto-language detection** or force specific languages
- **Configurable duration** limits (default: 5 minutes)
- **Auto-start option** for faster workflow

### 👥 Meeting Mode ✨ NEW
Transform multi-speaker recordings into structured transcripts with automatic speaker identification:

- **Automatic speaker detection** - distinguishes between different speakers
- **Labeled transcripts** - clearly formatted as `**Speaker 1:**`, `**Speaker 2:**`, etc.
- **Perfect for:**
	- 📋 Meeting notes with multiple participants
	- 🎤 Interview transcriptions
	- 🎙️ Podcast recordings
	- 💬 Group discussions

**Example output:**
```markdown
**Speaker 1:** Welcome everyone to today's meeting. Let's start with the project update.

**Speaker 2:** Thanks for having me. I've completed the first phase of development.

**Speaker 1:** That's great to hear. What were the main challenges?
```

### 📝 Smart Post-Processing (Optional)
Enable GPT-powered formatting to transform raw transcriptions into structured markdown:

- Creates **two files**: raw transcription + formatted version
- Automatic **heading hierarchy**, **bullet points**, and **paragraph breaks**
- **Preserves speaker labels** from meeting mode
- Choose your preferred GPT model (`gpt-4o-mini`, `gpt-4o`, etc.)
- **Custom prompts** for specialized formatting needs

**Perfect for:**
- 💼 Meeting notes → structured summaries
- 📌 Voice memos → actionable tasks
- 💭 Stream of consciousness → organized thoughts
- 🎤 Interviews → formatted Q&A
- 👥 Multi-speaker recordings → attributed dialogue

---

## 🚀 Quick Start

### 1. Install the Plugin

**Via BRAT (Recommended):**
1. Install the [BRAT plugin](https://github.com/TfTHacker/obsidian42-brat)
2. Open BRAT settings → "Add Beta plugin"
3. Enter: `DenizOkcu/voice-md`
4. Enable Voice MD in **Settings → Community plugins**

**Manual Installation:**
1. Download from [GitHub Releases](https://github.com/DenizOkcu/voice-md/releases)
2. Extract `main.js` and `manifest.json` to `<vault>/.obsidian/plugins/voice-md/`
3. Restart Obsidian
4. Enable Voice MD in **Settings → Community plugins**

### 2. Add Your OpenAI API Key

1. Get your API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Go to **Settings → Voice MD**
3. Paste your API key

### 3. Start Recording!

- 🎙️ Click the microphone icon in the ribbon, **or**
- ⌨️ Use command palette: `"Start Voice Recording"`
- 🛑 Click again to stop

That's it! Your transcribed text appears right in your note. ✨

---

## ⚙️ Configuration

Access settings via **Settings → Voice MD**:

### 🔑 Required
- **OpenAI API Key** - Your API key from OpenAI

### 🎚️ Recording Options
- **Max Recording Duration** - Set a limit in seconds (default: 300s / 5 minutes)
- **Auto-Start Recording** - Automatically start recording when modal opens
- **Language** - Force a specific language (`en`, `es`, `fr`, etc.) or leave blank for auto-detection

### 👥 Meeting Mode
- **Enable Meeting Mode** - Identify different speakers in your recordings
	- ℹ️ Uses `gpt-4o-transcribe-diarize` model for speaker identification
	- ℹ️ May add 10-30% to API response time
	- ℹ️ Works best with recordings longer than 30 seconds

### ✨ Post-Processing (Optional)
- **Enable Post-Processing** - Toggle GPT-powered markdown formatting
- **Chat Model** - Choose the GPT model (default: `gpt-4o-mini`)
- **Custom Formatting Prompt** - Override default structuring instructions

---

## 📖 Usage Guide

### Basic Recording

1. **Open any note** in Obsidian
2. **Place cursor** where you want the transcription
3. **Click microphone** icon or run `"Start Voice Recording"`
4. **Speak naturally** 🗣️
5. **Click again** to stop recording
6. **Wait briefly** for transcription ⏳
7. **Text appears** at cursor position ✅

### Meeting Mode Workflow

Perfect for recording conversations with multiple speakers:

1. **Enable Meeting Mode** in settings
2. **Start recording** as usual
3. **Let people talk naturally** - no need to identify speakers
4. **Stop recording** when done
5. **Automatic speaker labels** appear in your transcript:

```markdown
**Speaker 1:** I think we should focus on the user interface first.

**Speaker 2:** I agree, but we also need to consider the backend architecture.

**Speaker 1:** Good point. Let's schedule a follow-up to discuss both.
```

### With Post-Processing

When post-processing is enabled, you get both raw and structured versions:

1. Follow the workflow above
2. **Two files created** in `Voice Transcriptions/` folder:
	 - `transcription-YYYY-MM-DD-HHmmss-raw.md` - Original transcription
	 - `transcription-YYYY-MM-DD-HHmmss.md` - Formatted version with link to raw
3. **Structured version inserts** at cursor position
4. **Review and edit** as needed

**Example structured output:**
```markdown
> Raw transcription: [[transcription-2025-10-19-123456-raw]]

## Meeting Summary

**Speaker 1:** Opened discussion about project timeline and priorities.

**Speaker 2:** Shared concerns about resource allocation and proposed...

### Action Items
- Follow up on backend architecture discussion
- Schedule UI review session
- Document current priorities
```

---

## 💡 Tips for Best Results

### General Tips
- 🗣️ **Speak clearly** at a moderate pace
- ⏸️ **Pause briefly** between major points for better sentence detection
- 🌐 **Use natural language** - no need to say "period" or "comma"
- ✏️ **Review and edit** - AI is powerful but not perfect

### Meeting Mode Tips
- 👥 **Works best with 2-6 speakers** - too many voices can reduce accuracy
- 🎤 **Clear audio helps** - minimize background noise when possible
- ⏱️ **Longer is better** - recordings >30 seconds give better speaker identification
- 🔄 **Consistent speakers** - accuracy improves when same speakers continue talking

### Post-Processing Tips
- 📋 **Mention structure** while speaking (e.g., "first point", "next section")
- 🎯 **Custom prompts** help with specialized formatting needs
- 🔍 **Review both versions** - raw + structured - choose what works best

---

## 💰 Pricing

Voice MD uses OpenAI's APIs, which incur costs based on usage

[Check current OpenAI pricing →](https://openai.com/api/pricing/)

---

## 🔒 Privacy & Security

**Privacy-first design** - Your data stays yours.

### ✅ What Gets Sent
- **Audio recordings** → OpenAI API (only during transcription)
- **Text for formatting** → OpenAI API (only if post-processing enabled)

### 🏠 What Stays Local
- ✅ Your API key (stored in Obsidian's local data)
- ✅ Your notes (never uploaded)
- ✅ Your settings (remain on device)
- ✅ Your recordings (processed in-memory, not saved)

### What We Don't Do
- No tracking or analytics
- No third-party services (except OpenAI API)
- No data collection
- No accounts or sign-ups
- No remote servers (beyond OpenAI)

**You control your data.** Audio is sent to OpenAI only for transcription, then discarded. Everything else stays on your machine.

📖 See [OpenAI's Privacy Policy](https://openai.com/policies/privacy-policy) for how they handle API requests.

---

## 🐛 Troubleshooting

<details>
<summary><strong>❓ "No API key configured"</strong></summary>

Go to **Settings → Voice MD** and add your OpenAI API key.

Get one at [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
</details>

<details>
<summary><strong>🎤 Recording doesn't start</strong></summary>

Check that Obsidian has microphone permissions:
- **macOS:** System Settings → Privacy & Security → Microphone
- **Windows:** Settings → Privacy → Microphone
- **Linux:** Check your browser/Electron permissions
</details>

<details>
<summary><strong>⚠️ Transcription fails</strong></summary>

- ✅ Verify API key is correct and active
- 💳 Check OpenAI account has available credits
- 🌐 Ensure stable internet connection
- 🔍 Check console logs (Cmd/Ctrl+Shift+I) for error details
</details>

<details>
<summary><strong>👥 Meeting mode not showing speakers</strong></summary>

- ⏱️ Recording may be too short (try >30 seconds)
- 🎤 Audio quality may need improvement
- 🗣️ Speakers may sound too similar
- ✅ Verify meeting mode toggle is enabled in settings
</details>

<details>
<summary><strong>📝 Post-processing not working</strong></summary>

- ✅ Confirm post-processing is enabled in settings
- 🔑 Verify API key has access to selected GPT model
- 🔍 Check console (Cmd/Ctrl+Shift+I) for error messages
- 💳 Ensure OpenAI credits are available
</details>

---

**Have ideas?** [Open an issue](https://github.com/DenizOkcu/voice-md/issues) or contribute!

---

## 🤝 Support & Community

- **💬 Discussions** - [GitHub Discussions](https://github.com/DenizOkcu/voice-md/discussions)
- **🐛 Report Issues** - [GitHub Issues](https://github.com/DenizOkcu/voice-md/issues)
- **❤️ Sponsor** - [GitHub Sponsors](https://github.com/sponsors/DenizOkcu)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Enjoy effortless note-taking!** ✨

If Voice MD saves you time, consider [⭐ starring the repo](https://github.com/DenizOkcu/voice-md) or [❤️ sponsoring the project](https://github.com/sponsors/DenizOkcu).

Made with ❤️ by [Deniz Okcu](https://github.com/DenizOkcu)

</div>
