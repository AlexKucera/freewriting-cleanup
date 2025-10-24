// ABOUTME: Type definitions for the Freewriting Cleanup plugin
// ABOUTME: Defines interfaces for settings, API responses, and plugin configuration

/**
 * Plugin settings interface
 *
 * Defines all configurable options for the Freewriting Cleanup plugin.
 * Settings are persisted to Obsidian's plugin data storage.
 */
export interface FreewritingCleanupSettings {
    /** Anthropic API key for authentication */
    apiKey: string;
    /** Claude model identifier (dynamically fetched from API) */
    model: string;
    /** Instructions for how Claude should clean up text */
    cleanupPrompt: string;
    /** Whether to include AI commentary on the writing */
    enableCommentary: boolean;
    /** Style of commentary to provide */
    commentaryStyle: CommentaryStyle;
    /** Custom prompt for commentary (when style is 'custom') */
    customCommentaryPrompt: string;
}

/**
 * Plugin data structure for storage
 *
 * Extends settings with optional model cache for persisting fetched model data
 * across plugin reloads.
 */
export interface FreewritingCleanupData extends FreewritingCleanupSettings {
    /** Cached model list with timestamp */
    modelCache?: ModelCache;
}

/**
 * Anthropic API message format
 *
 * Represents a single message in the conversation with Claude.
 */
export interface AnthropicMessage {
    /** Message sender role */
    role: 'user' | 'assistant' | 'system';
    /** Message content blocks */
    content: Array<{
        /** Content block type */
        type: string;
        /** Text content */
        text: string;
    }>;
}

/**
 * Anthropic API request payload
 *
 * Structure for messages API requests to Claude.
 */
export interface AnthropicRequest {
    /** Model identifier to use */
    model: string;
    /** Maximum tokens to generate in response */
    max_tokens: number;
    /** Conversation messages */
    messages: AnthropicMessage[];
    /** Optional system prompt */
    system?: Array<{
        /** Content block type */
        type: string;
        /** System prompt text */
        text: string;
    }>;
}

/**
 * Anthropic API response format
 *
 * Structure of the response from Claude messages API.
 */
export interface AnthropicResponse {
    /** Response content blocks */
    content: Array<{
        /** Generated text */
        text: string;
        /** Content type */
        type: 'text';
    }>;
    /** Unique response identifier */
    id: string;
    /** Model used for generation */
    model: string;
    /** Response role (always 'assistant') */
    role: 'assistant';
    /** Reason generation stopped */
    stop_reason: string;
    /** Stop sequence that triggered end (if any) - string | null */
    stop_sequence: string | null;
    /** Response type */
    type: 'message';
    /** Token usage statistics */
    usage: {
        /** Input tokens consumed */
        input_tokens: number;
        /** Output tokens generated */
        output_tokens: number;
    };
}

/**
 * Result of a text cleanup operation
 *
 * Contains the processed text along with metadata about the operation.
 */
export interface CleanupResult {
    /** Original freewriting text */
    originalText: string;
    /** Cleaned up text */
    cleanedText: string;
    /** Optional AI commentary on the writing */
    commentary?: string;
    /** Timestamp of cleanup operation */
    timestamp: Date;
    /** Model used for cleanup */
    model: string;
    /** Token usage for the operation */
    tokensUsed: {
        /** Input tokens */
        input: number;
        /** Output tokens */
        output: number;
    };
    /** Duration of the cleanup operation in milliseconds */
    duration: number;
}

/**
 * Model information from Anthropic API
 *
 * Metadata about an available Claude model.
 */
export interface ModelInfo {
    /** Model identifier */
    id: string;
    /** Human-readable model name */
    display_name: string;
    /** Model creation timestamp */
    created_at: string;
    /** Model type */
    type: string;
}

/**
 * Response from models list API
 *
 * Contains array of available models with pagination metadata.
 */
export interface ModelsListResponse {
    /** Array of model information */
    data: ModelInfo[];
    /** ID of first model in list (null when data is empty) */
    first_id: string | null;
    /** Whether more models are available */
    has_more: boolean;
    /** ID of last model in list (null when data is empty) */
    last_id: string | null;
}

/**
 * Cached model data
 *
 * Stores fetched models with timestamp for TTL-based cache invalidation.
 */
export interface ModelCache {
    /** Cached model list */
    models: ModelInfo[];
    /** Unix timestamp when cache was populated */
    fetchedAt: number;
}

/**
 * Fallback model list
 *
 * Hardcoded list of Claude models used when API is unavailable or API key
 * is not configured. Provides a baseline set of models for the settings UI.
 */
export const ANTHROPIC_MODELS: readonly string[] = [
    'claude-opus-4-1-20250805',
    'claude-opus-4-20250514',
    'claude-sonnet-4-20250514',
    'claude-3-7-sonnet-latest',
    'claude-3-5-haiku-latest',
    'claude-3-haiku-20240307'
];

/**
 * Available commentary style options
 *
 * Defines the preset styles users can choose for AI commentary on their writing.
 */
export const COMMENTARY_STYLES = [
    'constructive',
    'encouraging',
    'analytical',
    'brief',
    'custom'
] as const;

/**
 * Commentary style type
 *
 * Union type of all available commentary styles.
 */
export type CommentaryStyle = typeof COMMENTARY_STYLES[number];

/**
 * Preset commentary prompts
 *
 * Maps each non-custom commentary style to its corresponding prompt text.
 * These prompts guide Claude in providing the appropriate type of feedback.
 */
export const COMMENTARY_PRESETS: Record<Exclude<CommentaryStyle, 'custom'>, string> = {
    constructive: 'Provide balanced feedback on this freewriting, noting strengths and areas for development. Consider the flow of ideas, creativity, and any interesting themes that emerged.',
    encouraging: 'Offer positive, supportive observations about this freewriting session. Focus on what worked well, creative insights, and encouraging the writer to continue exploring these ideas.',
    analytical: 'Analyze the writing structure, themes, and patterns in this freewriting. Look at the progression of thoughts, recurring concepts, and the overall coherence of ideas.',
    brief: 'Give 2-3 concise observations about this freewriting session. Keep it short but insightful.'
};

/**
 * Anthropic API limits
 *
 * Constants defining the maximum input/output sizes for Claude API requests.
 * Used for validation before making API calls.
 */
export const ANTHROPIC_LIMITS = {
    /** Maximum input tokens */
    MAX_TOKENS: 200000,
    /** Maximum input characters */
    MAX_CHARACTERS: 680000,
    /** Default maximum output tokens per request */
    DEFAULT_MAX_OUTPUT_TOKENS: 4000
} as const;