import { Notice } from 'obsidian';
import { VoiceMDError } from '../types';

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

		if (this.isVoiceMDError(error)) {
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
		switch (error.type) {
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

			default:
				return 'An unknown error occurred';
		}
	}

	/**
	 * Type guard to check if an error is a VoiceMDError
	 */
	private static isVoiceMDError(error: unknown): error is VoiceMDError {
		return (
			typeof error === 'object' &&
			error !== null &&
			'type' in error &&
			'message' in error
		);
	}

	/**
	 * Create a VoiceMDError from an OpenAI API error
	 */
	static fromOpenAIError(error: any): VoiceMDError {
		if (error?.status === 401 || error?.status === 403) {
			return {
				type: 'INVALID_API_KEY',
				message: 'Invalid or missing API key'
			};
		}

		if (error?.status === 429) {
			return {
				type: 'API_ERROR',
				code: '429',
				message: 'Rate limit exceeded. Please wait a moment and try again.'
			};
		}

		if (error?.status >= 500) {
			return {
				type: 'API_ERROR',
				code: String(error.status),
				message: 'OpenAI service is temporarily unavailable. Please try again later.'
			};
		}

		if (error?.code === 'ENOTFOUND' || error?.code === 'ETIMEDOUT') {
			return {
				type: 'NETWORK_ERROR',
				message: 'Unable to reach OpenAI servers. Please check your internet connection.'
			};
		}

		return {
			type: 'API_ERROR',
			code: error?.status ? String(error.status) : 'UNKNOWN',
			message: error?.message || 'An error occurred while transcribing audio'
		};
	}
}
