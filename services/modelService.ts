// ABOUTME: Service for managing Claude model list from Anthropic API
// ABOUTME: Handles fetching, caching with 24-hour TTL, and fallback to hardcoded list

import { Notice } from 'obsidian';
import { AnthropicClient } from '../api/anthropicClient';
import { ModelInfo, ModelCache, ANTHROPIC_MODELS } from '../types';

export interface ModelOption {
    id: string;
    displayName: string;
}

export class ModelService {
    private anthropicClient: AnthropicClient;
    private modelCache: ModelCache | null = null;
    private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

    constructor(anthropicClient: AnthropicClient) {
        this.anthropicClient = anthropicClient;
    }

    // MARK: - Public Methods

    /**
     * Get available models with caching and fallback logic
     * Returns models from cache if valid, otherwise fetches from API
     * Falls back to hardcoded list if API fails
     */
    async getAvailableModels(): Promise<ModelOption[]> {
        // Check if we have a valid cache
        if (this.isCacheValid() && this.modelCache) {
            return this.formatModels(this.modelCache.models);
        }

        // Try to fetch from API
        try {
            const response = await this.anthropicClient.fetchModels();
            this.updateCache(response.data);
            return this.formatModels(response.data);
        } catch (error) {
            console.error('Failed to fetch models from API:', error);
            new Notice('Fetching current models failed. Using hardcoded fallback list.');
            return this.getFallbackModels();
        }
    }

    /**
     * Force refresh the model list from API
     * Used when user changes API key
     */
    async refreshModels(): Promise<ModelOption[]> {
        // If no API key, immediately return and cache fallback
        if (!this.anthropicClient.validateApiKey()) {
            const fallback = this.getFallbackModels();
            // Cache fallback models as ModelInfo for consistency
            this.updateCache(fallback.map(f => ({
                id: f.id,
                display_name: f.displayName,
                created_at: '',
                type: 'model'
            } as ModelInfo)));
            return fallback;
        }

        try {
            const response = await this.anthropicClient.fetchModels();
            this.updateCache(response.data);
            return this.formatModels(response.data);
        } catch (error) {
            console.error('Failed to refresh models from API:', error);
            new Notice('Fetching current models failed. Using hardcoded fallback list.');
            const fallback = this.getFallbackModels();
            // Cache fallback models as ModelInfo for consistency
            this.updateCache(fallback.map(f => ({
                id: f.id,
                display_name: f.displayName,
                created_at: '',
                type: 'model'
            } as ModelInfo)));
            return fallback;
        }
    }

    /**
     * Load cache from plugin data
     */
    loadCache(cache: ModelCache | null): void {
        this.modelCache = cache;
    }

    /**
     * Get current cache for saving to plugin data
     */
    getCache(): ModelCache | null {
        return this.modelCache;
    }

    /**
     * Clear the cache (for testing or manual refresh)
     */
    clearCache(): void {
        this.modelCache = null;
    }

    /**
     * Get fallback model options (public API for UI components)
     * Returns hardcoded model list as ModelOption array
     */
    getFallbackOptions(): ModelOption[] {
        return this.getFallbackModels();
    }

    // MARK: - Private Methods

    /**
     * Check if the current cache is still valid (within TTL)
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
     * Update cache with new model data
     */
    private updateCache(models: ModelInfo[]): void {
        this.modelCache = {
            models,
            fetchedAt: Date.now()
        };
    }

    /**
     * Format ModelInfo array to ModelOption array for dropdown
     * Uses display_name if available, otherwise falls back to id
     * Sorted by displayName for consistent UX across cache/API ordering
     */
    private formatModels(models: ModelInfo[]): ModelOption[] {
        return models
            .map(model => ({
                id: model.id,
                displayName: model.display_name || model.id
            }))
            .sort((a, b) => a.displayName.localeCompare(b.displayName));
    }

    /**
     * Get fallback models from hardcoded list
     */
    private getFallbackModels(): ModelOption[] {
        return ANTHROPIC_MODELS.map(id => ({
            id,
            displayName: id
        }));
    }
}
