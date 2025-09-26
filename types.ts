// ABOUTME: Type definitions for the Freewriting Cleanup plugin
// ABOUTME: Defines interfaces for settings, API responses, and plugin configuration

export interface FreewritingCleanupSettings {
    apiKey: string;
    model: AnthropicModel;
    cleanupPrompt: string;
    enableCommentary: boolean;
    commentaryStyle: CommentaryStyle;
    customCommentaryPrompt: string;
}

export interface AnthropicMessage {
    role: 'user' | 'assistant' | 'system';
    content: Array<{
        type: string;
        text: string;
    }>;
}

export interface AnthropicRequest {
    model: string;
    max_tokens: number;
    messages: AnthropicMessage[];
    system?: Array<{
        type: string;
        text: string;
    }>;
}

export interface AnthropicResponse {
    content: Array<{
        text: string;
        type: 'text';
    }>;
    id: string;
    model: string;
    role: 'assistant';
    stop_reason: string;
    stop_sequence: null;
    type: 'message';
    usage: {
        input_tokens: number;
        output_tokens: number;
    };
}

export interface CleanupResult {
    originalText: string;
    cleanedText: string;
    commentary?: string;
    timestamp: Date;
    model: string;
    tokensUsed: {
        input: number;
        output: number;
    };
}

export const ANTHROPIC_MODELS = [
    'claude-opus-4-1-20250805',
    'claude-opus-4-20250514',
    'claude-sonnet-4-20250514',
    'claude-3-7-sonnet-latest',
    'claude-3-5-haiku-latest',
    'claude-3-haiku-20240307'
] as const;

export type AnthropicModel = typeof ANTHROPIC_MODELS[number];

// Commentary style options
export const COMMENTARY_STYLES = [
    'constructive',
    'encouraging',
    'analytical',
    'brief',
    'custom'
] as const;

export type CommentaryStyle = typeof COMMENTARY_STYLES[number];

// Preset commentary prompts
export const COMMENTARY_PRESETS: Record<Exclude<CommentaryStyle, 'custom'>, string> = {
    constructive: 'Provide balanced feedback on this freewriting, noting strengths and areas for development. Consider the flow of ideas, creativity, and any interesting themes that emerged.',
    encouraging: 'Offer positive, supportive observations about this freewriting session. Focus on what worked well, creative insights, and encouraging the writer to continue exploring these ideas.',
    analytical: 'Analyze the writing structure, themes, and patterns in this freewriting. Look at the progression of thoughts, recurring concepts, and the overall coherence of ideas.',
    brief: 'Give 2-3 concise observations about this freewriting session. Keep it short but insightful.'
};

// Constants for Anthropic API limits
export const ANTHROPIC_LIMITS = {
    MAX_TOKENS: 200000,
    MAX_CHARACTERS: 680000,
    DEFAULT_MAX_OUTPUT_TOKENS: 4000
} as const;