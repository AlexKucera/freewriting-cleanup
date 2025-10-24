// ABOUTME: Anthropic API client for text cleanup using Claude
// ABOUTME: Handles API requests, error handling, retry logic, and response parsing

import { requestUrl } from 'obsidian';
import { AnthropicRequest, AnthropicResponse, ANTHROPIC_LIMITS, CommentaryStyle, COMMENTARY_PRESETS, ModelsListResponse } from '../types';

export class AnthropicClient {
    private apiKey: string;
    private messagesUrl = 'https://api.anthropic.com/v1/messages';
    private modelsUrl = 'https://api.anthropic.com/v1/models';
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY_BASE = 1000; // 1 second base delay

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    // MARK: - Public Methods

    async cleanupText(
        text: string,
        model: string,
        cleanupPrompt: string,
        enableCommentary = false,
        commentaryStyle: CommentaryStyle = 'constructive',
        customCommentaryPrompt?: string
    ): Promise<{ cleanedText: string; commentary?: string; usage?: { input_tokens: number; output_tokens: number } }> {
        if (!this.apiKey) {
            throw new Error('API key is required');
        }

        if (text.length > ANTHROPIC_LIMITS.MAX_CHARACTERS) {
            throw new Error(`Text too long. Maximum ${ANTHROPIC_LIMITS.MAX_CHARACTERS} characters allowed.`);
        }

        // Get commentary prompt if enabled
        let commentaryPrompt = '';
        if (enableCommentary) {
            if (commentaryStyle === 'custom' && customCommentaryPrompt) {
                commentaryPrompt = customCommentaryPrompt;
            } else {
                commentaryPrompt = COMMENTARY_PRESETS[commentaryStyle as Exclude<CommentaryStyle, 'custom'>];
            }
        }

        const systemPrompt = `${cleanupPrompt}

${enableCommentary ? `After cleaning the text, also provide commentary based on this instruction: ${commentaryPrompt}` : ''}

CRITICAL OUTPUT REQUIREMENTS - YOU MUST FOLLOW THIS EXACT FORMAT:

===CLEANED TEXT===
[Put the cleaned up text here]
- Fix spelling, grammar, and punctuation errors
- Add line breaks and paragraphs as appropriate for readability
- Preserve any existing markdown formatting (bold, italics, links, etc.)
- Do not add quotation marks or any wrapper text
===END CLEANED TEXT===

${enableCommentary ? `
===COMMENTARY===
[Put your commentary here based on the instruction above]
===END COMMENTARY===
` : ''}

You MUST use exactly these markers. Do not deviate from this format.`;

        const userMessage = `Please process this freewriting text according to the format requirements:\n\n${text}`;

        const request: AnthropicRequest = {
            model,
            max_tokens: ANTHROPIC_LIMITS.DEFAULT_MAX_OUTPUT_TOKENS,
            messages: [{ role: 'user', content: [{ type: 'text', text: userMessage }] }],
            system: [{ type: 'text', text: systemPrompt }]
        };

        const response = await this.makeRequestWithRetry(request);
        const responseText = this.extractTextFromResponse(response);
        const parsed = this.parseStructuredResponse(responseText, enableCommentary);

        return {
            ...parsed,
            usage: response.usage
        };
    }

    async testConnection(model: string): Promise<{
        success: boolean;
        message: string;
        details?: {
            model: string;
            responseTime: number;
            inputTokens?: number;
            outputTokens?: number;
        };
        error?: string;
    }> {
        if (!this.validateApiKey()) {
            return {
                success: false,
                message: 'API key is empty or invalid format',
                error: 'INVALID_KEY_FORMAT'
            };
        }

        const startTime = Date.now();
        const testRequest: AnthropicRequest = {
            model,
            max_tokens: 50,
            messages: [{ role: 'user', content: [{ type: 'text', text: 'Hello! Please respond with just "Test successful."' }] }],
            system: [{ type: 'text', text: 'You are a test assistant. Respond only with "Test successful." and nothing else.' }]
        };

        try {
            const response = await this.makeRequest(testRequest);
            const responseTime = Date.now() - startTime;

            return {
                success: true,
                message: 'API connection successful',
                details: {
                    model: response.model,
                    responseTime,
                    inputTokens: response.usage.input_tokens,
                    outputTokens: response.usage.output_tokens
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
                error: 'CONNECTION_FAILED'
            };
        }
    }

    // MARK: - Private Methods

    private async makeRequestWithRetry(request: AnthropicRequest): Promise<AnthropicResponse> {
        let lastError: Error = new Error('No attempts made');

        for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
            try {
                const response = await this.makeRequest(request);
                return response;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');

                if (attempt < this.MAX_RETRIES) {
                    const delay = this.RETRY_DELAY_BASE * Math.pow(2, attempt - 1); // Exponential backoff
                    await this.sleep(delay);
                    continue;
                }
            }
        }

        throw new Error(`Failed after ${this.MAX_RETRIES} attempts. Last error: ${lastError.message}`);
    }

    private parseStructuredResponse(responseText: string, expectCommentary: boolean): { cleanedText: string; commentary?: string } {
        // Extract cleaned text
        const cleanedTextMatch = responseText.match(/===CLEANED TEXT===([\s\S]*?)===END CLEANED TEXT===/);
        if (!cleanedTextMatch) {
            throw new Error('Invalid response format: Could not find cleaned text section');
        }

        const cleanedText = cleanedTextMatch[1].trim();
        if (!cleanedText) {
            throw new Error('Empty cleaned text received');
        }

        let commentary: string | undefined;

        if (expectCommentary) {
            const commentaryMatch = responseText.match(/===COMMENTARY===([\s\S]*?)===END COMMENTARY===/);
            if (commentaryMatch) {
                commentary = commentaryMatch[1].trim();
            }
        }

        return { cleanedText, commentary };
    }

    async fetchModels(): Promise<ModelsListResponse> {
        if (!this.apiKey) {
            throw new Error('API key is required');
        }

        try {
            const response = await requestUrl({
                url: this.modelsUrl,
                method: 'GET',
                headers: {
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                }
            });

            if (response.status < 200 || response.status >= 300) {
                throw new Error(`Models API request failed: ${response.status}\n${response.text}`);
            }

            return response.json as ModelsListResponse;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Network request failed: ${String(error)}`);
        }
    }

    private async makeRequest(request: AnthropicRequest): Promise<AnthropicResponse> {
        try {
            const response = await requestUrl({
                url: this.messagesUrl,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify(request)
            });

            if (response.status < 200 || response.status >= 300) {
                const errorBody = response.text || 'Unknown error';
                throw new Error(`API request failed (${response.status}): ${errorBody}`);
            }

            return response.json as AnthropicResponse;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Network request failed: ${String(error)}`);
        }
    }

    private extractTextFromResponse(response: AnthropicResponse): string {
        if (!response.content || response.content.length === 0) {
            throw new Error('No content received from API');
        }

        const text = response.content[0].text;
        if (!text || text.trim().length === 0) {
            throw new Error('Empty response from API');
        }

        return text.trim();
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // MARK: - Configuration Methods

    updateApiKey(apiKey: string): void {
        this.apiKey = apiKey;
    }

    validateApiKey(): boolean {
        return !!(this.apiKey && this.apiKey.trim().length > 0);
    }
}