// ABOUTME: Settings interface and SettingTab implementation for the Freewriting Cleanup plugin
// ABOUTME: Handles user configuration including API key, model selection, and prompt customization

import { App, ButtonComponent, DropdownComponent, Modal, Notice, PluginSettingTab, Setting } from 'obsidian';
import FreewritingCleanupPlugin from './main';
import { FreewritingCleanupSettings, COMMENTARY_STYLES, CommentaryStyle, COMMENTARY_PRESETS } from './types';
import { ModelOption } from './services/modelService';

export const DEFAULT_SETTINGS: FreewritingCleanupSettings = {
    apiKey: '',
    model: 'claude-3-5-haiku-latest' as const,
    cleanupPrompt: 'I did some free writing. Please correct my jumbled typo mess. Only fix spelling, grammar, and punctuation. Add line breaks and paragraphs as appropriate. Do not make stylistic changes to the content or tone.',
    enableCommentary: false,
    commentaryStyle: 'constructive' as const,
    customCommentaryPrompt: 'Provide thoughtful feedback on this freewriting session, considering the writer\'s flow of thoughts and ideas.'
};

export class FreewritingCleanupSettingTab extends PluginSettingTab {
    plugin: FreewritingCleanupPlugin;
    private modelDropdown: DropdownComponent | null = null;
    private availableModels: ModelOption[] = [];

    constructor(app: App, plugin: FreewritingCleanupPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    async display(): Promise<void> {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Freewriting Cleanup Settings' });

        // Load models asynchronously
        await this.loadModels();

        // MARK: - API Configuration

        containerEl.createEl('h3', { text: 'API Configuration' });

        new Setting(containerEl)
            .setName('Anthropic API Key')
            .setDesc('Your Anthropic API key for Claude. Get one at https://console.anthropic.com/')
            .addText(text => text
                .setPlaceholder('sk-ant-...')
                .setValue(this.plugin.settings.apiKey)
                .onChange(async (value) => {
                    this.plugin.settings.apiKey = value;
                    await this.plugin.saveSettings();
                    this.plugin.cleanupService.updateApiKey(value);

                    // Refresh when key is entered; revert to fallback when cleared
                    const hasKey = value.trim().length > 0;
                    if (hasKey) {
                        await this.refreshModels();
                    } else if (this.modelDropdown) {
                        // Show fallback immediately when key is cleared
                        this.availableModels = await this.plugin.modelService.getAvailableModels();
                        this.populateModelDropdown(this.modelDropdown);
                    }
                }))
            .then(setting => {
                // Make it a password field
                setting.controlEl.querySelector('input')?.setAttribute('type', 'password');
            });

        new Setting(containerEl)
            .setName('Test API Key')
            .setDesc('Test your API key to verify it works correctly')
            .addButton(button => button
                .setButtonText('Test Connection')
                .onClick(async () => {
                    await this.testApiKey(button);
                }));

        new Setting(containerEl)
            .setName('Claude Model')
            .setDesc('Which Claude model to use for text cleanup')
            .addDropdown(dropdown => {
                this.modelDropdown = dropdown;
                this.populateModelDropdown(dropdown);
                dropdown
                    .setValue(this.plugin.settings.model)
                    .onChange(async (value) => {
                        this.plugin.settings.model = value;
                        await this.plugin.saveSettings();
                    });
            });

        // MARK: - Cleanup Configuration

        containerEl.createEl('h3', { text: 'Cleanup Configuration' });

        new Setting(containerEl)
            .setName('Cleanup Prompt')
            .setDesc('Instructions for how Claude should clean up your freewriting text')
            .addTextArea(textArea => {
                textArea
                    .setPlaceholder('Enter your cleanup instructions...')
                    .setValue(this.plugin.settings.cleanupPrompt)
                    .onChange(async (value) => {
                        this.plugin.settings.cleanupPrompt = value;
                        await this.plugin.saveSettings();
                    });

                // Style the textarea
                textArea.inputEl.rows = 4;
                textArea.inputEl.addClass('freewriting-cleanup-textarea');
            });

        // MARK: - Commentary Configuration

        containerEl.createEl('h3', { text: 'AI Commentary' });

        new Setting(containerEl)
            .setName('AI should comment on text')
            .setDesc('After cleaning up your text, AI will provide thoughtful commentary on your freewriting session')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableCommentary)
                .onChange(async (value) => {
                    this.plugin.settings.enableCommentary = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show/hide commentary options
                }));

        if (this.plugin.settings.enableCommentary) {
            new Setting(containerEl)
                .setName('Commentary Style')
                .setDesc('Choose the type of feedback AI should provide')
                .addDropdown(dropdown => {
                    COMMENTARY_STYLES.forEach(style => {
                        const displayName = style.charAt(0).toUpperCase() + style.slice(1);
                        dropdown.addOption(style, displayName);
                    });
                    dropdown
                        .setValue(this.plugin.settings.commentaryStyle)
                        .onChange(async (value) => {
                            this.plugin.settings.commentaryStyle = value as CommentaryStyle;
                            await this.plugin.saveSettings();
                            this.display(); // Refresh to show/hide custom prompt
                        });
                });

            if (this.plugin.settings.commentaryStyle === 'custom') {
                new Setting(containerEl)
                    .setName('Custom Commentary Prompt')
                    .setDesc('Instructions for how AI should comment on your freewriting')
                    .addTextArea(textArea => {
                        textArea
                            .setPlaceholder('Enter your commentary instructions...')
                            .setValue(this.plugin.settings.customCommentaryPrompt)
                            .onChange(async (value) => {
                                this.plugin.settings.customCommentaryPrompt = value;
                                await this.plugin.saveSettings();
                            });

                        // Style the textarea
                        textArea.inputEl.rows = 3;
                        textArea.inputEl.addClass('freewriting-cleanup-textarea-small');
                    });
            } else {
                // Show the current preset for reference
                const presetText = COMMENTARY_PRESETS[this.plugin.settings.commentaryStyle as Exclude<CommentaryStyle, 'custom'>];
                const descDiv = containerEl.createDiv({ cls: 'setting-item-description freewriting-cleanup-description' });
                descDiv.empty();
                descDiv.createEl('strong', { text: 'Selected style: ' });
                descDiv.appendText(presetText);
            }
        }

        // MARK: - Usage Information

        containerEl.createEl('h3', { text: 'Usage Information' });

        const usageDiv = containerEl.createDiv();
        usageDiv.empty();

        const howToUse = usageDiv.createEl('p');
        howToUse.createEl('strong', { text: 'How to use:' });

        const list = usageDiv.createEl('ol');
        list.createEl('li', { text: 'Select the text you want to clean up in any note' });
        list.createEl('li', { text: 'Run the "Clean Up Freewriting" command (Ctrl/Cmd+P)' });
        list.createEl('li', { text: 'The cleaned text will appear below your original text' });

        const limits = usageDiv.createEl('p');
        limits.createEl('strong', { text: 'Limits: ' });
        limits.appendText('Maximum 680,000 characters (~150,000 words) per cleanup');

        const format = usageDiv.createEl('p');
        format.createEl('strong', { text: 'Format: ' });
        format.appendText('Original text → separator → cleaned text');

        // MARK: - Reset Settings

        containerEl.createEl('h3', { text: 'Reset' });

        new Setting(containerEl)
            .setName('Reset to Defaults')
            .setDesc('Reset all settings to their default values')
            .addButton(button => button
                .setButtonText('Reset Settings')
                .setWarning()
                .onClick(async () => {
                    await this.resetSettings();
                }));
    }

    // MARK: - Model Loading

    private async loadModels(): Promise<void> {
        try {
            this.availableModels = await this.plugin.modelService.getAvailableModels();
        } catch (error) {
            console.error('Error loading models:', error);
            // Error already shown by ModelService via Notice
        }
    }

    private populateModelDropdown(dropdown: DropdownComponent): void {
        if (this.availableModels.length === 0) {
            // No models available yet, disable dropdown
            dropdown.addOption('', 'Loading models...');
            dropdown.setDisabled(true);
            return;
        }

        // Clear existing options
        dropdown.selectEl.empty();

        // Add all available models
        this.availableModels.forEach(model => {
            dropdown.addOption(model.id, model.displayName);
        });

        dropdown.setDisabled(false);
    }

    private async refreshModels(): Promise<void> {
        try {
            // Disable dropdown during refresh
            if (this.modelDropdown) {
                this.modelDropdown.setDisabled(true);
                this.modelDropdown.selectEl.empty();
                this.modelDropdown.addOption('', 'Refreshing models...');
            }

            // Fetch new models
            this.availableModels = await this.plugin.modelService.refreshModels();

            // Update dropdown
            if (this.modelDropdown) {
                this.populateModelDropdown(this.modelDropdown);

                // Restore selected model if it still exists
                const currentModel = this.plugin.settings.model;
                const modelExists = this.availableModels.some(m => m.id === currentModel);
                if (modelExists) {
                    this.modelDropdown.setValue(currentModel);
                }
            }

            // Save updated cache
            await this.plugin.saveSettings();
        } catch (error) {
            console.error('Error refreshing models:', error);
            // Error already shown by ModelService via Notice
        }
    }

    // MARK: - Private Methods

    private async testApiKey(button: ButtonComponent): Promise<void> {
        const originalText = button.buttonEl.textContent;
        button.setButtonText('Testing...');
        button.setDisabled(true);

        try {
            const result = await this.plugin.cleanupService.testConnection(this.plugin.settings);

            if (result.success) {
                new Notice('✅ API connection successful!');
                if (result.details) {
                    const details = result.details;
                    new Notice(`Model: ${details.model}, Response time: ${details.responseTime}ms`);
                }
            } else {
                new Notice(`❌ API test failed: ${result.message}`);
            }
        } catch (error) {
            new Notice(`❌ API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            button.setButtonText(originalText || 'Test Connection');
            button.setDisabled(false);
        }
    }

    private async resetSettings(): Promise<void> {
        // Confirm the reset
        const confirmed = await this.showConfirmDialog('Reset Settings',
            'Are you sure you want to reset all settings to their defaults? This cannot be undone.');

        if (confirmed) {
            // Keep the API key but reset everything else
            const currentApiKey = this.plugin.settings.apiKey;
            this.plugin.settings = { ...DEFAULT_SETTINGS, apiKey: currentApiKey };

            await this.plugin.saveSettings();
            this.plugin.cleanupService.updateApiKey(currentApiKey);

            // Refresh the settings display
            this.display();

            new Notice('Settings reset to defaults');
        }
    }

    private async showConfirmDialog(title: string, message: string): Promise<boolean> {
        return new Promise((resolve) => {
            const modal = new ConfirmModal(this.app, title, message, (result) => {
                resolve(result);
            });
            modal.open();
        });
    }
}

// Confirmation modal using Obsidian's Modal class for consistent styling and accessibility
class ConfirmModal extends Modal {
    private title: string;
    private message: string;
    private callback: (result: boolean) => void;

    constructor(app: App, title: string, message: string, callback: (result: boolean) => void) {
        super(app);
        this.title = title;
        this.message = message;
        this.callback = callback;
    }

    onOpen(): void {
        const { contentEl } = this;

        contentEl.createEl('h2', { text: this.title });
        contentEl.createEl('p', { text: this.message });

        const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });

        const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
        cancelButton.addEventListener('click', () => {
            this.close();
            this.callback(false);
        });

        const confirmButton = buttonContainer.createEl('button', {
            text: 'Confirm',
            cls: 'mod-warning'
        });
        confirmButton.addEventListener('click', () => {
            this.close();
            this.callback(true);
        });

        confirmButton.focus();
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}