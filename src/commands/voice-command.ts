import { App, Editor, Notice, moment } from 'obsidian';
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
		let notice = new Notice('Transcribing audio...', 0); // 0 = don't auto-dismiss

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

			// Check if transcription is empty
			if (!result.text || result.text.trim() === '') {
				notice.hide();
				new Notice('Transcription was empty', 3000);
				return;
			}

			// Check if post-processing is enabled
			if (this.settings.enablePostProcessing) {
				// Update notice to show structuring
				notice.hide();
				notice = new Notice('Structuring text...', 0);

				try {
					// Structure the text using chat completions
					const structuredText = await client.structureText(
						result.text,
						this.settings.chatModel,
						this.settings.postProcessingPrompt
					);

					// Hide processing notice
					notice.hide();

					// Create both raw and structured files
					await this.createTranscriptionFiles(
						result.text,
						structuredText
					);

					// Insert structured text at cursor position (backward compatibility)
					editor.replaceSelection(structuredText);

					// Show success notice with file links
					new Notice(
						`✓ Transcription complete! Files saved to Voice Transcriptions/`,
						5000
					);

				} catch (postProcessingError) {
					// Post-processing failed, fallback to raw-only mode
					notice.hide();

					// Insert raw text at cursor
					editor.replaceSelection(result.text);

					// Handle error (will show user-friendly message)
					ErrorHandler.handle(postProcessingError);
				}
			} else {
				// Post-processing disabled, use current behavior
				notice.hide();

				// Insert transcribed text at cursor position
				editor.replaceSelection(result.text);

				// Show success notice
				new Notice('✓ Transcription complete!', 3000);
			}

		} catch (error) {
			// Hide processing notice
			notice.hide();

			// Handle error with user-friendly message
			ErrorHandler.handle(error);
		}
	}

	/**
	 * Create both raw and structured transcription files with cross-links
	 * @param rawText The raw transcription text
	 * @param structuredText The structured markdown text
	 * @returns Object containing paths to both created files
	 */
	private async createTranscriptionFiles(
		rawText: string,
		structuredText: string
	): Promise<{ rawPath: string; structuredPath: string }> {
		// Generate timestamp for file naming
		const timestamp = moment().format('YYYY-MM-DD-HHmmss');

		// Define folder path
		const folderPath = 'Voice Transcriptions';

		// Check if folder exists, create if not
		const folderExists = this.app.vault.getAbstractFileByPath(folderPath);
		if (!folderExists) {
			await this.app.vault.createFolder(folderPath);
		}

		// Define file paths
		const rawPath = `${folderPath}/transcription-${timestamp}-raw.md`;
		const structuredPath = `${folderPath}/transcription-${timestamp}.md`;

		// Create raw file
		await this.app.vault.create(rawPath, rawText);

		// Create structured file with cross-link to raw
		const structuredContent = `> Raw transcription: [[transcription-${timestamp}-raw]]\n\n${structuredText}`;
		await this.app.vault.create(structuredPath, structuredContent);

		return { rawPath, structuredPath };
	}
}
