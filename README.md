# Voice MD

**Transform your voice into beautifully formatted markdown notes.** Record, transcribe, and optionally structure your thoughts—all without leaving Obsidian.

Voice MD leverages OpenAI's Whisper API to turn your spoken words into text, with an optional GPT-powered post-processing step that transforms raw transcriptions into well-organized, structured markdown.

## Quick Start

1. **Install the plugin**
   - Via BRAT: Add `DenizOkcu/voice-md` in the BRAT plugin settings
   - Or manually: Download and extract to `.obsidian/plugins/voice-md/`

2. **Add your OpenAI API key**
   - Go to Settings → Voice MD
   - Paste your API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

3. **Start recording**
   - Click the microphone icon in the ribbon, or
   - Use the command palette: "Start Voice Recording"
   - Click again to stop

That's it! Your transcribed text appears right in your note.

## Features

### Core Functionality
- **One-click recording** via ribbon icon or command palette
- **Accurate transcription** powered by OpenAI Whisper
- **Inline insertion** at your cursor position
- **Auto-language detection** or force specific languages
- **Configurable duration** limits (default: 5 minutes)

### Smart Post-Processing (Optional)
Enable GPT-powered formatting to transform raw transcriptions into structured markdown:
- Creates **two files**: raw transcription + formatted version
- Automatic **heading hierarchy**, **bullet points**, and **paragraph breaks**
- Choose your preferred GPT model (gpt-4o-mini, gpt-4o, etc.)
- **Custom prompts** for specialized formatting needs

Perfect for:
- Meeting notes → structured summaries
- Voice memos → actionable tasks
- Stream of consciousness → organized thoughts
- Interviews → formatted Q&A

## Installation

### Method 1: BRAT (Recommended)
1. Install the [BRAT plugin](https://github.com/TfTHacker/obsidian42-brat)
2. Open BRAT settings
3. Click "Add Beta plugin"
4. Enter: `DenizOkcu/voice-md`
5. Enable Voice MD in Settings → Community plugins

### Method 2: Manual Installation
1. Download the latest release from [GitHub Releases](https://github.com/DenizOkcu/voice-md/releases)
2. Extract `main.js`, `manifest.json`, and `styles.css` (if present)
3. Copy to `<your-vault>/.obsidian/plugins/voice-md/`
4. Restart Obsidian
5. Enable Voice MD in Settings → Community plugins

## Configuration

Access settings via Settings → Voice MD:

### Required Settings
- **OpenAI API Key**: Your API key from OpenAI (required for transcription)

### Optional Settings
- **Max Recording Duration**: Set a limit in seconds (default: 300s / 5 minutes)
- **Language**: Force a specific language code (`en`, `es`, `fr`, etc.) or leave blank for auto-detection
- **Enable Post-Processing**: Toggle GPT-powered markdown formatting
- **Chat Model**: Choose the GPT model for formatting (gpt-4o-mini is faster and cheaper)
- **Custom Formatting Prompt**: Override the default structuring instructions

## Usage

### Basic Workflow
1. Open any note in Obsidian
2. Place your cursor where you want the transcription
3. Click the microphone icon or run "Start Voice Recording"
4. Speak naturally
5. Click the microphone again to stop
6. Wait a moment for transcription
7. Your text appears at the cursor position

### With Post-Processing
When post-processing is enabled:
1. Follow the basic workflow above
2. Two files are created:
   - `YYYY-MM-DD-HHmmss-raw.md` - Original transcription
   - `YYYY-MM-DD-HHmmss-structured.md` - Formatted version
3. Both files open automatically for review

### Tips for Best Results
- **Speak clearly** and at a moderate pace
- **Pause briefly** between major points for better sentence detection
- Use **natural language** - no need to say "period" or "comma"
- For post-processing: **mention structure** (e.g., "first point", "next section") to help GPT understand your intent
- **Review and edit** - AI transcription is powerful but not perfect

## Pricing

Voice MD uses OpenAI's APIs, which incur costs based on usage:

- **Whisper API**: ~$0.006 per minute of audio
- **GPT Post-Processing** (optional):
  - gpt-4o-mini: ~$0.0001-0.0003 per transcription
  - gpt-4o: ~$0.002-0.005 per transcription

Example: A 5-minute recording with post-processing typically costs less than $0.04.

[Check current OpenAI pricing](https://openai.com/api/pricing/)

## Privacy & Security

**Privacy-first design:** Voice MD is built with your privacy as a top priority.

### What Gets Sent
- **Audio for transcription** → OpenAI Whisper API (only when you record)
- **Transcribed text for formatting** → OpenAI GPT API (only if post-processing is enabled)

That's it. No other data leaves your device.

### What Stays Local
- **Your API key** - Stored only in Obsidian's local data folder
- **Your notes** - Never uploaded or shared
- **Your settings** - Remain on your device
- **Your recordings** - Processed in-memory, not saved unless you choose to

### What We Don't Do
- ❌ **No tracking** - Zero usage analytics or telemetry
- ❌ **No third-party services** - Just you, Obsidian, and OpenAI
- ❌ **No data collection** - We don't see or store anything
- ❌ **No accounts** - No sign-ups, no databases, no profiles
- ❌ **No remote servers** - Beyond OpenAI's API for transcription

**In short:** You control your data. Audio is sent to OpenAI only for transcription/formatting, then discarded. Everything else stays on your machine. See [OpenAI's Privacy Policy](https://openai.com/policies/privacy-policy) for how they handle API requests.

## Troubleshooting

### "No API key configured"
Go to Settings → Voice MD and add your OpenAI API key.

### Recording doesn't start
Check that your browser/system has granted microphone permissions to Obsidian.

### Transcription fails
- Verify your API key is correct and active
- Check your OpenAI account has available credits
- Ensure you have a stable internet connection

### Post-processing not working
- Confirm post-processing is enabled in settings
- Verify your API key has access to the selected GPT model
- Check the Obsidian console (Cmd/Ctrl+Shift+I) for error messages

## Roadmap

Planned features:
- Local transcription options (Whisper.cpp integration)
- Custom keyboard shortcuts
- Audio file import and transcription
- Speaker diarization support
- Template support for structured outputs

Have ideas? [Open an issue](https://github.com/DenizOkcu/voice-md/issues) or contribute!

## Support

- **Issues & Bugs**: [GitHub Issues](https://github.com/DenizOkcu/voice-md/issues)
- **Discussions**: [GitHub Discussions](https://github.com/DenizOkcu/voice-md/discussions)
- **Support Development**: [GitHub Sponsors](https://github.com/sponsors/DenizOkcu)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

Built with:
- [OpenAI Whisper API](https://openai.com/research/whisper) - Speech recognition
- [OpenAI GPT](https://openai.com/gpt-4) - Intelligent formatting
- [Obsidian API](https://docs.obsidian.md) - Plugin framework

---

**Enjoy effortless note-taking!** If Voice MD saves you time, consider [sponsoring the project](https://github.com/sponsors/DenizOkcu).
