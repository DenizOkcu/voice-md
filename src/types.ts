/**
 * Shared TypeScript interfaces and types for Voice MD plugin
 */

export interface VoiceMDSettings {
	openaiApiKey: string;
	whisperModel: 'whisper-1';
	language?: string;
	maxRecordingDuration: number;
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
}

export type VoiceMDError =
	| { type: 'NO_MICROPHONE'; message: string }
	| { type: 'PERMISSION_DENIED'; message: string }
	| { type: 'API_ERROR'; code: string; message: string }
	| { type: 'NETWORK_ERROR'; message: string }
	| { type: 'INVALID_API_KEY'; message: string };
