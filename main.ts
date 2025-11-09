// ABOUTME: Main plugin file for Freewriting Cleanup - cleans up freewriting text using AI
// ABOUTME: Coordinates between services, commands, and Obsidian's plugin lifecycle

import { Editor, MarkdownView, Plugin } from 'obsidian';
import { FreewritingCleanupSettings, FreewritingCleanupData } from './types';
import { DEFAULT_SETTINGS, FreewritingCleanupSettingTab } from './settings';
import { CleanupService } from './services/cleanupService';
import { ModelService } from './services/modelService';
import { CleanupCommand } from './commands/cleanupCommand';

/**
 * Main plugin class for Freewriting Cleanup
 *
 * Coordinates the plugin lifecycle, manages services, and registers commands.
 * Uses modular architecture with separate services for cleanup operations,
 * model management, and command execution.
 */
export default class FreewritingCleanupPlugin extends Plugin {
    settings: FreewritingCleanupSettings;
    cleanupService: CleanupService;
    modelService: ModelService;
    cleanupCommand: CleanupCommand;

    /**
     * Plugin initialization
     *
     * Loads settings and model cache, initializes services, registers commands,
     * and adds settings tab. This implementation avoids redundant data loads by
     * reusing the settings data for cache restoration.
     */
    async onload() {
        // Load settings and reuse the data to avoid double loadData() call
        const data = await this.loadSettings();

        // Initialize services
        this.cleanupService = new CleanupService(this.settings.apiKey);
        this.modelService = new ModelService(this.cleanupService.anthropicClient);
        this.cleanupCommand = new CleanupCommand(this.cleanupService);

        // Load model cache from already-loaded data
        if (data?.modelCache) {
            this.modelService.loadCache(data.modelCache);
        }

        // Register command
        this.registerCommand();

        // Add settings tab
        this.addSettingTab(new FreewritingCleanupSettingTab(this.app, this));
    }

    /**
     * Plugin cleanup
     *
     * Called when plugin is disabled. Currently no cleanup needed as services
     * are stateless and will be garbage collected.
     */
    onunload() {
        // Cleanup if needed
    }

    // MARK: - Settings Management

    /**
     * Loads plugin settings from Obsidian storage
     *
     * Merges stored settings with defaults to ensure all required fields exist.
     * Excludes modelCache from settings object to keep types clean.
     * Returns the raw data for reuse in cache loading.
     *
     * @returns Raw plugin data including settings and optional cache, or null if no data exists
     */
    async loadSettings(): Promise<FreewritingCleanupData | null> {
        const data = await this.loadData() as FreewritingCleanupData | null;
        const { ...persisted } = data ?? {};
        this.settings = {
            ...DEFAULT_SETTINGS,
            ...(persisted as Partial<FreewritingCleanupSettings>)
        };
        return data;
    }

    /**
     * Saves plugin settings and model cache to Obsidian storage
     *
     * Persists current settings along with model cache for faster plugin startup.
     * Updates the cleanup service with new API key when settings change.
     */
    async saveSettings() {
        // Save settings with model cache
        const data: FreewritingCleanupData = {
            ...this.settings,
            modelCache: this.modelService?.getCache() || undefined
        };
        await this.saveData(data);

        // Update the cleanup service with new settings
        if (this.cleanupService) {
            this.cleanupService.updateApiKey(this.settings.apiKey);
        }
    }

    // MARK: - Command Registration

    /**
     * Registers the cleanup command with Obsidian
     *
     * Creates the "Clean up text" command with editor callback that executes
     * the cleanup operation on selected text. Command ID is prefixed with plugin
     * ID to avoid future collisions and maintain stability post-release.
     */
    private registerCommand() {
        this.addCommand({
            id: 'cleanup-text',
            name: 'Clean up text',
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                await this.executeCleanupCommand(editor, view);
            }
        });
    }

    // MARK: - Command Implementation

    /**
     * Executes the cleanup command
     *
     * Delegates to the CleanupCommand instance with current settings.
     * Catches and logs any errors that occur during execution.
     *
     * @param editor - Obsidian editor instance
     * @param view - Current markdown view
     */
    private async executeCleanupCommand(editor: Editor, view: MarkdownView): Promise<void> {
        try {
            await this.cleanupCommand.execute(editor, view, this.settings);
        } catch (error) {
            console.error('Error executing cleanup command:', error);
        }
    }
}
