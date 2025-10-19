import { App, Modal } from 'obsidian';
import { AudioRecorder } from './recorder';

/**
 * RecordingModal provides UI for audio recording with visual feedback
 */
export class RecordingModal extends Modal {
	private recorder: AudioRecorder;
	private statusEl: HTMLElement;
	private timerEl: HTMLElement;
	private controlsEl: HTMLElement;
	private startBtn: HTMLButtonElement;
	private stopBtn: HTMLButtonElement;
	private cancelBtn: HTMLButtonElement;
	private timerInterval: number | null = null;
	private meetingModeEnabled: boolean = false;
	private onRecordingComplete: (blob: Blob, enableMeetingMode: boolean) => void;
	private maxDuration: number;
	private autoStart: boolean;

	constructor(
		app: App,
		maxDuration: number,
		onRecordingComplete: (blob: Blob, enableMeetingMode: boolean) => void,
		autoStart: boolean
	) {
		super(app);
		this.recorder = new AudioRecorder();
		this.onRecordingComplete = onRecordingComplete;
		this.maxDuration = maxDuration;
		this.autoStart = autoStart;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.addClass('voice-md-recording-modal');
		contentEl.empty();

		// Title
		contentEl.createEl('h2', { text: 'Voice Recording' });

		// Status indicator
		this.statusEl = contentEl.createDiv({ cls: 'voice-md-status' });
		this.statusEl.setText('Ready to record');

		// Timer display
		this.timerEl = contentEl.createDiv({ cls: 'voice-md-timer' });
		this.timerEl.setText('00:00');

		// Meeting mode checkbox
		const checkboxContainer = contentEl.createDiv({ cls: 'voice-md-meeting-mode' });
		const label = checkboxContainer.createEl('label');
		const checkbox = label.createEl('input', { type: 'checkbox' });
		checkbox.checked = false; // Default: unchecked
		label.appendText(' Enable Meeting Mode (Speaker Identification)');

		// Wire change handler
		checkbox.addEventListener('change', () => {
			this.meetingModeEnabled = checkbox.checked;
		});

		// Max duration info
		const maxDurationText = this.formatTime(this.maxDuration);
		contentEl.createDiv({
			cls: 'voice-md-info',
			text: `Max duration: ${maxDurationText}`
		});

		// Controls
		this.controlsEl = contentEl.createDiv({ cls: 'voice-md-controls' });

		this.startBtn = this.controlsEl.createEl('button', {
			cls: 'mod-cta',
			text: 'Start Recording'
		});
		this.startBtn.addEventListener('click', () => this.startRecording());

		this.stopBtn = this.controlsEl.createEl('button', {
			cls: 'mod-warning',
			text: 'Stop Recording'
		});
		this.stopBtn.style.display = 'none';
		this.stopBtn.addEventListener('click', () => this.stopRecording());

		this.cancelBtn = this.controlsEl.createEl('button', {
			text: 'Cancel'
		});
		this.cancelBtn.addEventListener('click', () => this.close());

		// Auto-start recording if enabled
		if (this.autoStart) {
			this.startRecording();
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();

		// Clear timer
		if (this.timerInterval !== null) {
			window.clearInterval(this.timerInterval);
			this.timerInterval = null;
		}

		// Cleanup recorder
		this.recorder.cleanup();
	}

	private async startRecording() {
		try {
			await this.recorder.start();

			// Update UI
			this.statusEl.setText('Recording...');
			this.statusEl.addClass('recording');
			this.startBtn.style.display = 'none';
			this.stopBtn.style.display = 'inline-block';
			this.cancelBtn.disabled = true;

			// Start timer
			this.startTimer();

		} catch (error) {
			if (error instanceof Error) {
				if (error.message === 'PERMISSION_DENIED') {
					this.statusEl.setText('❌ Microphone access denied');
				} else if (error.message === 'NO_MICROPHONE') {
					this.statusEl.setText('❌ No microphone found');
				} else {
					this.statusEl.setText('❌ Failed to start recording');
				}
			}
			console.error('Failed to start recording:', error);
		}
	}

	private async stopRecording() {
		try {
			this.statusEl.setText('Processing...');
			this.statusEl.removeClass('recording');
			this.stopBtn.disabled = true;

			// Stop recording and get blob
			const blob = await this.recorder.stop();

			// Clear timer
			if (this.timerInterval !== null) {
				window.clearInterval(this.timerInterval);
				this.timerInterval = null;
			}

			// Call completion handler
			this.onRecordingComplete(blob, this.meetingModeEnabled);

			// Close modal
			this.close();

		} catch (error) {
			console.error('Failed to stop recording:', error);
			this.statusEl.setText('❌ Failed to stop recording');
			this.stopBtn.disabled = false;
		}
	}

	private startTimer() {
		let startTime = Date.now();

		this.timerInterval = window.setInterval(() => {
			const elapsed = Math.floor((Date.now() - startTime) / 1000);
			this.timerEl.setText(this.formatTime(elapsed));

			// Auto-stop if max duration reached
			if (elapsed >= this.maxDuration) {
				this.stopRecording();
			}
		}, 1000);
	}

	private formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
	}
}
