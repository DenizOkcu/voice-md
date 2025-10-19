# Voice MD

Voice-to-text transcription for Obsidian powered by OpenAI's GPT-4o audio models. Record audio, transcribe with automatic speaker identification, and optionally structure output with GPT formatting—all inline.

[![GitHub release](https://img.shields.io/github/v/release/DenizOkcu/voice-md?style=flat-square)](https://github.com/DenizOkcu/voice-md/releases)

---

## Quick Start

1. **Install** via Obsidian Community Plugins: Search "Voice MD"
2. **Configure** OpenAI API key in Settings → Voice MD ([Get API key](https://platform.openai.com/api-keys))
3. **Record** via ribbon icon or command palette (`Start Voice Recording`)

Text appears at cursor position. Optional meeting mode for speaker identification, post-processing for structured markdown.

---

## Features

### Core
- **OpenAI transcription** - `gpt-4o-mini-transcribe` (standard) / `gpt-4o-transcribe-diarize` (meeting mode)
- **Inline insertion** - Text inserted at cursor position in active note
- **Auto-language detection** - Or force specific language codes (`en`, `es`, `fr`, etc.)
- **Mobile support** - iOS and Android compatible (WebM/MP4/OGG/WAV)

### Meeting Mode
Automatic speaker identification for multi-speaker recordings:

```markdown
**Speaker A:** Welcome to today's meeting.
**Speaker B:** Thanks for having me. I've completed phase one.
**Speaker A:** Great. What were the main challenges?
```

- Toggle per-recording via checkbox in modal
- Uses `gpt-4o-transcribe-diarize` model
- Best with 2-6 speakers, recordings >30 seconds
- 10-30% additional response time

### Post-Processing (Optional)
GPT-powered markdown formatting creates dual files:
- `transcription-YYYY-MM-DD-HHmmss-raw.md` - Original transcription
- `transcription-YYYY-MM-DD-HHmmss.md` - Formatted with heading hierarchy, lists, paragraphs

Features:
- Configurable model (`gpt-4o-mini`, `gpt-4o`)
- Custom system prompts for domain-specific formatting
- Preserves speaker labels from meeting mode
- Cross-linked files in `Voice Transcriptions/` folder

---

## Configuration

**Settings → Voice MD**

| Setting | Description | Default |
|---------|-------------|---------|
| **OpenAI API Key** | Required. Get from [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | - |
| **Max Recording Duration** | Maximum seconds per recording | 300 |
| **Auto-Start Recording** | Start recording immediately on modal open | false |
| **Language** | Force language code (`en`, `es`, `fr`) or blank for auto-detect | Auto |
| **Enable Post-Processing** | GPT-powered markdown formatting | false |
| **Chat Model** | GPT model for post-processing | `gpt-4o-mini` |
| **Custom Formatting Prompt** | Override default formatting instructions | - |

**Note:** Meeting Mode is enabled per-recording via checkbox in modal, not global settings.

---

## Usage

### Standard Workflow
1. Position cursor in note
2. Click microphone icon or run `Start Voice Recording` command
3. Speak naturally
4. Click stop
5. Text inserted at cursor

### Meeting Mode
1. Open recording modal
2. Enable "Meeting Mode" checkbox
3. Record conversation
4. Speaker labels automatically added (`**Speaker A:**`, `**Speaker B:**`, etc.)

### Post-Processing Output
When enabled, creates two files in `Voice Transcriptions/`:
- Raw transcription (timestamped, `-raw.md` suffix)
- Formatted version with structure (headings, lists, paragraphs)
- Formatted file includes link to raw: `> Raw transcription: [[...]]`
- Formatted text inserted at cursor

---

## Best Practices

**Audio Quality**
- Speak clearly at moderate pace
- Minimize background noise for multi-speaker recordings
- Pause between major points for better segmentation

**Meeting Mode**
- Optimal: 2-6 speakers
- Minimum: 30 seconds for accurate identification
- Clear distinct voices improve accuracy

**Post-Processing**
- Verbally mention structure ("first point", "next section")
- Use custom prompts for specialized domains
- Review both raw and formatted versions

---

## Installation

### Community Plugin (Recommended)
1. Open Obsidian Settings → Community plugins
2. Browse and search "Voice MD"
3. Install and enable

### Manual Installation
1. Download latest release from [GitHub Releases](https://github.com/DenizOkcu/voice-md/releases)
2. Extract `main.js`, `manifest.json`, `styles.css` to `<vault>/.obsidian/plugins/voice-md/`
3. Restart Obsidian
4. Enable in Settings → Community plugins

### Beta Testing (BRAT)
For pre-release versions:
1. Install [BRAT plugin](https://github.com/TfTHacker/obsidian42-brat)
2. BRAT settings → Add Beta plugin → `DenizOkcu/voice-md`

---

## Pricing

Requires OpenAI API key (pay-per-use):
- **Transcription**: `gpt-4o-mini-transcribe` / `gpt-4o-transcribe-diarize`
- **Post-Processing**: Configurable GPT model (`gpt-4o-mini`, `gpt-4o`)

[View OpenAI API pricing →](https://openai.com/api/pricing/)

---

## Privacy & Security

**Data Flow:**
- Audio → OpenAI API (transcription only, ephemeral)
- Text → OpenAI API (post-processing only, if enabled)
- API key → Local Obsidian storage
- Recordings → In-memory processing (never written to disk)

**No telemetry, tracking, or third-party services.** See [OpenAI Privacy Policy](https://openai.com/policies/privacy-policy) for API data handling.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **"No API key configured"** | Add OpenAI API key in Settings → Voice MD ([Get key](https://platform.openai.com/api-keys)) |
| **Recording doesn't start** | Check microphone permissions:<br>• macOS: System Settings → Privacy → Microphone<br>• Windows: Settings → Privacy → Microphone |
| **Transcription fails** | • Verify API key validity<br>• Check OpenAI account credits<br>• Confirm internet connection<br>• Check console logs (Cmd/Ctrl+Shift+I) |
| **Meeting mode no speakers** | • Recording >30 seconds<br>• Improve audio quality<br>• Verify meeting mode checkbox enabled |
| **Post-processing fails** | • Confirm enabled in settings<br>• Verify API key model access<br>• Check OpenAI credits<br>• Review console errors |

---

## Contributing

[Issues](https://github.com/DenizOkcu/voice-md/issues) • [Discussions](https://github.com/DenizOkcu/voice-md/discussions) • [Sponsor](https://github.com/sponsors/DenizOkcu)

MIT License - see [LICENSE](LICENSE)
