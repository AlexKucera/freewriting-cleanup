// ABOUTME: Command implementation for the freewriting cleanup functionality
// ABOUTME: Handles editor interaction, text selection, and result insertion

import { Editor, MarkdownView, Notice } from 'obsidian';
import { CleanupService } from '../services/cleanupService';
import { FreewritingCleanupSettings, ANTHROPIC_LIMITS } from '../types';
import { ApiKeyError, TextTooLongError, ServiceUnavailableError, ApiError, InvalidResponseError, NetworkError } from '../errors';

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

                // Show success notice with duration (loadingNotice will be hidden in finally)
                new Notice(`Text cleanup completed in ${(result.duration / 1000).toFixed(1)}s`);
            } catch (error) {
                // Handle specific error types using instanceof checks
                if (error instanceof ApiKeyError) {
                    new Notice('API key error. Please check your settings.');
                } else if (error instanceof TextTooLongError) {
                    new Notice(error.message);
                } else if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
                    new Notice('API key was rejected by the server. Please verify your key.');
                } else if (error instanceof ApiError && error.status === 429) {
                    new Notice('Rate limited by API. Please wait and try again.');
                } else if (error instanceof ServiceUnavailableError) {
                    new Notice(error.message);
                } else if (error instanceof InvalidResponseError) {
                    new Notice('Received an unexpected response from Claude. Please try again.');
                } else if (error instanceof NetworkError) {
                    new Notice('Network error. Check your connection and try again.');
                } else if (error instanceof Error) {
                    new Notice(`Cleanup failed: ${error.message}`);
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

    // MARK: - Validation Methods

    /**
     * Validates text selection against API limits
     *
     * Checks that text is non-empty and within both character and token limits.
     * Returns detailed validation result with error messages.
     *
     * @param selectedText - Text to validate
     * @returns Validation result with status and optional error
     */
    validateSelection(selectedText: string): {
        isValid: boolean;
        error?: string;
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
            isValid: true
        };
    }
}