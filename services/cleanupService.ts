// ABOUTME: Service class for orchestrating freewriting text cleanup operations
// ABOUTME: Handles validation, API coordination, and result formatting

import { Notice } from 'obsidian';
import { AnthropicClient } from '../api/anthropicClient';
import { FreewritingCleanupSettings, CleanupResult, ANTHROPIC_LIMITS } from '../types';

export class CleanupService {
    private client: AnthropicClient;

    // Expose client for ModelService
    get anthropicClient(): AnthropicClient {
        return this.client;
    }

    constructor(apiKey: string) {
        this.client = new AnthropicClient(apiKey);
    }

    // MARK: - Public Methods

    async cleanupText(text: string, settings: FreewritingCleanupSettings): Promise<CleanupResult> {
        // Validate input
        if (!text || text.trim().length === 0) {
            throw new Error('No text selected for cleanup');
        }

        if (!this.client.validateApiKey()) {
            throw new Error('API key is not configured. Please check your plugin settings.');
        }

        // Check text length limits
        if (text.length > ANTHROPIC_LIMITS.MAX_CHARACTERS) {
            throw new Error(`Selected text is too long (${text.length} characters). Maximum allowed: ${ANTHROPIC_LIMITS.MAX_CHARACTERS} characters.`);
        }

        const startTime = Date.now();

        try {
            const { cleanedText, commentary, usage } = await this.client.cleanupText(
                text,
                settings.model,
                settings.cleanupPrompt,
                settings.enableCommentary,
                settings.commentaryStyle,
                settings.customCommentaryPrompt
            );

            const result: CleanupResult = {
                originalText: text,
                cleanedText,
                commentary,
                timestamp: new Date(),
                model: settings.model,
                tokensUsed: {
                    input: usage?.input_tokens ?? 0,
                    output: usage?.output_tokens ?? 0
                }
            };

            const duration = Date.now() - startTime;
            new Notice(`Text cleanup completed in ${(duration / 1000).toFixed(1)}s`);

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            new Notice(`Text cleanup failed: ${errorMessage}`);
            throw error;
        }
    }

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

    formatCleanupResult(result: CleanupResult): string {
        let formatted = `\n\n---\n\nAI Cleanup:\n\n${result.cleanedText}`;

        if (result.commentary) {
            formatted += `\n\n---\n\nAI Commentary:\n\n${result.commentary}`;
        }

        return formatted;
    }

    // MARK: - Configuration Methods

    updateApiKey(apiKey: string): void {
        this.client.updateApiKey(apiKey);
    }

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

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // MARK: - Utility Methods

    static getCharacterCount(text: string): number {
        return text.length;
    }

    static estimateTokenCount(text: string): number {
        // Rough estimation: 1 token ≈ 4 characters for English text
        return Math.ceil(text.length / 4);
    }

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