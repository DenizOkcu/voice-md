import { Notice } from 'obsidian';
import { VoiceMDError, VoiceMDErrorType } from '../types';

/**
 * ErrorHandler provides centralized error handling and user-friendly messages
 */
export class ErrorHandler {
	/**
	 * Handle an error and display an appropriate Notice to the user
	 */
	static handle(error: unknown): void {
		console.error('Voice MD Error:', error);

		let message = 'An unknown error occurred';

		if (error instanceof VoiceMDError) {
			message = this.getErrorMessage(error);
		} else if (error instanceof Error) {
			// Handle standard Error objects
			if (error.message === 'PERMISSION_DENIED') {
				message = 'Microphone access denied. Please grant permission in your browser settings.';
			} else if (error.message === 'NO_MICROPHONE') {
				message = 'No microphone found. Please connect a microphone and try again.';
			} else {
				message = error.message;
			}
		}

		new Notice(message, 6000);
	}

	/**
	 * Get a user-friendly error message for VoiceMDError types
	 */
	private static getErrorMessage(error: VoiceMDError): string {
		switch (error.errorType) {
			case 'NO_MICROPHONE':
				return 'No microphone found. Please connect a microphone and try again.';

			case 'PERMISSION_DENIED':
				return 'Microphone access denied. Please grant permission in your browser settings.';

			case 'INVALID_API_KEY':
				return 'Invalid OpenAI API key. Please check your settings and try again.';

			case 'API_ERROR':
				return `OpenAI API error (${error.code}): ${error.message}`;

			case 'NETWORK_ERROR':
				return `Network error: ${error.message}. Please check your internet connection.`;

			case 'POST_PROCESSING_ERROR':
				return `Post-processing failed: ${error.message}. Saved raw transcription only.`;

			default:
				return 'An unknown error occurred';
		}
	}

	/**
	 * Type guard to check if error has expected API error shape
	 */
	private static isApiError(error: unknown): error is { status?: number; code?: string; message?: string } {
		return typeof error === 'object' && error !== null;
	}

	/**
	 * Create a VoiceMDError from an OpenAI API error
	 * @param error The error from OpenAI SDK
	 * @param isPostProcessing Whether this error is from post-processing (chat) vs transcription
	 */
	static fromOpenAIError(error: unknown, isPostProcessing = false): VoiceMDError {
		let errorInfo: VoiceMDErrorType;

		// Type guard check
		if (!this.isApiError(error)) {
			errorInfo = {
				type: isPostProcessing ? 'POST_PROCESSING_ERROR' : 'API_ERROR',
				code: 'UNKNOWN',
				message: String(error)
			};
			return new VoiceMDError(errorInfo);
		}

		if (error.status === 401 || error.status === 403) {
			errorInfo = {
				type: 'INVALID_API_KEY',
				message: 'Invalid or missing API key'
			};
		} else if (error.status === 429) {
			if (isPostProcessing) {
				errorInfo = {
					type: 'POST_PROCESSING_ERROR',
					message: 'Rate limit exceeded. Please wait a moment and try again.'
				};
			} else {
				errorInfo = {
					type: 'API_ERROR',
					code: '429',
					message: 'Rate limit exceeded. Please wait a moment and try again.'
				};
			}
		} else if (error.status === 404 && isPostProcessing) {
			errorInfo = {
				type: 'POST_PROCESSING_ERROR',
				message: 'Invalid chat model. Please check your settings.'
			};
		} else if (error.status !== undefined && error.status >= 500) {
			if (isPostProcessing) {
				errorInfo = {
					type: 'POST_PROCESSING_ERROR',
					message: 'OpenAI service is temporarily unavailable. Please try again later.'
				};
			} else {
				errorInfo = {
					type: 'API_ERROR',
					code: String(error.status),
					message: 'OpenAI service is temporarily unavailable. Please try again later.'
				};
			}
		} else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
			errorInfo = {
				type: 'NETWORK_ERROR',
				message: 'Unable to reach OpenAI servers. Please check your internet connection.'
			};
		} else if (isPostProcessing) {
			errorInfo = {
				type: 'POST_PROCESSING_ERROR',
				message: error.message || 'An error occurred while structuring text'
			};
		} else {
			errorInfo = {
				type: 'API_ERROR',
				code: error.status ? String(error.status) : 'UNKNOWN',
				message: error.message || 'An error occurred while transcribing audio'
			};
		}

		return new VoiceMDError(errorInfo);
	}
}
