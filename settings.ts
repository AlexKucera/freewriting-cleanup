// ABOUTME: Settings interface and SettingTab implementation for the Freewriting Cleanup plugin
// ABOUTME: Handles user configuration including API key, model selection, and prompt customization

import { App, ButtonComponent, DropdownComponent, Modal, Notice, PluginSettingTab, Setting } from 'obsidian';
import FreewritingCleanupPlugin from './main';
import { FreewritingCleanupSettings, COMMENTARY_STYLES, CommentaryStyle, COMMENTARY_PRESETS } from './types';
import { ModelOption } from './services/modelService';

/**
 * Default plugin settings
 *
 * Provides sensible defaults for all settings when plugin is first installed
 * or when settings are reset.
 */
export const DEFAULT_SETTINGS: FreewritingCleanupSettings = {
    apiKey: '',
    model: 'claude-3-5-haiku-latest' as const,
    cleanupPrompt: 'I did some free writing. Please correct my jumbled typo mess. Only fix spelling, grammar, and punctuation. Add line breaks and paragraphs as appropriate. Do not make stylistic changes to the content or tone.',
    enableCommentary: false,
    commentaryStyle: 'constructive' as const,
    customCommentaryPrompt: 'Provide thoughtful feedback on this freewriting session, considering the writer\'s flow of thoughts and ideas.'
};

/**
 * Settings tab for the Freewriting Cleanup plugin
 *
 * Provides UI for configuring API key, model selection, cleanup prompts,
 * and commentary options. Handles model list loading, API key testing,
 * and settings reset functionality.
 */
export class FreewritingCleanupSettingTab extends PluginSettingTab {
    plugin: FreewritingCleanupPlugin;
    private modelDropdown: DropdownComponent | null = null;
    private availableModels: ModelOption[] = [];

    /**
     * Creates a new settings tab
     *
     * @param app - Obsidian app instance
     * @param plugin - Plugin instance
     */
    constructor(app: App, plugin: FreewritingCleanupPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    /**
     * Renders the settings UI
     *
     * Creates all settings controls including API configuration, model selection,
     * cleanup prompts, commentary options, and usage information. Loads models
     * asynchronously in the background.
     */
    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Freewriting Cleanup Settings' });

        // Load models asynchronously in the background
        this.loadModels()
            .then(() => {
                // Update dropdown UI when models are loaded
                if (this.modelDropdown) {
                    this.populateModelDropdown(this.modelDropdown);
                }
            })
            .catch((error) => {
                console.error('Error loading models in background:', error);
            });

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
                        this.availableModels = this.plugin.modelService.getFallbackOptions();
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

    /**
     * Loads available models from model service
     *
     * Fetches current model list (from cache or API) and updates the
     * availableModels array for dropdown population.
     */
    private async loadModels(): Promise<void> {
        try {
            this.availableModels = await this.plugin.modelService.getAvailableModels();
        } catch (error) {
            console.error('Error loading models:', error);
            // Error already shown by ModelService via Notice
        }
    }

    /**
     * Populates the model dropdown with available options
     *
     * Updates dropdown with current model list or shows loading state.
     * Disables dropdown if no models are available yet.
     *
     * @param dropdown - Dropdown component to populate
     */
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

    /**
     * Refreshes model list from API
     *
     * Forces a fresh fetch of models, updates the dropdown UI, and handles
     * the case where the currently selected model is no longer available.
     * Shows loading state during refresh.
     */
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

                // Restore selected model if it still exists, otherwise use first available
                const currentModel = this.plugin.settings.model;
                const modelExists = this.availableModels.some(m => m.id === currentModel);

                if (modelExists) {
                    this.modelDropdown.setValue(currentModel);
                } else if (this.availableModels.length > 0) {
                    // Model no longer available - update to first available model
                    const newModel = this.availableModels[0].id;
                    this.plugin.settings.model = newModel;
                    this.modelDropdown.setValue(newModel);
                    console.log(`Model '${currentModel}' no longer available, switched to '${newModel}'`);
                }
            }

            // Save updated cache and any model changes
            await this.plugin.saveSettings();
        } catch (error) {
            console.error('Error refreshing models:', error);
            // Error already shown by ModelService via Notice
        }
    }

    // MARK: - Private Methods

    /**
     * Tests the API key connection
     *
     * Makes a test API request and shows user feedback via notices.
     * Updates button state during testing.
     *
     * @param button - Button component that triggered the test
     */
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

    /**
     * Resets settings to defaults
     *
     * Shows confirmation dialog and resets all settings except API key to
     * their default values. Refreshes the settings UI after reset.
     */
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

    /**
     * Shows a confirmation dialog
     *
     * Creates a modal dialog asking user to confirm an action.
     *
     * @param title - Dialog title
     * @param message - Confirmation message
     * @returns Promise that resolves to true if user confirmed, false if cancelled
     */
    private async showConfirmDialog(title: string, message: string): Promise<boolean> {
        return new Promise((resolve) => {
            const modal = new ConfirmModal(this.app, title, message, (result) => {
                resolve(result);
            });
            modal.open();
        });
    }
}

/**
 * Confirmation modal for destructive actions
 *
 * Uses Obsidian's Modal class for consistent styling and accessibility.
 * Provides Cancel and Confirm buttons with appropriate focus handling.
 */
class ConfirmModal extends Modal {
    private title: string;
    private message: string;
    private callback: (result: boolean) => void;

    /**
     * Creates a new confirmation modal
     *
     * @param app - Obsidian app instance
     * @param title - Modal title
     * @param message - Confirmation message
     * @param callback - Callback invoked with true (confirmed) or false (cancelled)
     */
    constructor(app: App, title: string, message: string, callback: (result: boolean) => void) {
        super(app);
        this.title = title;
        this.message = message;
        this.callback = callback;
    }

    /**
     * Renders the modal content
     *
     * Creates title, message, and Cancel/Confirm buttons. Sets focus to
     * Confirm button for keyboard accessibility.
     */
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

    /**
     * Cleans up modal content when closed
     */
    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}