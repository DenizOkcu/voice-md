/**
 * Shared TypeScript interfaces and types for Voice MD plugin
 */

export interface VoiceMDSettings {
	openaiApiKey: string;
	chatModel: string;
	enablePostProcessing: boolean;
	postProcessingPrompt?: string;
	language?: string;
	maxRecordingDuration: number;
	autoStartRecording: boolean;
}

export interface RecordingState {
	isRecording: boolean;
	isPaused: boolean;
	duration: number; // In seconds
	audioBlob: Blob | null;
}

export interface TranscriptionOptions {
	language?: string;
	prompt?: string; // Context for better accuracy
}

export interface TranscriptionResult {
	text: string;
	language?: string;
	duration?: number;
	segments?: Array<{
		text: string;
		start: number;
		end: number;
		speaker?: string;
	}>;
}

/**
 * Extended OpenAI Transcription Response
 * OpenAI's API returns additional fields beyond the base Transcription type
 */
export interface ExtendedTranscriptionResponse {
	text: string;
	language?: string;
	duration?: number;
	segments?: Array<{
		text: string;
		start: number;
		end: number;
		speaker?: string;
	}>;
}

export type VoiceMDError =
	| { type: 'NO_MICROPHONE'; message: string }
	| { type: 'PERMISSION_DENIED'; message: string }
	| { type: 'API_ERROR'; code: string; message: string }
	| { type: 'NETWORK_ERROR'; message: string }
	| { type: 'INVALID_API_KEY'; message: string }
	| { type: 'POST_PROCESSING_ERROR'; message: string };
