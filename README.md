# Slack MCP Server

> **AI Assistants meets Slack** - Tích hợp Claude với Slack workspace mà không cần permissions

[![Status](https://img.shields.io/badge/Status-Planning-blue)](#current-status)
[![Phase](https://img.shields.io/badge/Phase-1%20Foundation-orange)](#roadmap)
[![License](https://img.shields.io/badge/License-MIT-green)](#license)

## 🚀 What is this?

**Slack MCP Server** cho phép AI assistants (như Claude) tương tác trực tiếp với Slack workspaces sử dụng **browser tokens** - không cần cài đặt app hay xin phép admin.

### ⚡ Key Features
- 🕵️ **Stealth Mode**: Browser token authentication (xoxc/xoxd)
- 🔧 **MCP Compliant**: Full Model Context Protocol support  
- 💬 **Complete Slack Access**: Read, search, post messages
- ⚡ **High Performance**: Intelligent caching system
- 🖥️ **Claude Desktop Ready**: Seamless integration

## 📊 Current Status

**Phase 1: Foundation** (Aug 5-18, 2025)
- 📋 **Week 1**: Project setup & MCP server core
- 📋 **Week 2**: Tool architecture & development environment

> 🚧 **Project Status**: Planning phase - no code yet  
> 📖 **Start Here**: [docs/START_POINT.md](docs/START_POINT.md)

## 🏗️ Tech Stack

```yaml
Language: TypeScript/Node.js
Protocol: Model Context Protocol (MCP)
Transport: Stdio (Claude Desktop)
Auth: Browser Tokens (xoxc + xoxd)
Performance: Intelligent caching
```

## 📚 Documentation

- **[📍 START HERE](docs/START_POINT.md)** - Project hub & current status
- **[🗺️ Roadmap](docs/01_preparation/project_roadmap.md)** - Phases & timeline
- **[📋 Current Sprint](docs/02_implementation/sprints/sprint_1_1.md)** - Week 1 tasks
- **[🔧 Implementation](docs/00_context/implementation-detail.md)** - Technical specs

## 🚀 Quick Start

### For Users
```bash
# Coming soon - project in development
# Will be: npm install -g slack-mcp-server
```

### For Developers
```bash
# Project chưa exist - follow Sprint 1.1
# See: docs/02_implementation/sprints/sprint_1_1.md
```

## 🎯 Roadmap

| Phase | Duration | Status | Focus |
|-------|----------|--------|-------|
| **1. Foundation** | Aug 5-18 | 📋 Planning | MCP server core |
| **2. Slack Integration** | Aug 19 - Sep 1 | 📋 Planned | Stealth auth & tools |
| **3. Caching & Performance** | Sep 2-15 | 📋 Planned | Intelligent caching |
| **4. Production Ready** | Sep 16-29 | 📋 Planned | Polish & release |

## 🔐 Security Note

This project uses **browser token extraction** - tokens từ localStorage/cookies của Slack web app. Đây là stealth approach để bypass workspace restrictions.

⚠️ **Important**: Never commit tokens to code. Always use environment variables.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

*📅 Updated: 2025-08-05 | 🔄 Status: Project Initialization*
