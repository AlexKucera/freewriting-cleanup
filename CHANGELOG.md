# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2025-10-25

### Added
- Dynamic model fetching from Anthropic API with automatic fallback and caching
- Token usage tracking for text cleanup requests
- Debounce mechanism for settings save operations
- Error notice throttling for improved user experience
- Validation for custom commentary style

### Changed
- Improved API error handling with detailed error messages and selective retries
- Enhanced model loading in settings with fallback strategy
- Optimized settings and model cache loading
- Refactored Anthropic model type and list handling
- Enforced display name requirement for model selection
- Updated Anthropic API limits with detailed documentation
- Simplified text selection validation method
- Improved plugin settings loading and command registration
- Enhanced code documentation and structure throughout plugin
- Refactored confirmation modal with better Obsidian integration

### Fixed
- Removed duplicate error notification in cleanup service
- Resolved potential null reference errors in settings
- Handled model changes gracefully when current model becomes unavailable
- Updated ModelsListResponse types to handle empty model lists
- Corrected type definition for stop_sequence parameter
- Improved custom commentary error message clarity
- Removed unnecessary text selection validation check

## [1.0.2] - 2025-09-21

### Security
- Fix innerHTML usage in settings to prevent XSS vulnerabilities
- Replace innerHTML with safe DOM manipulation methods (createEl, appendText)
- Comply with Obsidian security guidelines for plugin development

## [1.0.1] - 2025-09-20

### Changed
- Command name updated from "Clean Up Freewriting" to "Clean up text" (follows Obsidian guidelines)
- Replaced inline JavaScript styles with CSS classes for better theme compatibility
- License information corrected in package.json to match GPL-3.0

### Fixed
- License badge and documentation now correctly show GPL v3 instead of MIT

## [1.0.0] - 2025-09-20

### Added
- Initial release of Freewriting Cleanup plugin
- **AI-Powered Text Cleanup**: Clean up freewriting text using Anthropic's Claude models
- **One-Click Processing**: Select text and run a single command to transform your writing
- **Smart Formatting**: Converts stream-of-consciousness writing into proper paragraphs
- **Typo and Grammar Correction**: Fixes spelling and grammar errors while preserving your voice
- **AI Commentary Feature**: Optional thoughtful feedback on your freewriting session and ideas
  - **Constructive**: Balanced feedback noting strengths and areas for development
  - **Encouraging**: Positive, supportive observations focusing on what worked well
  - **Analytical**: Analysis of writing structure, themes, and thought patterns
  - **Brief**: 2-3 concise but insightful observations
  - **Custom**: Use your own prompt for personalized feedback
- **Command**: "Clean up text" command accessible via Command Palette
- **Settings Configuration**:
  - Anthropic API key configuration
  - Model selection (supports all Claude models)
  - Custom cleanup prompt configuration
  - Commentary preferences and styles
  - API connection testing
- **Cross-Platform Support**: Works on both desktop and mobile Obsidian
- **Configurable AI Behavior**: Customize how the AI cleans up and comments on your text
- **Error Handling**: Comprehensive error messages and troubleshooting support
- **API Integration**: Full integration with Anthropic's Claude API
- **Type Safety**: Complete TypeScript implementation with proper type definitions

### Technical Implementation
- **API Client**: Robust Anthropic API client with error handling and response parsing
- **Cleanup Service**: Orchestrates cleanup operations and manages API calls
- **Command System**: Integration with Obsidian's command palette and editor callbacks
- **Settings Management**: Persistent settings with validation and testing capabilities
- **Modular Architecture**: Clean separation of concerns across services, commands, and API layers

[Unreleased]: https://github.com/alexanderkucera/obsidian-freewriting-cleanup/compare/1.1.0...HEAD
[1.1.0]: https://github.com/alexanderkucera/obsidian-freewriting-cleanup/compare/1.0.2...1.1.0
[1.0.2]: https://github.com/alexanderkucera/obsidian-freewriting-cleanup/compare/1.0.1...1.0.2
[1.0.1]: https://github.com/alexanderkucera/obsidian-freewriting-cleanup/compare/1.0.0...1.0.1
[1.0.0]: https://github.com/alexanderkucera/obsidian-freewriting-cleanup/releases/tag/1.0.0