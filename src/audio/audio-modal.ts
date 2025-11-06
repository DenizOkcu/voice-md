import { App, Modal, Plugin } from 'obsidian';
import { AudioRecorder } from './recorder';
import { VoiceMDSettings } from '../types';

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
	private postProcessingEnabled: boolean = false;
	private onRecordingComplete: (blob: Blob, enableMeetingMode: boolean, enablePostProcessing: boolean) => void;
	private maxDuration: number;
	private autoStart: boolean;
	private plugin: Plugin;
	private settings: VoiceMDSettings;

	constructor(
		app: App,
		plugin: Plugin,
		settings: VoiceMDSettings,
		maxDuration: number,
		onRecordingComplete: (blob: Blob, enableMeetingMode: boolean, enablePostProcessing: boolean) => void,
		autoStart: boolean
	) {
		super(app);
		this.recorder = new AudioRecorder();
		this.plugin = plugin;
		this.settings = settings;
		this.onRecordingComplete = onRecordingComplete;
		this.maxDuration = maxDuration;
		this.autoStart = autoStart;
		this.postProcessingEnabled = settings.enablePostProcessing;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.addClass('voice-md-recording-modal');
		contentEl.empty();

		// Title
		contentEl.createEl('h2', { text: 'Voice recording' });

		// Status indicator
		this.statusEl = contentEl.createDiv({ cls: 'voice-md-status' });
		this.statusEl.setText('Ready to record');

		// Timer display
		this.timerEl = contentEl.createDiv({ cls: 'voice-md-timer' });
		this.timerEl.setText('00:00');

		// Meeting mode checkbox
		const meetingModeContainer = contentEl.createDiv({ cls: 'voice-md-meeting-mode' });
		const meetingModeLabel = meetingModeContainer.createEl('label');
		const meetingModeCheckbox = meetingModeLabel.createEl('input', { type: 'checkbox' });
		meetingModeCheckbox.checked = false; // Default: unchecked
		meetingModeLabel.appendText(' Enable Meeting Mode (Speaker Identification)');

		// Wire change handler
		meetingModeCheckbox.addEventListener('change', () => {
			this.meetingModeEnabled = meetingModeCheckbox.checked;
		});

		// Post-processing checkbox
		const postProcessingContainer = contentEl.createDiv({ cls: 'voice-md-meeting-mode' });
		const postProcessingLabel = postProcessingContainer.createEl('label');
		const postProcessingCheckbox = postProcessingLabel.createEl('input', { type: 'checkbox' });
		postProcessingCheckbox.checked = this.postProcessingEnabled; // Default from global setting
		postProcessingLabel.appendText(' Enable Post-Processing (Smart Formatting)');

		// Wire change handler - updates both instance state and global settings
		postProcessingCheckbox.addEventListener('change', async () => {
			this.postProcessingEnabled = postProcessingCheckbox.checked;
			// Update global setting
			this.settings.enablePostProcessing = postProcessingCheckbox.checked;
			await this.plugin.saveData(this.settings);
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
			text: 'Start recording'
		});
		this.startBtn.addEventListener('click', () => this.startRecording());

		this.stopBtn = this.controlsEl.createEl('button', {
			cls: 'mod-warning voice-md-hidden',
			text: 'Stop recording'
		});
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
			this.startBtn.addClass('voice-md-hidden');
			this.stopBtn.removeClass('voice-md-hidden');
			this.stopBtn.addClass('voice-md-visible');
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
			this.onRecordingComplete(blob, this.meetingModeEnabled, this.postProcessingEnabled);

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
