# Slack MCP Server

> **AI meets Slack** - Connect Claude to your Slack workspace without app permissions

[![Tools](https://img.shields.io/badge/Tools-11%20Production-blue)](#features)
[![License](https://img.shields.io/badge/License-MIT-green)](#license)

## 🚀 What is this?

**Slack MCP Server** lets AI assistants like Claude interact directly with Slack workspaces using **browser tokens** - no app installation or admin approval needed.

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
- ✅ **Claude Desktop Ready** - Full MCP protocol support

## 🚀 Quick Start

**📖 [Complete Installation Guide](INSTALL.md)** - Follow the step-by-step setup guide

### Quick Overview:
1. **Clone & Build** - Get the source code and build the project
2. **Get Slack Tokens** - Extract browser tokens (we provide a browser extension!)
3. **Configure Claude Desktop** - Add MCP server to your config
4. **Start Using** - Ask Claude to interact with your Slack workspace!

## 💡 Usage Examples

**Search Messages:**
```
Human: Find all messages about "deployment" in #general from last week

Claude: I'll use the search_messages tool with time and channel operators.
[Returns relevant deployment discussions with context]
```

**Collect Thread Conversations:**
```
Human: Get all thread discussions from yesterday's incident

Claude: I'll collect threads using collect_threads_by_timerange.
[Returns complete thread conversations with metadata]
```

**Post Messages:**
```
Human: Post "Meeting in 5 minutes" to #team

Claude: I'll send that message to the team channel.
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

**🎉 Connect Claude to Slack in minutes!**