# Voice MD

Record your voice, get markdown. Powered by OpenAI's latest audio models — works on desktop and mobile.

Transcribe directly into your active note, or use meeting mode to identify speakers in conversations. Optionally run GPT post-processing to turn raw transcripts into structured notes with headings, lists, and paragraphs.

[![GitHub release](https://img.shields.io/github/v/release/DenizOkcu/voice-md?style=flat-square)](https://github.com/DenizOkcu/voice-md/releases)

## Quick start

1. Install from Obsidian Community Plugins (search "Voice MD")
2. Add your [OpenAI API key](https://platform.openai.com/api-keys) in Settings → Voice MD
3. Click the microphone icon in the ribbon or run "Start voice recording" from the command palette
4. Speak. Stop. Text appears at your cursor.

## Features

### Voice-to-markdown

Record audio and get a transcription inserted directly at your cursor position. Uses `gpt-4o-mini-transcribe` — fast, accurate, and supports automatic language detection. You can also force a specific language (`en`, `de`, `fr`, etc.) in settings.

### Meeting mode

Enable the "Meeting Mode" checkbox in the recording modal to identify speakers automatically. Uses `gpt-4o-transcribe-diarize` — best with 2–6 speakers and recordings over 30 seconds.

Output looks like this:

```markdown
**Speaker A:** Let's review the Q3 numbers.

**Speaker B:** Revenue was up 12%, mostly driven by the enterprise segment.

**Speaker A:** What about churn?
```

### Post-processing (smart formatting)

Enable the "Post-Processing" checkbox in the recording modal to run GPT formatting on your transcript. This creates two files in a `Voice Transcriptions/` folder:

- `transcription-2025-05-13-143022-raw.md` — verbatim transcript
- `transcription-2025-05-13-143022.md` — formatted version with headings, lists, and structure

The formatted file links back to the raw version so you never lose the original. You can configure the GPT model (`gpt-4o-mini`, `gpt-4o`, etc.) and write a custom formatting prompt for your use case.

Both checkboxes default to your global settings and persist changes back — so you can toggle per recording without losing your defaults.

### Mobile support

Works on iOS and Android. Audio format detection adapts to your platform (WebM on desktop, MP4 on iOS, OGG/WAV as fallback).

## Settings

**Settings → Voice MD**

| Setting | Description | Default |
|---------|-------------|---------|
| OpenAI API key | Required. [Get one here](https://platform.openai.com/api-keys) | — |
| Max recording duration | Maximum seconds per recording | 300 |
| Auto-start recording | Start recording immediately when the modal opens | Off |
| Language | Force a language code, or leave blank for auto-detect | Auto |
| Enable post-processing | Default for the post-processing checkbox | Off |
| Chat model | GPT model used for post-processing | `gpt-4o-mini` |
| Custom formatting prompt | Override the default formatting instructions | — |

## Installation

### Community plugins (recommended)

1. Settings → Community plugins → Browse
2. Search "Voice MD"
3. Install and enable

### Manual

1. Download the latest [GitHub release](https://github.com/DenizOkcu/voice-md/releases)
2. Copy `main.js`, `manifest.json`, and `styles.css` to `<vault>/.obsidian/plugins/voice-md/`
3. Enable in Settings → Community plugins

### Beta (BRAT)

1. Install the [BRAT plugin](https://github.com/TfTHacker/obsidian42-brat)
2. BRAT settings → Add Beta plugin → `DenizOkcu/voice-md`

## Privacy

- Audio is sent to OpenAI for transcription only — never stored on disk or written to your vault
- Post-processing sends the transcript text to OpenAI if enabled
- Your API key stays in local Obsidian storage
- No telemetry, no tracking, no third-party services

## Troubleshooting

| Problem | Fix |
|---------|-----|
| No API key error | Add your [OpenAI API key](https://platform.openai.com/api-keys) in settings |
| Recording won't start | Grant microphone permission to Obsidian in your OS settings |
| Transcription fails | Check that your API key is valid and your OpenAI account has credits |
| No speaker labels | Meeting mode works best with 2–6 speakers and recordings over 30 seconds |

For anything else, open an [issue](https://github.com/DenizOkcu/voice-md/issues).

## License

[MIT](LICENSE)
