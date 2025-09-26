// ABOUTME: Command implementation for the freewriting cleanup functionality
// ABOUTME: Handles editor interaction, text selection, and result insertion

import { Editor, MarkdownView, Notice } from 'obsidian';
import { CleanupService } from '../services/cleanupService';
import { FreewritingCleanupSettings } from '../types';

export class CleanupCommand {
    private cleanupService: CleanupService;

    constructor(cleanupService: CleanupService) {
        this.cleanupService = cleanupService;
    }

    // MARK: - Public Methods

    async execute(editor: Editor, view: MarkdownView, settings: FreewritingCleanupSettings): Promise<void> {
        try {
            // Get selected text
            const selectedText = editor.getSelection();

            if (!selectedText || selectedText.trim().length === 0) {
                new Notice('Please select some text to clean up');
                return;
            }

            // Validate text selection before proceeding
            const validation = this.validateSelection(selectedText);
            if (!validation.isValid) {
                new Notice(validation.error || 'Invalid text selection');
                return;
            }

            // Show loading notice
            const loadingNotice = new Notice('Cleaning up text...', 0); // 0 = persistent

            try {
                // Process the text
                const result = await this.cleanupService.cleanupText(selectedText, settings);

                // Format the result with separator
                const formattedResult = this.cleanupService.formatCleanupResult(result);

                // Get cursor position and selection range
                const selectionEnd = editor.getCursor('to');

                // Insert the formatted result below the selected text
                const insertPosition = {
                    line: selectionEnd.line,
                    ch: editor.getLine(selectionEnd.line).length
                };

                // Move to end of current line and insert new content
                editor.setCursor(insertPosition);
                editor.replaceRange(formattedResult, insertPosition);

                // Clear the loading notice
                loadingNotice.hide();

            } catch (error) {
                // Clear loading notice
                loadingNotice.hide();

                // Handle specific error types
                if (error instanceof Error) {
                    if (error.message.includes('API key')) {
                        new Notice('API key error. Please check your settings.');
                    } else if (error.message.includes('too long')) {
                        new Notice('Text is too long for processing.');
                    } else if (error.message.includes('Failed after')) {
                        new Notice('Service temporarily unavailable. Please try again.');
                    } else {
                        new Notice(`Cleanup failed: ${error.message}`);
                    }
                } else {
                    new Notice('An unexpected error occurred during cleanup.');
                }

                console.error('Cleanup command error:', error);
                throw error;
            }

        } catch (error) {
            console.error('Error in cleanup command:', error);
        }
    }

    // MARK: - Helper Methods


    private formatSelectedTextInfo(text: string): string {
        const characterCount = text.length;
        const estimatedTokens = CleanupService.estimateTokenCount(text);
        const lines = text.split('\n').length;

        return `Selected: ${characterCount} characters, ${lines} lines, ~${estimatedTokens} tokens`;
    }

    // MARK: - Validation Methods

    validateSelection(selectedText: string): {
        isValid: boolean;
        error?: string;
        info?: string;
    } {
        if (!selectedText || selectedText.trim().length === 0) {
            return {
                isValid: false,
                error: 'No text selected'
            };
        }

        const limits = CleanupService.isWithinLimits(selectedText);

        if (!limits.withinCharacterLimit) {
            return {
                isValid: false,
                error: `Text too long: ${limits.characterCount} characters (max: 680,000)`
            };
        }

        if (!limits.withinTokenLimit) {
            return {
                isValid: false,
                error: `Text too long: ~${limits.estimatedTokenCount} tokens (max: 200,000)`
            };
        }

        return {
            isValid: true,
            info: this.formatSelectedTextInfo(selectedText)
        };
    }
}