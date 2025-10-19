import { App, Editor, Notice } from 'obsidian';
import { RecordingModal } from '../audio/audio-modal';
import { OpenAIClient } from '../api/openai-client';
import { ErrorHandler } from '../utils/error-handler';
import { VoiceMDSettings } from '../types';

/**
 * VoiceCommand orchestrates the voice recording workflow:
 * Recording → Transcription → Insertion into editor
 */
export class VoiceCommand {
	private app: App;
	private settings: VoiceMDSettings;

	constructor(app: App, settings: VoiceMDSettings) {
		this.app = app;
		this.settings = settings;
	}

	/**
	 * Execute the voice recording command
	 * @param editor The active editor instance
	 */
	async execute(editor: Editor): Promise<void> {
		// Pre-flight check: Verify API key exists
		if (!this.settings.openaiApiKey || this.settings.openaiApiKey.trim() === '') {
			new Notice(
				'OpenAI API key not configured. Please set it in Voice MD settings.',
				6000
			);
			return;
		}

		// Open recording modal
		const modal = new RecordingModal(
			this.app,
			this.settings.maxRecordingDuration,
			async (audioBlob) => {
				await this.handleRecording(audioBlob, editor);
			}
		);

		modal.open();
	}

	/**
	 * Handle the recorded audio blob: transcribe and insert into editor
	 */
	private async handleRecording(audioBlob: Blob, editor: Editor): Promise<void> {
		// Show processing notice
		const notice = new Notice('Transcribing audio...', 0); // 0 = don't auto-dismiss

		try {
			// Create OpenAI client
			const client = new OpenAIClient(
				this.settings.openaiApiKey,
				this.settings.whisperModel
			);

			// Transcribe audio
			const result = await client.transcribe(audioBlob, {
				language: this.settings.language
			});

			// Hide processing notice
			notice.hide();

			// Insert transcribed text at cursor position
			editor.replaceSelection(result.text);

			// Show success notice
			new Notice('✓ Transcription complete!', 3000);

		} catch (error) {
			// Hide processing notice
			notice.hide();

			// Handle error with user-friendly message
			ErrorHandler.handle(error);
		}
	}
}
