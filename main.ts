import { App, Editor, MarkdownView, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { VoiceCommand } from './src/commands/voice-command';
import { VoiceMDSettings } from './src/types';

const DEFAULT_SETTINGS: VoiceMDSettings = {
	openaiApiKey: '',
	chatModel: 'gpt-4o-mini',
	enablePostProcessing: false,
	postProcessingPrompt: undefined,
	language: undefined,
	maxRecordingDuration: 300,
	autoStartRecording: false
}

export default class VoiceMDPlugin extends Plugin {
	settings: VoiceMDSettings;

	async onload() {
		await this.loadSettings();

		// Add ribbon icon for quick access
		this.addRibbonIcon('voicemail', 'Start Voice Recording', () => {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (view) {
				const editor = view.editor;
				const voiceCommand = new VoiceCommand(this.app, this, this.settings);
				voiceCommand.execute(editor);
			}
		});

		// Add command for voice recording
		this.addCommand({
			id: 'start-voice-recording',
			name: 'Start Voice Recording',
			icon: 'voicemail',
			editorCallback: (editor: Editor) => {
				const voiceCommand = new VoiceCommand(this.app, this, this.settings);
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
			.setName('Auto-Start Recording')
			.setDesc('Automatically start recording when opening the voice recording modal')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoStartRecording)
				.onChange(async (value) => {
					this.plugin.settings.autoStartRecording = value;
					await this.plugin.saveSettings();
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

		new Setting(containerEl)
			.setName('Enable Post-Processing')
			.setDesc('Structure transcriptions into formatted markdown using GPT. Creates two files: raw and structured. This feature makes additional API calls.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enablePostProcessing)
				.onChange(async (value) => {
					this.plugin.settings.enablePostProcessing = value;
					await this.plugin.saveSettings();
					// Refresh display to show/hide dependent settings
					this.display();
				}));

		// Show chat model and custom prompt settings only if post-processing is enabled
		if (this.plugin.settings.enablePostProcessing) {
			new Setting(containerEl)
				.setName('Chat Model')
				.setDesc('OpenAI model for post-processing (e.g., gpt-4o-mini, gpt-4o). Note: Adds cost per transcription.')
				.addText(text => text
					.setPlaceholder('gpt-4o-mini')
					.setValue(this.plugin.settings.chatModel)
					.onChange(async (value) => {
						this.plugin.settings.chatModel = value || 'gpt-4o-mini';
						await this.plugin.saveSettings();
					}));

			new Setting(containerEl)
				.setName('Custom Formatting Prompt')
				.setDesc('Override the default prompt for structuring. Leave blank to use default.')
				.addTextArea(text => text
					.setPlaceholder('Leave blank for default prompt')
					.setValue(this.plugin.settings.postProcessingPrompt || '')
					.onChange(async (value) => {
						this.plugin.settings.postProcessingPrompt = value || undefined;
						await this.plugin.saveSettings();
					}));
		}
	}
}
