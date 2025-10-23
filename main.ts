// ABOUTME: Main plugin file for Freewriting Cleanup - cleans up freewriting text using AI
// ABOUTME: Coordinates between services, commands, and Obsidian's plugin lifecycle

import { Editor, MarkdownView, Plugin } from 'obsidian';
import { FreewritingCleanupSettings, FreewritingCleanupData } from './types';
import { DEFAULT_SETTINGS, FreewritingCleanupSettingTab } from './settings';
import { CleanupService } from './services/cleanupService';
import { ModelService } from './services/modelService';
import { CleanupCommand } from './commands/cleanupCommand';

export default class FreewritingCleanupPlugin extends Plugin {
    settings: FreewritingCleanupSettings;
    cleanupService: CleanupService;
    modelService: ModelService;
    cleanupCommand: CleanupCommand;

    async onload() {
        await this.loadSettings();

        // Initialize services
        this.cleanupService = new CleanupService(this.settings.apiKey);
        this.modelService = new ModelService(this.cleanupService.anthropicClient);
        this.cleanupCommand = new CleanupCommand(this.cleanupService);

        // Load model cache
        const data = await this.loadData() as FreewritingCleanupData | null;
        if (data?.modelCache) {
            this.modelService.loadCache(data.modelCache);
        }

        // Register command
        this.registerCommand();

        // Add settings tab
        this.addSettingTab(new FreewritingCleanupSettingTab(this.app, this));
    }

    onunload() {
        // Cleanup if needed
    }

    // MARK: - Settings Management

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

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

    private async executeCleanupCommand(editor: Editor, view: MarkdownView): Promise<void> {
        try {
            await this.cleanupCommand.execute(editor, view, this.settings);
        } catch (error) {
            console.error('Error executing cleanup command:', error);
        }
    }
}
