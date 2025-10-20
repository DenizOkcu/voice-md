import OpenAI from 'openai';
import { TranscriptionOptions, TranscriptionResult, ExtendedTranscriptionResponse } from '../types';
import { ErrorHandler } from '../utils/error-handler';

/**
 * OpenAIClient handles communication with the OpenAI Audio Transcription API
 */
export class OpenAIClient {
	private client: OpenAI;

	constructor(apiKey: string) {
		this.client = new OpenAI({
			apiKey: apiKey,
			dangerouslyAllowBrowser: true // Required for browser usage in Obsidian
		});
	}

	/**
	 * Transcribe an audio blob using OpenAI Audio Transcription API
	 * @param audioBlob The recorded audio blob
	 * @param options Optional transcription parameters
	 * @param enableMeetingMode Enable speaker diarization (uses gpt-4o-transcribe-diarize)
	 * @returns Transcription result with text and metadata
	 */
	async transcribe(
		audioBlob: Blob,
		options?: TranscriptionOptions,
		enableMeetingMode?: boolean
	): Promise<TranscriptionResult> {
		try {
			// Convert Blob to File (required by OpenAI SDK)
			const audioFile = new File([audioBlob], 'recording.webm', {
				type: audioBlob.type
			});

			// Determine model based on meeting mode
			// gpt-4o-transcribe-diarize: Supports speaker diarization
			// gpt-4o-mini-transcribe: Fast, cost-effective standard transcription
			const model = enableMeetingMode ? 'gpt-4o-transcribe-diarize' : 'gpt-4o-mini-transcribe';
			const responseFormat = enableMeetingMode ? 'diarized_json' : 'json';

			// Build transcription parameters
			// Note: Using a flexible object type because OpenAI SDK's type doesn't include
			// all parameters like timestamp_granularities for diarization
			const transcriptionParams: OpenAI.Audio.Transcriptions.TranscriptionCreateParams & {
				timestamp_granularities?: string[];
			} = {
				file: audioFile,
				model: model,
				language: options?.language,
				prompt: options?.prompt,
				response_format: responseFormat,
			};

			// Add timestamp granularities for segment-level data (required for diarization)
			if (enableMeetingMode) {
				transcriptionParams.timestamp_granularities = ['segment'];
			}

			const response = await this.client.audio.transcriptions.create(transcriptionParams);

			// Parse response - OpenAI API returns additional fields beyond the base type
			// Cast to our extended interface that includes language, duration, and segments
			const extendedResponse = response as unknown as ExtendedTranscriptionResponse;

			return {
				text: extendedResponse.text,
				language: extendedResponse.language,
				duration: extendedResponse.duration,
				segments: enableMeetingMode ? extendedResponse.segments : undefined
			};

		} catch (error) {
			// Convert to VoiceMDError and throw
			throw ErrorHandler.fromOpenAIError(error);
		}
	}

	/**
	 * Structure raw text into formatted markdown using OpenAI chat completions
	 * @param rawText The raw transcription text to structure
	 * @param model The GPT model to use (e.g., 'gpt-4o-mini', 'gpt-4o')
	 * @param customPrompt Optional custom system prompt to override default
	 * @returns Formatted markdown text
	 */
	async structureText(
		rawText: string,
		model: string,
		customPrompt?: string
	): Promise<string> {
		try {
			const systemPrompt = customPrompt ||
				"You are a helpful assistant that formats voice transcriptions into well-structured markdown. " +
				"Use appropriate headings (##, ###), bullet points, numbered lists, and paragraphs. " +
				"IMPORTANT: If the text contains speaker labels (e.g., **Speaker 1:**), preserve them exactly. " +
				"Preserve all content from the original transcription while improving readability.";

			const completion = await this.client.chat.completions.create({
				model: model,
				messages: [
					{
						role: "system",
						content: systemPrompt
					},
					{
						role: "user",
						content: `Format the following transcription as clear markdown:\n\n${rawText}`
					}
				],
				temperature: 0.3,
				max_tokens: 4096
			});

			return completion.choices[0].message.content || rawText;

		} catch (error) {
			// Convert to VoiceMDError and throw
			throw ErrorHandler.fromOpenAIError(error, true);
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
		} catch (_error) {
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
