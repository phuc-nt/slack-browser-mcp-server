# Slack MCP Server

> **AI meets Slack** - Connect AI assistants to your Slack workspace with interactive messaging support

[![Tools](https://img.shields.io/badge/Tools-12%20Production-blue)](#features)
[![Block Kit](https://img.shields.io/badge/Block%20Kit-Interactive%20Messaging-orange)](#block-kit-support)
[![License](https://img.shields.io/badge/License-MIT-green)](#license)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-green)](#production-status)

## 🚀 What is this?

**Slack MCP Server** enables AI assistants like **Claude**, **Cline**, **Cursor**, and other MCP-compatible tools to interact with Slack workspaces using **browser tokens** - featuring **Block Kit interactive messaging**, advanced search capabilities, and enterprise-ready architecture. No app installation or admin approval needed.

## ✨ Features

### 🔧 **12 Production Tools:**

- **Interactive Messaging** (6): post_message, update_message, delete_message, react_to_message, **post_message_blocks**, **update_message_blocks**
- **Data Retrieval** (4): get_thread_replies, list_workspace_channels, list_workspace_users, get_user_profile
- **Advanced Search** (2): search_messages (50+ query patterns + AI workflows), search_files (with custom query support for flexible thread collection)

### 🎯 **Key Capabilities:**

- ✅ **Browser Token Authentication** - No app installation or admin approval needed
- ✅ **Block Kit Interactive Messaging** - Rich content with buttons, forms, dashboards, and workflows
- ✅ **Advanced Search** - 50+ comprehensive query patterns, AI-optimized synthesis workflows, flexible thread collection

## 🚀 Quick Start

### 📦 Install from NPM (Recommended)

```bash
npm install -g slack-browser-mcp-server
```

**📖 [Complete Installation Guide](INSTALL.md)** - Follow the step-by-step setup guide

## 💡 Usage Examples

**Progress Summary & Block Kit Report:**

```
Human: Summarize the progress from the last 3 days in the "engineering" channel, write a Block Kit report, and send it to "manager"

AI Assistant: I'll help you create a progress summary report. Here's my plan:
□ Use search_messages to find recent updates in #engineering channel
□ Use get_thread_replies to get detailed context from important discussions
□ Use get_user_profile to get manager's user ID
□ Use post_message_blocks to create and send a structured Block Kit report
```

**Thread Analysis & Response Guidance:**

```
Human: Summarize thread "1754405258.272689" and tell me how I should respond

AI Assistant: I'll analyze this thread and provide response guidance:
□ Use get_thread_replies to retrieve all messages in the thread
□ Review participants, timeline, and key discussion points
□ Analyze conversation context and sentiment
□ Provide summary and suggest appropriate response options
```

**Topic Discovery & Information Synthesis:**

```
Human: Find where people are discussing "deployment issues" and provide a comprehensive summary

AI Assistant: I'll search and synthesize deployment discussions across your workspace:
□ Use search_messages to find "deployment issues" across all channels
□ Use get_thread_replies to get full context from relevant threads
□ Use list_workspace_channels to identify which teams are involved
□ Compile comprehensive summary with key issues, solutions, and participants
```

## 🛠️ Tech Stack

- **TypeScript** - Type-safe development with strict mode
- **Node.js** - Runtime environment (16.x+)
- **MCP Protocol** - Model Context Protocol for AI integration
- **Slack APIs** - Native Slack Web API integration
- **Block Kit** - Interactive messaging framework

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**🎉 Connect your AI assistant to Slack with full interactive messaging support!**
