// ABOUTME: Custom error types for more robust error handling
// ABOUTME: Provides type-safe error categorization instead of fragile string matching

/**
 * Base error class for plugin-specific errors
 *
 * Provides common foundation for all custom error types in the plugin.
 * Ensures proper error name is set for instanceof checks and debugging.
 */
export class PluginError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
        // Maintains proper prototype chain for instanceof checks
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/**
 * Thrown when API key is missing or invalid
 *
 * Indicates user needs to configure their Anthropic API key in settings.
 */
export class ApiKeyError extends PluginError {}

/**
 * Thrown when text exceeds API character or token limits
 *
 * Indicates selected text is too large to process with current API limits.
 */
export class TextTooLongError extends PluginError {}

/**
 * Thrown when retry attempts are exhausted
 *
 * Indicates the service is temporarily unavailable after multiple retry attempts.
 */
export class ServiceUnavailableError extends PluginError {}

/**
 * Thrown when API response format is invalid or empty
 *
 * Indicates unexpected response structure from the API that cannot be parsed.
 */
export class InvalidResponseError extends PluginError {}

/**
 * Thrown when required configuration is missing
 *
 * Indicates user needs to provide additional configuration (e.g., custom prompt).
 */
export class ConfigurationError extends PluginError {}

/**
 * Thrown when network request fails
 *
 * Indicates connectivity issues or network-level failures.
 */
export class NetworkError extends PluginError {}

/**
 * Thrown when API returns an error status
 *
 * Wraps API error responses with status codes and error details.
 */
export class ApiError extends PluginError {
    constructor(
        message: string,
        public readonly status?: number,
        public readonly responseBody?: string
    ) {
        super(message);
    }
}
