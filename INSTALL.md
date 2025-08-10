# Slack MCP Server Installation Guide

> **Production-Ready Slack Integration** - Connect AI assistants to Slack without app permissions

## System Requirements

- macOS 10.15+ or Windows 10+
- Node.js 18+ (for running the MCP server)
- Slack workspace access
- Local MCP-compatible client (Cline, Cursor, or other MCP clients that support local stdio)

## Installation Methods

### 🚀 Method 1: NPM Installation (Recommended)

**Quick install from npm registry:**

```bash
npm install -g slack-browser-mcp-server
```

**That's it!** Skip to [Step 2: Get Slack Tokens](#step-2-get-slack-tokens) below.

### 🔧 Method 2: Manual Installation from Source

**For development or customization:**

#### Prerequisites Check

Verify Git and Node.js are installed:

```bash
git --version
node --version
npm --version
```

#### Step 1: Clone Repository

```bash
git clone https://github.com/phuc-nt/slack-browser-mcp-server.git
cd slack-browser-mcp-server
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Build the Project

```bash
npm run build
```

## Step 2: Get Slack Tokens

### Option 1: Browser Extension (Recommended)

Use the **Slack Token Getter** extension for easy token extraction:

1. **Install the extension**: [Slack Token Getter](https://github.com/phuc-nt/slack-token-getter)
2. **Open Slack in your browser** and log in to your workspace
3. **Click the extension icon** - it will automatically extract both tokens
4. **Copy the tokens** directly from the extension popup

### Option 2: Manual Extraction

If you prefer manual extraction:

1. **Open Slack in your browser** and log in to your workspace
2. **Open Browser Developer Tools** (F12 or Cmd+Opt+I)
3. **Extract SLACK_XOXC_TOKEN**:
   - Go to **Application** tab → **Local Storage** → your Slack domain
   - Find key starting with `xoxc-` and copy the value
4. **Extract SLACK_XOXD_TOKEN**:
   - Go to **Application** tab → **Cookies** → your Slack domain
   - Find cookie named `d` and copy the value

## Step 5: Configure Your AI Client

### Find Your Global NPM Installation Path

First, find where npm installed the package globally:

```bash
which slack-browser-mcp-server
```

**Copy this path** - you'll need it for the configuration below.

**Common paths:**

- **macOS (Homebrew):** `/opt/homebrew/bin/slack-browser-mcp-server`
- **macOS (Node.js):** `/usr/local/bin/slack-browser-mcp-server`
- **Linux:** `/usr/local/bin/slack-browser-mcp-server`
- **Windows:** `C:\Users\{username}\AppData\Roaming\npm\slack-browser-mcp-server.cmd`

### MCP Client Configuration

**For Cline, Cursor, and other local MCP clients:**

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

**⚠️ Important:** Replace `/opt/homebrew/bin/slack-browser-mcp-server` with **your actual path** from the `which` command above.

### Alternative: Manual Installation from Source

If you built from source instead of using npm:

```json
{
  "mcpServers": {
    "phuc-nt/slack-browser-mcp": {
      "disabled": false,
      "timeout": 60,
      "type": "stdio",
      "command": "node",
      "args": ["/full/path/to/slack-browser-mcp-server/dist/index.js"],
      "env": {
        "SLACK_XOXC_TOKEN": "xoxc-your-extracted-token-here",
        "SLACK_XOXD_TOKEN": "your-d-cookie-value-here",
        "SLACK_TEAM_DOMAIN": "your-workspace-name"
      }
    }
  }
}
```

### Configuration Parameters Explained

**Required Environment Variables:**

- `SLACK_XOXC_TOKEN`: Your workspace browser token (starts with `xoxc-`)
- `SLACK_XOXD_TOKEN`: Your browser session cookie value (from `d` cookie)
- `SLACK_TEAM_DOMAIN`: Your workspace domain (e.g., if your Slack URL is `https://mycompany.slack.com`, use `mycompany`)

**MCP Server Settings:**

- `disabled`: Set to `false` to enable the server
- `timeout`: Maximum time (seconds) to wait for responses
- `type`: Always use `"stdio"` for MCP client integration

### Supported MCP Clients

This server works with local MCP clients that support stdio transport:

- **✅ Cline** - Use the absolute path configuration above
- **✅ Cursor** - Use the absolute path configuration above
- **✅ Other local MCP clients** - Use the same stdio configuration format
- **❌ Claude Desktop** - Only supports remote MCP servers, not local

### Find Your Full Path (for Option B)

**macOS/Linux:**

```bash
pwd
# Use the output + /dist/index.js
```

**Windows (PowerShell):**

```bash
(Get-Location).Path
# Use the output + \dist\index.js
```

**Example paths:**

- macOS: `/Users/yourname/slack-browser-mcp-server/dist/index.js`
- Windows: `C:\\Users\\YourName\\slack-browser-mcp-server\\dist\\index.js`

## Step 6: Verify Installation

### Test MCP Server Directly

```bash
# From the project directory
node ./dist/index.js
```

You should see output showing 11 tools registered successfully.

### Test Connection with Test Suite

```bash
cd test-client
npm install

# Test connection and tool registration
npx tsx src/test-connection.ts

# Test all tools (optional)
npx tsx src/test-all-tools.ts
```

### Test with Your AI Client

After restarting your AI client (Claude Desktop, Cline, Cursor, etc.), test with questions like:

- "List all channels in my Slack workspace"
- "Search for messages about 'meeting' in the last day"
- "Get thread discussions from the last 24 hours in #general"

## Features Available

After installation, you'll have access to **11 production tools**:

### 🔧 **Messaging Tools (4)**

- `post_message` - Post messages to channels/threads
- `update_message` - Edit existing messages
- `delete_message` - Delete messages
- `react_to_message` - Add emoji reactions

### 📊 **Data Retrieval Tools (3)**

- `get_thread_replies` - Get complete thread conversations
- `list_workspace_channels` - List all accessible channels
- `list_workspace_users` - List workspace members

### 🔍 **Advanced Search Tools (2)**

- `search_messages` - Advanced message search with query operators
  - Channel search: `in:channel_name`
  - User search: `from:@username`
  - Time search: `after:2025-08-01`
  - Content search: `has:link`, `has:attachment`
  - Boolean logic: `AND`, `OR`, `()`, `-`
- `search_files` - Dedicated file and document search

### 🧵 **Thread Collection Tools (1)**

- `collect_threads_by_timerange` - Collect complete thread conversations from specific time periods
  - Perfect for incident analysis, meeting preparation, retrospectives
  - Supports both ISO dates and Unix timestamps
  - Returns complete thread data with metadata

### ⚙️ **System Tools (1)**

- `server_info` - Get server status and performance metrics

---

## 🎉 Installation Complete!

Your Slack MCP Server is now ready with **11 production tools** and **100% test success rate**.

**What you can do now:**

- Ask your AI assistant to search your Slack messages with advanced operators
- Collect thread discussions from specific time periods
- Post messages and manage conversations directly from your AI client
- Get comprehensive workspace data and analytics

**Need help?** Check the troubleshooting section or visit our [GitHub repository](https://github.com/phuc-nt/slack-browser-mcp-server) for support.

**Ready to explore?** Start with simple commands like _"List all channels in my workspace"_ or _"Search for messages about 'project' from last week"_.

---

**✅ Production-ready Slack integration achieved!**
