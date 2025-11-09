// ABOUTME: Service class for orchestrating freewriting text cleanup operations
// ABOUTME: Handles validation, API coordination, and result formatting

import { AnthropicClient } from '../api/anthropicClient';
import { FreewritingCleanupSettings, CleanupResult, ANTHROPIC_LIMITS } from '../types';
import { ApiKeyError, TextTooLongError } from '../errors';

/**
 * Service for orchestrating text cleanup operations
 *
 * Coordinates validation, API requests, and result formatting for freewriting
 * cleanup. Acts as the main business logic layer between the command layer
 * and the API client.
 */
export class CleanupService {
    private client: AnthropicClient;

    /**
     * Exposes the Anthropic client for ModelService
     *
     * @returns The underlying Anthropic API client
     */
    get anthropicClient(): AnthropicClient {
        return this.client;
    }

    /**
     * Creates a new cleanup service
     *
     * @param apiKey - Anthropic API key for authentication
     */
    constructor(apiKey: string) {
        this.client = new AnthropicClient(apiKey);
    }

    // MARK: - Public Methods

    /**
     * Cleans up freewriting text using Claude AI
     *
     * Validates input text, makes API request through client, and returns
     * structured result with metadata. Shows user notices for timing feedback.
     *
     * @param text - The freewriting text to clean up
     * @param settings - Plugin settings including model, prompts, and commentary options
     * @returns Cleanup result with original text, cleaned text, optional commentary, and usage stats
     * @throws Error if text is empty, too long, API key is invalid, or API request fails
     */
    async cleanupText(text: string, settings: FreewritingCleanupSettings): Promise<CleanupResult> {
        // Validate input
        if (!text || text.trim().length === 0) {
            throw new Error('No text selected for cleanup');
        }

        if (!this.client.validateApiKey()) {
            throw new ApiKeyError('API key is not configured. Please check your plugin settings.');
        }

        // Check text length limits
        if (text.length > ANTHROPIC_LIMITS.MAX_CHARACTERS) {
            throw new TextTooLongError(`Selected text is too long (${text.length} characters). Maximum allowed: ${ANTHROPIC_LIMITS.MAX_CHARACTERS} characters.`);
        }

        const startTime = Date.now();

        const { cleanedText, commentary, usage } = await this.client.cleanupText(
            text,
            settings.model,
            settings.cleanupPrompt,
            settings.enableCommentary,
            settings.commentaryStyle,
            settings.customCommentaryPrompt
        );

        const duration = Date.now() - startTime;

        const result: CleanupResult = {
            originalText: text,
            cleanedText,
            commentary,
            timestamp: new Date(),
            model: settings.model,
            tokensUsed: {
                input: usage?.input_tokens ?? 0,
                output: usage?.output_tokens ?? 0
            },
            duration
        };

        return result;
    }

    /**
     * Tests the API connection using current settings
     *
     * Validates API key and makes a test request to verify connectivity.
     * Returns detailed result for user feedback in settings UI.
     *
     * @param settings - Plugin settings containing API key and model
     * @returns Test result with success status, message, and optional timing details
     */
    async testConnection(settings: FreewritingCleanupSettings): Promise<{
        success: boolean;
        message: string;
        details?: {
            model: string;
            responseTime: number;
            inputTokens?: number;
            outputTokens?: number;
        };
    }> {
        if (!this.client.validateApiKey()) {
            return {
                success: false,
                message: 'API key is not configured'
            };
        }

        try {
            const result = await this.client.testConnection(settings.model);
            return result;
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Formats cleanup result for insertion into editor
     *
     * Creates markdown-formatted output with separators between sections.
     * Includes cleaned text and optional commentary section.
     *
     * @param result - Cleanup result to format
     * @returns Formatted string ready for editor insertion
     */
    formatCleanupResult(result: CleanupResult): string {
        let formatted = `\n\n---\n\nAI Cleanup:\n\n${result.cleanedText}`;

        if (result.commentary) {
            formatted += `\n\n---\n\nAI Commentary:\n\n${result.commentary}`;
        }

        return formatted;
    }

    // MARK: - Configuration Methods

    /**
     * Updates the API key used by the underlying client
     *
     * Called when user changes API key in settings to update the client
     * without recreating the service instance.
     *
     * @param apiKey - New Anthropic API key
     */
    updateApiKey(apiKey: string): void {
        this.client.updateApiKey(apiKey);
    }

    /**
     * Validates plugin settings for completeness
     *
     * Checks that all required settings are present and valid. Used to
     * provide user feedback before attempting operations.
     *
     * @param settings - Plugin settings to validate
     * @returns Validation result with boolean flag and list of errors
     */
    validateSettings(settings: FreewritingCleanupSettings): {
        isValid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        if (!settings.apiKey || settings.apiKey.trim().length === 0) {
            errors.push('API key is required');
        }

        if (!settings.model) {
            errors.push('Model selection is required');
        }

        if (!settings.cleanupPrompt || settings.cleanupPrompt.trim().length === 0) {
            errors.push('Cleanup prompt is required');
        }

        if (settings.enableCommentary &&
            settings.commentaryStyle === 'custom' &&
            (!settings.customCommentaryPrompt || settings.customCommentaryPrompt.trim().length === 0)) {
            errors.push('Custom commentary prompt is required when commentary style is "custom"');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // MARK: - Utility Methods

    /**
     * Gets the character count of text
     *
     * @param text - Text to count characters in
     * @returns Number of characters
     */
    static getCharacterCount(text: string): number {
        return text.length;
    }

    /**
     * Estimates token count from character count
     *
     * Uses rough approximation of 1 token per 4 characters for English text.
     * Adds a 10% safety margin to account for estimation inaccuracy and reduce
     * the chance of near-limit failures.
     *
     * @param text - Text to estimate tokens for
     * @returns Estimated token count with safety margin
     */
    static estimateTokenCount(text: string): number {
        // Rough estimation: 1 token ≈ 4 characters for English text
        const baseEstimate = Math.ceil(text.length / 4);
        // Add 10% safety margin to reduce near-limit failures
        return Math.ceil(baseEstimate * 1.1);
    }

    /**
     * Checks if text is within API limits
     *
     * Validates text against both character and token limits defined by
     * Anthropic API. Returns detailed information for user feedback.
     *
     * @param text - Text to validate
     * @returns Object with limit validation flags and counts
     */
    static isWithinLimits(text: string): {
        withinCharacterLimit: boolean;
        withinTokenLimit: boolean;
        characterCount: number;
        estimatedTokenCount: number;
    } {
        const characterCount = this.getCharacterCount(text);
        const estimatedTokenCount = this.estimateTokenCount(text);

        return {
            withinCharacterLimit: characterCount <= ANTHROPIC_LIMITS.MAX_CHARACTERS,
            withinTokenLimit: estimatedTokenCount <= ANTHROPIC_LIMITS.MAX_TOKENS,
            characterCount,
            estimatedTokenCount
        };
    }
}