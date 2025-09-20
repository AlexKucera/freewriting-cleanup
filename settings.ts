// ABOUTME: Settings interface and SettingTab implementation for the Freewriting Cleanup plugin
// ABOUTME: Handles user configuration including API key, model selection, and prompt customization

import { App, ButtonComponent, Notice, PluginSettingTab, Setting } from 'obsidian';
import FreewritingCleanupPlugin from './main';
import { FreewritingCleanupSettings, ANTHROPIC_MODELS, AnthropicModel, COMMENTARY_STYLES, CommentaryStyle, COMMENTARY_PRESETS } from './types';

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

    constructor(app: App, plugin: FreewritingCleanupPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Freewriting Cleanup Settings' });

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
                ANTHROPIC_MODELS.forEach(model => {
                    dropdown.addOption(model, model);
                });
                dropdown
                    .setValue(this.plugin.settings.model)
                    .onChange(async (value) => {
                        this.plugin.settings.model = value as AnthropicModel;
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
                descDiv.innerHTML = `<strong>Selected style:</strong> ${presetText}`;
            }
        }

        // MARK: - Usage Information

        containerEl.createEl('h3', { text: 'Usage Information' });

        const usageDiv = containerEl.createDiv();
        usageDiv.innerHTML = `
            <p><strong>How to use:</strong></p>
            <ol>
                <li>Select the text you want to clean up in any note</li>
                <li>Run the "Clean Up Freewriting" command (Ctrl/Cmd+P)</li>
                <li>The cleaned text will appear below your original text</li>
            </ol>
            <p><strong>Limits:</strong> Maximum 680,000 characters (~150,000 words) per cleanup</p>
            <p><strong>Format:</strong> Original text → separator → cleaned text</p>
        `;

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

// Simple confirmation modal
class ConfirmModal {
    private app: App;
    private title: string;
    private message: string;
    private callback: (result: boolean) => void;
    private modalEl: HTMLElement;

    constructor(app: App, title: string, message: string, callback: (result: boolean) => void) {
        this.app = app;
        this.title = title;
        this.message = message;
        this.callback = callback;
    }

    open(): void {
        // Create modal backdrop
        this.modalEl = document.createElement('div');
        this.modalEl.className = 'modal-container mod-dim';

        // Create modal content
        const modal = this.modalEl.createDiv('modal');
        const header = modal.createDiv('modal-header');
        header.createEl('h3', { text: this.title });

        const content = modal.createDiv('modal-content');
        content.createEl('p', { text: this.message });

        const buttons = modal.createDiv('modal-button-container');

        const cancelButton = buttons.createEl('button', { text: 'Cancel' });
        cancelButton.onclick = () => this.close(false);

        const confirmButton = buttons.createEl('button', { text: 'Confirm', cls: 'mod-warning' });
        confirmButton.onclick = () => this.close(true);

        document.body.appendChild(this.modalEl);
        confirmButton.focus();
    }

    private close(result: boolean): void {
        if (this.modalEl && this.modalEl.parentNode) {
            this.modalEl.parentNode.removeChild(this.modalEl);
        }
        this.callback(result);
    }
}