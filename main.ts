import { App, Editor, MarkdownView, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { VoiceCommand } from './src/commands/voice-command';
import { VoiceMDSettings } from './src/types';

const DEFAULT_SETTINGS: VoiceMDSettings = {
	openaiApiKey: '',
	whisperModel: 'whisper-1',
	language: undefined,
	maxRecordingDuration: 300
}

export default class VoiceMDPlugin extends Plugin {
	settings: VoiceMDSettings;

	async onload() {
		await this.loadSettings();

		// Add ribbon icon for quick access
		this.addRibbonIcon('microphone', 'Start Voice Recording', () => {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (view) {
				const editor = view.editor;
				const voiceCommand = new VoiceCommand(this.app, this.settings);
				voiceCommand.execute(editor);
			}
		});

		// Add command for voice recording
		this.addCommand({
			id: 'start-voice-recording',
			name: 'Start Voice Recording',
			editorCallback: (editor: Editor) => {
				const voiceCommand = new VoiceCommand(this.app, this.settings);
				voiceCommand.execute(editor);
			}
		});

		// Add settings tab
		this.addSettingTab(new VoiceMDSettingTab(this.app, this));
	}

	onunload() {
		// Cleanup is handled automatically by Obsidian
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class VoiceMDSettingTab extends PluginSettingTab {
	plugin: VoiceMDPlugin;

	constructor(app: App, plugin: VoiceMDPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Voice MD Settings'});

		new Setting(containerEl)
			.setName('OpenAI API Key')
			.setDesc('Enter your OpenAI API key to enable audio transcription. Get one at https://platform.openai.com/api-keys')
			.addText(text => text
				.setPlaceholder('sk-...')
				.setValue(this.plugin.settings.openaiApiKey)
				.onChange(async (value) => {
					this.plugin.settings.openaiApiKey = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Max Recording Duration')
			.setDesc('Maximum recording duration in seconds (default: 300 seconds / 5 minutes)')
			.addText(text => text
				.setPlaceholder('300')
				.setValue(String(this.plugin.settings.maxRecordingDuration))
				.onChange(async (value) => {
					const numValue = parseInt(value);
					if (!isNaN(numValue) && numValue > 0) {
						this.plugin.settings.maxRecordingDuration = numValue;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl)
			.setName('Language')
			.setDesc('Optional: Force a specific language (e.g., "en", "es", "fr"). Leave empty for auto-detection.')
			.addText(text => text
				.setPlaceholder('Auto-detect')
				.setValue(this.plugin.settings.language || '')
				.onChange(async (value) => {
					this.plugin.settings.language = value || undefined;
					await this.plugin.saveSettings();
				}));
	}
}
