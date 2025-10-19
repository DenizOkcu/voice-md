import { RecordingState } from '../types';

/**
 * AudioRecorder handles microphone access and audio recording using the MediaRecorder API
 */
export class AudioRecorder {
	private mediaRecorder: MediaRecorder | null = null;
	private audioChunks: Blob[] = [];
	private stream: MediaStream | null = null;
	private startTime: number = 0;
	private state: RecordingState;

	constructor() {
		this.state = {
			isRecording: false,
			isPaused: false,
			duration: 0,
			audioBlob: null
		};
	}

	/**
	 * Initialize microphone access and start recording
	 * @throws Error if microphone access is denied or not available
	 */
	async start(): Promise<void> {
		if (this.state.isRecording) {
			throw new Error('Recording is already in progress');
		}

		try {
			// Request microphone access
			this.stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					sampleRate: 44100
				}
			});

			// Create MediaRecorder
			this.mediaRecorder = new MediaRecorder(this.stream, {
				mimeType: this.getSupportedMimeType()
			});

			// Setup event handlers
			this.mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					this.audioChunks.push(event.data);
				}
			};

			this.mediaRecorder.onstop = () => {
				// Create final audio blob
				const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
				this.state.audioBlob = new Blob(this.audioChunks, { type: mimeType });
				this.state.isRecording = false;
			};

			this.mediaRecorder.onerror = (event: Event) => {
				console.error('MediaRecorder error:', event);
				this.cleanup();
			};

			// Start recording
			this.audioChunks = [];
			this.startTime = Date.now();
			this.mediaRecorder.start(100); // Collect data every 100ms
			this.state.isRecording = true;
			this.state.isPaused = false;
			this.state.audioBlob = null;

		} catch (error) {
			this.cleanup();

			if (error instanceof DOMException) {
				if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
					throw new Error('PERMISSION_DENIED');
				} else if (error.name === 'NotFoundError') {
					throw new Error('NO_MICROPHONE');
				}
			}

			throw error;
		}
	}

	/**
	 * Stop recording and return the audio blob
	 * @returns Promise that resolves to the recorded audio blob
	 */
	async stop(): Promise<Blob> {
		if (!this.mediaRecorder || !this.state.isRecording) {
			throw new Error('No recording in progress');
		}

		return new Promise((resolve, reject) => {
			if (!this.mediaRecorder) {
				reject(new Error('MediaRecorder not initialized'));
				return;
			}

			// Set up a one-time handler for when recording stops
			const originalOnStop = this.mediaRecorder.onstop;
			this.mediaRecorder.onstop = (ev: Event) => {
				if (originalOnStop) originalOnStop.call(this.mediaRecorder, ev);

				if (this.state.audioBlob) {
					resolve(this.state.audioBlob);
				} else {
					reject(new Error('Failed to create audio blob'));
				}

				this.cleanup();
			};

			// Stop the recording
			this.mediaRecorder.stop();
		});
	}

	/**
	 * Get the current recording state
	 */
	getState(): RecordingState {
		// Update duration if recording
		if (this.state.isRecording && this.startTime > 0) {
			this.state.duration = Math.floor((Date.now() - this.startTime) / 1000);
		}
		return { ...this.state };
	}

	/**
	 * Clean up resources (stop tracks, clear references)
	 */
	cleanup(): void {
		if (this.stream) {
			this.stream.getTracks().forEach(track => track.stop());
			this.stream = null;
		}

		this.mediaRecorder = null;
		this.audioChunks = [];
		this.state.isRecording = false;
		this.state.isPaused = false;
	}

	/**
	 * Get the best supported MIME type for audio recording
	 * Prioritizes formats compatible with both desktop and mobile
	 * @returns A supported MIME type string
	 */
	private getSupportedMimeType(): string {
		const types = [
			'audio/webm;codecs=opus',  // Desktop Chrome/Firefox
			'audio/webm',               // Desktop fallback
			'audio/mp4',                // iOS Safari
			'audio/mp4;codecs=mp4a.40.2', // iOS Safari with codec
			'audio/ogg;codecs=opus',    // Firefox
			'audio/wav'                 // Universal fallback
		];

		for (const type of types) {
			if (MediaRecorder.isTypeSupported(type)) {
				return type;
			}
		}

		// Fallback to default (let browser choose)
		return '';
	}
}
