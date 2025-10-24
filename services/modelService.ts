// ABOUTME: Service for managing Claude model list from Anthropic API
// ABOUTME: Handles fetching, caching with 24-hour TTL, and fallback to hardcoded list

import { Notice } from 'obsidian';
import { AnthropicClient } from '../api/anthropicClient';
import { ModelInfo, ModelCache, ANTHROPIC_MODELS } from '../types';

/**
 * Simplified model option for UI display
 */
export interface ModelOption {
    /** Model identifier used in API requests */
    id: string;
    /** User-friendly display name for dropdowns */
    displayName: string;
}

/**
 * Service for managing available Claude models
 *
 * Fetches model lists from the Anthropic API with 24-hour caching to minimize
 * API calls. Falls back to hardcoded model list when API is unavailable or
 * API key is not configured. This implementation ensures the UI always has
 * model options available even during offline use or before API key setup.
 */
export class ModelService {
    private anthropicClient: AnthropicClient;
    private modelCache: ModelCache | null = null;
    private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
    private lastErrorNoticeTime = 0;
    private readonly ERROR_NOTICE_THROTTLE_MS = 60 * 1000; // 1 minute

    /**
     * Creates a new model service
     *
     * @param anthropicClient - Anthropic API client for fetching models
     */
    constructor(anthropicClient: AnthropicClient) {
        this.anthropicClient = anthropicClient;
    }

    /**
     * Converts ModelOption to ModelInfo format
     *
     * Helper to maintain consistent shape when caching fallback models.
     * Keeps the mapping logic in one place for easier maintenance.
     *
     * @param opt - Model option to convert
     * @returns ModelInfo with empty metadata fields
     */
    private toModelInfo(opt: ModelOption): ModelInfo {
        return {
            id: opt.id,
            display_name: opt.displayName,
            created_at: '',
            type: 'model'
        };
    }

    // MARK: - Public Methods

    /**
     * Gets available models with caching and fallback logic
     *
     * Returns models from cache if valid (< 24 hours old), otherwise fetches
     * fresh data from the API. Automatically falls back to hardcoded model list
     * if API key is missing or API request fails. This ensures the settings UI
     * always has model options available.
     *
     * @returns Array of model options for UI display
     */
    async getAvailableModels(): Promise<ModelOption[]> {
        // Check if we have a valid cache
        if (this.isCacheValid() && this.modelCache) {
            return this.formatModels(this.modelCache.models);
        }

        // If no API key, immediately return and cache fallback (no Notice needed)
        if (!this.anthropicClient.validateApiKey()) {
            return this.cacheFallbackModels();
        }

        // Try to fetch from API
        try {
            const response = await this.anthropicClient.fetchModels();
            this.updateCache(response.data);
            return this.formatModels(response.data);
        } catch (error) {
            console.error('Failed to fetch models from API:', error);
            this.showThrottledErrorNotice();
            return this.cacheFallbackModels();
        }
    }

    /**
     * Forces a refresh of the model list from the API
     *
     * Bypasses cache and fetches fresh model data from Anthropic. Used when
     * the user changes their API key or manually requests a refresh. Falls back
     * to hardcoded models if the API is unavailable.
     *
     * @returns Array of model options for UI display
     */
    async refreshModels(): Promise<ModelOption[]> {
        // If no API key, immediately return and cache fallback
        if (!this.anthropicClient.validateApiKey()) {
            return this.cacheFallbackModels();
        }

        try {
            const response = await this.anthropicClient.fetchModels();
            this.updateCache(response.data);
            return this.formatModels(response.data);
        } catch (error) {
            console.error('Failed to refresh models from API:', error);
            this.showThrottledErrorNotice();
            return this.cacheFallbackModels();
        }
    }

    /**
     * Loads model cache from plugin data
     *
     * Restores previously cached model data when the plugin initializes.
     * This allows the plugin to avoid an API call on startup if cache is
     * still valid.
     *
     * @param cache - Cached model data from plugin storage
     */
    loadCache(cache: ModelCache | null): void {
        this.modelCache = cache;
    }

    /**
     * Gets current cache for persisting to plugin data
     *
     * @returns Current model cache or null if no cache exists
     */
    getCache(): ModelCache | null {
        return this.modelCache;
    }

    /**
     * Clears the cache to force fresh fetch on next request
     *
     * Used for testing or when manual refresh is needed
     */
    clearCache(): void {
        this.modelCache = null;
    }

    /**
     * Gets fallback model options for UI components
     *
     * Public API that returns the hardcoded model list formatted as
     * ModelOption array. Used by settings UI when API is unavailable.
     *
     * @returns Array of hardcoded model options
     */
    getFallbackOptions(): ModelOption[] {
        return this.getFallbackModels();
    }

    // MARK: - Private Methods

    /**
     * Caches fallback models as ModelInfo for consistency
     *
     * Helper that retrieves fallback models and updates the cache with them
     * converted to ModelInfo format. This consolidates the common pattern of
     * falling back to hardcoded models when the API is unavailable.
     *
     * @returns Array of fallback model options
     */
    private cacheFallbackModels(): ModelOption[] {
        const fallback = this.getFallbackModels();
        this.updateCache(fallback.map(f => this.toModelInfo(f)));
        return fallback;
    }

    /**
     * Shows throttled error notice for API failures
     *
     * Prevents spamming user with error notices when API is persistently down.
     * Only shows notice once per minute to avoid notification fatigue.
     */
    private showThrottledErrorNotice(): void {
        const now = Date.now();
        if (now - this.lastErrorNoticeTime > this.ERROR_NOTICE_THROTTLE_MS) {
            new Notice('Fetching current models failed. Using hardcoded fallback list.');
            this.lastErrorNoticeTime = now;
        }
    }

    /**
     * Checks if the current cache is still valid
     *
     * Cache is considered valid if it exists and is less than 24 hours old.
     * This implementation reduces unnecessary API calls while keeping model
     * data reasonably current.
     *
     * @returns True if cache exists and is within TTL
     */
    private isCacheValid(): boolean {
        if (!this.modelCache) {
            return false;
        }

        const now = Date.now();
        const age = now - this.modelCache.fetchedAt;
        return age < this.CACHE_TTL_MS;
    }

    /**
     * Updates cache with new model data
     *
     * Stores fetched models along with current timestamp for TTL tracking.
     *
     * @param models - Array of model information from API
     */
    private updateCache(models: ModelInfo[]): void {
        this.modelCache = {
            models,
            fetchedAt: Date.now()
        };
    }

    /**
     * Formats ModelInfo array to ModelOption array for dropdowns
     *
     * Converts API model data to simplified format for UI display. Uses
     * display_name from API for user-friendly model names. Results are
     * sorted alphabetically for consistent UX regardless of API ordering.
     *
     * @param models - Array of model information from API
     * @returns Formatted and sorted model options
     */
    private formatModels(models: ModelInfo[]): ModelOption[] {
        return models
            .map(model => ({
                id: model.id,
                displayName: model.display_name
            }))
            .sort((a, b) => a.displayName.localeCompare(b.displayName));
    }

    /**
     * Gets fallback models from hardcoded list
     *
     * Returns the static model list defined in types.ts, formatted as
     * ModelOption array. Used when API is unavailable or before API key
     * is configured.
     *
     * @returns Array of hardcoded model options
     */
    private getFallbackModels(): ModelOption[] {
        return ANTHROPIC_MODELS.map(id => ({
            id,
            displayName: id
        }));
    }
}
