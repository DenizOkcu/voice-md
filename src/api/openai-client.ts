import OpenAI from 'openai';
import { TranscriptionOptions, TranscriptionResult } from '../types';
import { ErrorHandler } from '../utils/error-handler';

/**
 * OpenAIClient handles communication with the OpenAI Whisper API
 */
export class OpenAIClient {
	private client: OpenAI;
	private model: string;

	constructor(apiKey: string, model: string = 'whisper-1') {
		this.client = new OpenAI({
			apiKey: apiKey,
			dangerouslyAllowBrowser: true // Required for browser usage in Obsidian
		});
		this.model = model;
	}

	/**
	 * Transcribe an audio blob using OpenAI Whisper API
	 * @param audioBlob The recorded audio blob
	 * @param options Optional transcription parameters
	 * @returns Transcription result with text and metadata
	 */
	async transcribe(
		audioBlob: Blob,
		options?: TranscriptionOptions
	): Promise<TranscriptionResult> {
		try {
			// Convert Blob to File (required by OpenAI SDK)
			const audioFile = new File([audioBlob], 'recording.webm', {
				type: audioBlob.type
			});

			// Call Whisper API
			const response = await this.client.audio.transcriptions.create({
				file: audioFile,
				model: this.model,
				language: options?.language,
				prompt: options?.prompt,
				response_format: 'verbose_json' // Get additional metadata
			});

			// Parse response
			return {
				text: response.text,
				language: (response as any).language,
				duration: (response as any).duration
			};

		} catch (error) {
			// Convert to VoiceMDError and throw
			throw ErrorHandler.fromOpenAIError(error);
		}
	}

	/**
	 * Test the API key by making a minimal request
	 * @returns true if the API key is valid
	 */
	async testConnection(): Promise<boolean> {
		try {
			// Create a minimal audio file (1 second of silence)
			const sampleBlob = this.createSilentAudioBlob();
			await this.transcribe(sampleBlob);
			return true;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Create a minimal silent audio blob for testing
	 */
	private createSilentAudioBlob(): Blob {
		// Create a minimal WAV file (1 second of silence)
		const sampleRate = 44100;
		const numChannels = 1;
		const bitsPerSample = 16;
		const duration = 1; // 1 second

		const numSamples = sampleRate * duration;
		const dataSize = numSamples * numChannels * (bitsPerSample / 8);
		const buffer = new ArrayBuffer(44 + dataSize);
		const view = new DataView(buffer);

		// Write WAV header
		const writeString = (offset: number, string: string) => {
			for (let i = 0; i < string.length; i++) {
				view.setUint8(offset + i, string.charCodeAt(i));
			}
		};

		writeString(0, 'RIFF');
		view.setUint32(4, 36 + dataSize, true);
		writeString(8, 'WAVE');
		writeString(12, 'fmt ');
		view.setUint32(16, 16, true); // Subchunk1Size
		view.setUint16(20, 1, true); // AudioFormat (PCM)
		view.setUint16(22, numChannels, true);
		view.setUint32(24, sampleRate, true);
		view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
		view.setUint16(32, numChannels * (bitsPerSample / 8), true);
		view.setUint16(34, bitsPerSample, true);
		writeString(36, 'data');
		view.setUint32(40, dataSize, true);

		// Data is already zeros (silence)

		return new Blob([buffer], { type: 'audio/wav' });
	}
}
