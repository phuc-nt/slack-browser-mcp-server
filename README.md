# Slack MCP Server

> **AI meets Slack** - Connect AI assistants to your Slack workspace without app permissions

[![Tools](https://img.shields.io/badge/Tools-11%20Production-blue)](#features)
[![License](https://img.shields.io/badge/License-MIT-green)](#license)

## 🚀 What is this?

**Slack MCP Server** lets AI assistants like **Cline**, **Cursor**, and other local MCP-compatible tools interact directly with Slack workspaces using **browser tokens** - no app installation or admin approval needed.

## ✨ Features

### 🔧 **11 Production Tools:**

- **Messaging** (4): post_message, update_message, delete_message, react_to_message
- **Data Retrieval** (3): get_thread_replies, list_workspace_channels, list_workspace_users
- **Advanced Search** (2): search_messages, search_files
- **Thread Collection** (1): collect_threads_by_timerange
- **System** (1): server_info

### 🎯 **Key Capabilities:**

- ✅ **Browser Token Auth** - Stealth authentication (no app required)
- ✅ **Advanced Search** - Query operators, file search, AI-optimized
- ✅ **Thread Collection** - Time-range based conversation analysis
- ✅ **MCP Protocol Support** - Compatible with Cline, Cursor, and other local MCP clients

## 🚀 Quick Start

### 📦 Install from NPM (Recommended)

```bash
npm install -g slack-browser-mcp-server
```

**📖 [Complete Installation Guide](INSTALL.md)** - Follow the step-by-step setup guide

### Quick Overview:

1. **Install Package** - `npm install -g slack-browser-mcp-server` OR clone & build from source
2. **Get Slack Tokens** - Extract browser tokens (we provide a browser extension!)
3. **Configure AI Client** - Add MCP server to your Cline, Cursor, or other local MCP client config
4. **Start Using** - Ask your AI assistant to interact with your Slack workspace!

### Quick Configuration

Add to your MCP client config (find your path with `which slack-browser-mcp-server`):

```json
{
  "mcpServers": {
    "phuc-nt/slack-browser-mcp": {
      "disabled": false,
      "timeout": 60,
      "type": "stdio",
      "command": "node",
      "args": ["/opt/homebrew/bin/slack-browser-mcp-server"],
      "env": {
        "SLACK_XOXC_TOKEN": "xoxc-your-extracted-token-here",
        "SLACK_XOXD_TOKEN": "your-d-cookie-value-here",
        "SLACK_TEAM_DOMAIN": "your-workspace-name"
      }
    }
  }
}
```

**⚠️ Replace with your actual path from `which slack-browser-mcp-server`**

## 💡 Usage Examples

**Search Messages:**

```
Human: Find all messages about "deployment" in #general from last week

AI Assistant: I'll use the search_messages tool with time and channel operators.
[Returns relevant deployment discussions with context]
```

**Collect Thread Conversations:**

```
Human: Get all thread discussions from yesterday's incident

AI Assistant: I'll collect threads using collect_threads_by_timerange.
[Returns complete thread conversations with metadata]
```

**Post Messages:**

```
Human: Post "Meeting in 5 minutes" to #team

AI Assistant: I'll send that message to the team channel.
[Message posted successfully]
```

## 🔐 Security

- **Browser tokens** - Extracted from Slack web app (stealth mode)
- **Environment variables** - Never commit tokens to code
- **Rate limiting** - Built-in API protection
- **Local operation** - No external services required

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**🎉 Connect your AI assistant to Slack in minutes!**
