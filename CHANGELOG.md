# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
- **Command**: "Clean Up Freewriting" command accessible via Command Palette
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

[Unreleased]: https://github.com/alexanderkucera/obsidian-freewriting-cleanup/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/alexanderkucera/obsidian-freewriting-cleanup/releases/tag/v1.0.0