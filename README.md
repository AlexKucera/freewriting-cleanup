# Freewriting Cleanup

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/AlexKucera/freewriting-cleanup?color=blue)](https://github.com/AlexKucera/freewriting-cleanup/releases)
[![License: MIT](https://img.shields.io/github/license/AlexKucera/freewriting-cleanup?color=yellow)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/github/downloads/AlexKucera/freewriting-cleanup/total?color=green)](https://github.com/AlexKucera/freewriting-cleanup/releases)
[![CodeRabbit Reviews](https://img.shields.io/coderabbit/prs/github/AlexKucera/freewriting-cleanup)](https://coderabbit.ai/)
![](https://img.shields.io/badge/mobile_supported-green?label=obsidian&labelColor=purple)

Transform your messy freewriting into polished prose using AI. Clean up typos, improve grammar, and format your stream-of-consciousness writing into readable paragraphs with a single command.

## Table of Contents

- [Key Features](#key-features)
- [Why This Plugin?](#why-this-plugin)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Commands](#commands)
- [Settings](#settings)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Key Features

- **🤖 AI-Powered Cleanup**: Uses Anthropic's Claude models to intelligently clean up freewriting
- **⚡ One-Click Processing**: Select text and run a single command to transform your writing
- **🎯 Smart Formatting**: Converts stream-of-consciousness into proper paragraphs
- **📝 Typo Correction**: Fixes spelling and grammar errors while preserving your voice
- **💬 AI Commentary**: Optional thoughtful feedback on your freewriting session and ideas
- **📱 Cross-Platform**: Works on both desktop and mobile Obsidian
- **🔑 API Key Testing**: Built-in connectivity testing with detailed feedback
- **🔧 Configurable**: Customize the AI's cleanup behavior to match your needs

## Why This Plugin?

Freewriting is a powerful technique for overcoming writer's block and generating ideas, but the resulting text is often messy, full of typos, and poorly formatted. This plugin bridges the gap between raw creative output and polished writing by:

- **Preserving Your Voice**: The AI cleans up technical issues without changing your writing style
- **Saving Time**: No more manual proofreading and reformatting of freewriting sessions
- **Maintaining Flow**: Stay in creative mode without switching to editing mindset
- **Seamless Integration**: Works within your existing Obsidian workflow

Transform your "brain dump" into readable content without losing the spontaneity and creativity that makes freewriting valuable.

## Perfect Plugin Combination

This plugin works exceptionally well with other freewriting tools to create a complete writing workflow:

### 🎯 [Freewriting Prompts](https://github.com/AlexKucera/freewriting-prompts)
Generate AI-powered writing prompts to spark your creativity, then use Freewriting Cleanup to polish the results. The perfect one-two punch for overcoming writer's block:
1. **Generate inspiration** with creative prompts
2. **Write freely** without worrying about mistakes
3. **Clean up the output** with this plugin

### 📝 [Digital Paper](https://github.com/danferns/digital-paper-obsidian-plugin)
Write without the ability to delete or edit - just like pen on paper. Perfect for true freewriting sessions:
1. **Enable Digital Paper mode** to disable all delete functions (backspace, delete key, Ctrl+X)
2. **Write continuously** without stopping to edit or second-guess yourself
3. **Clean up afterwards** using Freewriting Cleanup to polish the unedited output

**Recommended Workflow:**
- Enable Digital Paper mode for uninterrupted freewriting sessions
- Generate prompts with Freewriting Prompts when you need inspiration
- Use Freewriting Cleanup to polish your raw, unedited writing into readable text

## Installation

### Method 1: Community Plugin Store (Recommended)

1. Open **Settings** → **Community Plugins**
2. **Disable Safe Mode** if needed
3. Click **Browse** and search for "Freewriting Cleanup"
4. **Install** and **Enable** the plugin

### Method 2: Manual Installation

1. Go to [GitHub Releases](https://github.com/AlexKucera/freewriting-cleanup/releases)
2. Download the latest `main.js`, `manifest.json`, and `styles.css`
3. Create a folder `{VaultFolder}/.obsidian/plugins/freewriting-cleanup/`
4. Place the downloaded files in this folder
5. Reload Obsidian (`Ctrl/Cmd + R` or restart)
6. Enable the plugin in **Settings** → **Community Plugins**

### Method 3: BRAT (Beta Reviewer's Auto-update Tool)

1. Install the [BRAT plugin](https://github.com/TfTHacker/obsidian42-brat)
2. Add this repository: `https://github.com/AlexKucera/freewriting-cleanup`
3. Enable the plugin after installation

## Quick Start

### 1. Get Your Anthropic API Key

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create an account or sign in
3. Generate an API key from the dashboard
4. Copy the key (starts with `sk-ant-`)

### 2. Configure the Plugin

1. Go to **Settings** → **Community Plugins** → **Freewriting Cleanup**
2. Paste your API key in the **Anthropic API Key** field
3. Click **Test Connection** to verify it works
4. Adjust other settings as desired

### 3. Clean Up Your Writing

1. **Select** the freewriting text you want to clean up
2. Use `Ctrl/Cmd + P` → "Clean up text"
3. The selected text will be replaced with the cleaned-up version
4. Review and make any final adjustments

## Configuration

### API Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| **API Key** | Your Anthropic API key | _(required)_ |
| **Model** | Claude model to use | claude-3-5-haiku-latest |

### Cleanup Behavior

| Setting | Description | Default |
|---------|-------------|---------|
| **System Prompt** | Instructions for how AI should clean up text | _(customizable)_ |
| **Preserve Style** | Keep the author's writing voice | Yes |
| **Fix Grammar** | Correct grammatical errors | Yes |
| **Format Paragraphs** | Structure into readable paragraphs | Yes |

### AI Commentary

| Setting | Description | Default |
|---------|-------------|---------|
| **Enable Commentary** | AI provides feedback on your writing | Disabled |
| **Commentary Style** | Type of feedback to receive | Constructive |
| **Custom Prompt** | Personalized commentary instructions | _(when using custom style)_ |

**Commentary Styles:**
- **Constructive**: Balanced feedback noting strengths and areas for development
- **Encouraging**: Positive, supportive observations focusing on what worked well
- **Analytical**: Analysis of writing structure, themes, and thought patterns
- **Brief**: 2-3 concise but insightful observations
- **Custom**: Use your own prompt for personalized feedback

## Commands

### Clean up text

The main command that transforms your selected text:

1. **Select** the freewriting text in your note
2. **Run** the command via Command Palette (`Ctrl/Cmd + P`)
3. **Wait** for the AI to process your text
4. **Review** the cleaned-up result that replaces your selection

**Processing Steps:**
- Fixes spelling and typos
- Corrects grammar while preserving voice
- Structures text into coherent paragraphs
- Maintains the original meaning and style
- Optionally provides thoughtful commentary on your writing

**What You Get:**
- **Cleaned Text**: Your original text with errors fixed and proper formatting
- **AI Commentary** (if enabled): Insightful feedback about your writing session, including:
  - Observations about your thought patterns and creativity
  - Analysis of themes and ideas that emerged
  - Encouragement and suggestions for further exploration
  - Constructive feedback on your writing flow

**Use Cases:**
- Cleaning up morning pages or stream-of-consciousness writing
- Preparing freewriting for sharing or publication
- Converting voice-to-text output into readable prose
- Processing timed writing exercises
- Getting feedback on your creative process and ideas
- Understanding patterns in your thinking and writing style

## Settings

### Advanced Features

- **Test API Key**: Verify your connection with detailed feedback including:
  - Response time
  - Token usage
  - Model confirmation
  - Specific error messages for troubleshooting

- **Custom System Prompt**: Tailor the AI's behavior to your specific needs:
  - Adjust the level of editing (light touch vs. heavy revision)
  - Specify formatting preferences
  - Set tone and style guidelines

### Supported Models

- claude-3-haiku-20240307 (fastest, most cost-effective)
- claude-3-sonnet-20240229 (balanced performance)
- claude-3-opus-20240229 (highest quality)
- claude-3-5-sonnet-20241022 (latest sonnet)
- claude-3-5-haiku-20241022 (latest haiku)

## Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| **"API key is required"** | Enter your Anthropic API key in settings |
| **"No text selected"** | Select the text you want to clean up before running the command |
| **"Network error"** | Check internet connection and API key validity |
| **"Rate limit exceeded"** | Wait a moment and try again, or upgrade your Anthropic plan |

### Error Messages

The plugin provides detailed error messages for different scenarios:

- **401 Unauthorized**: Invalid API key
- **403 Forbidden**: Account or billing issues
- **429 Rate Limited**: Too many requests
- **500 Server Error**: Anthropic service issues
- **Network Error**: Connection problems

### Debug Steps

1. **Test API Key**: Use the "Test Connection" button in settings
2. **Check Selection**: Ensure you have text selected before running the command
3. **Check Console**: Open Developer Tools (F12) for detailed error logs
4. **Verify Settings**: Ensure all required fields are filled
5. **Restart Plugin**: Disable and re-enable the plugin

### Getting Help

- **Issues**: Report bugs on [GitHub Issues](https://github.com/alexanderkucera/obsidian-freewriting-cleanup/issues)
- **Discussions**: Ask questions in [GitHub Discussions](https://github.com/alexanderkucera/obsidian-freewriting-cleanup/discussions)

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/alexanderkucera/obsidian-freewriting-cleanup.git
cd obsidian-freewriting-cleanup

# Install dependencies
npm install

# Start development server
npm run dev
```

### Project Structure

```
freewriting-cleanup/
├── api/
│   └── anthropicClient.ts    # Anthropic API integration
├── commands/
│   └── cleanupCommand.ts     # Text cleanup command
├── services/
│   └── cleanupService.ts     # Cleanup processing service
├── main.ts                   # Plugin entry point
├── settings.ts               # Settings interface
└── types.ts                  # Type definitions
```

### Build Commands

```bash
npm run dev      # Development with file watching
npm run build    # Production build with type checking
npm run version  # Version bump and manifest update
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Follow** TypeScript and ESLint conventions
4. **Test** your changes thoroughly
5. **Commit** with descriptive messages
6. **Submit** a Pull Request

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Support

If you find this plugin helpful, consider supporting its development:

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/babylondreams)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-F16061?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/babylondreams)
[![Patreon](https://img.shields.io/badge/Patreon-F96854?style=for-the-badge&logo=patreon&logoColor=white)](https://patreon.com/babylondreams)

## Contact

**Author**: Alexander Kucera
**Website**: [alexanderkucera.com](https://alexanderkucera.com)
**GitHub**: [@AlexKucera](https://github.com/AlexKucera)

---

*Transform your freewriting into polished prose! ✍️✨*
