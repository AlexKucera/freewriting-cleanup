// ABOUTME: Type definitions for the Freewriting Cleanup plugin
// ABOUTME: Defines interfaces for settings, API responses, and plugin configuration

export interface FreewritingCleanupSettings {
    apiKey: string;
    model: string; // Changed from AnthropicModel to string to support dynamic models
    cleanupPrompt: string;
    enableCommentary: boolean;
    commentaryStyle: CommentaryStyle;
    customCommentaryPrompt: string;
}

export interface FreewritingCleanupData extends FreewritingCleanupSettings {
    modelCache?: ModelCache;
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

export interface ModelInfo {
    id: string;
    display_name: string;
    created_at: string;
    type: string;
}

export interface ModelsListResponse {
    data: ModelInfo[];
    first_id: string;
    has_more: boolean;
    last_id: string;
}

export interface ModelCache {
    models: ModelInfo[];
    fetchedAt: number;
}

// Fallback model list used when API key is not set or API fetch fails
export const ANTHROPIC_MODELS: readonly string[] = [
    'claude-opus-4-1-20250805',
    'claude-opus-4-20250514',
    'claude-sonnet-4-20250514',
    'claude-3-7-sonnet-latest',
    'claude-3-5-haiku-latest',
    'claude-3-haiku-20240307'
];

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