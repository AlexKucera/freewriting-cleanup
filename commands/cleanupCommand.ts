// ABOUTME: Command implementation for the freewriting cleanup functionality
// ABOUTME: Handles editor interaction, text selection, and result insertion

import { Editor, MarkdownView, Notice } from 'obsidian';
import { CleanupService } from '../services/cleanupService';
import { FreewritingCleanupSettings, ANTHROPIC_LIMITS } from '../types';

/**
 * Command handler for freewriting cleanup operations
 *
 * Coordinates editor interaction, text selection validation, cleanup execution,
 * and result insertion. Provides user feedback through notices for all stages
 * of the cleanup process.
 */
export class CleanupCommand {
    private cleanupService: CleanupService;

    /**
     * Creates a new cleanup command handler
     *
     * @param cleanupService - Service for performing text cleanup
     */
    constructor(cleanupService: CleanupService) {
        this.cleanupService = cleanupService;
    }

    // MARK: - Public Methods

    /**
     * Executes the cleanup command on selected text
     *
     * Gets selected text from editor, validates it, sends to cleanup service,
     * and inserts formatted result below the selection. Shows persistent loading
     * notice during processing and error notices if operation fails.
     *
     * @param editor - Obsidian editor instance
     * @param _view - Current markdown view (unused but required by editorCallback signature)
     * @param settings - Plugin settings for cleanup configuration
     */
    async execute(editor: Editor, _view: MarkdownView, settings: FreewritingCleanupSettings): Promise<void> {
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
            const loadingNotice = new Notice('Cleaning up text...', 0); // persistent; hide in finally

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
            } catch (error) {
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
            } finally {
                loadingNotice.hide();
            }

        } catch (error) {
            console.error('Error in cleanup command:', error);
        }
    }

    // MARK: - Helper Methods

    /**
     * Formats text selection information for user feedback
     *
     * Creates a summary string showing character count, line count, and
     * estimated token usage for the selected text.
     *
     * @param text - Selected text to analyze
     * @returns Formatted information string
     */
    private formatSelectedTextInfo(text: string): string {
        const characterCount = text.length;
        const estimatedTokens = CleanupService.estimateTokenCount(text);
        const lines = text.split('\n').length;

        return `Selected: ${characterCount} characters, ${lines} lines, ~${estimatedTokens} tokens`;
    }

    // MARK: - Validation Methods

    /**
     * Validates text selection against API limits
     *
     * Checks that text is non-empty and within both character and token limits.
     * Returns detailed validation result with error messages or info for user feedback.
     *
     * @param selectedText - Text to validate
     * @returns Validation result with status, optional error, and optional info
     */
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
                error: `Text too long: ${limits.characterCount.toLocaleString()} characters (max: ${ANTHROPIC_LIMITS.MAX_CHARACTERS.toLocaleString()})`
            };
        }

        if (!limits.withinTokenLimit) {
            return {
                isValid: false,
                error: `Text too long: ~${limits.estimatedTokenCount.toLocaleString()} tokens (max: ${ANTHROPIC_LIMITS.MAX_TOKENS.toLocaleString()})`
            };
        }

        return {
            isValid: true,
            info: this.formatSelectedTextInfo(selectedText)
        };
    }
}