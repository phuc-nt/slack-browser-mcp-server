# Slack MCP Server Installation Guide

> **Production-Ready Slack Integration** - Connect Claude to Slack without app permissions

## System Requirements

- macOS 10.15+ or Windows 10+
- Node.js 18+ (for running the MCP server)
- Slack workspace access
- Claude Desktop (recommended MCP client)

## Installation

### Prerequisites Check

Verify Git and Node.js are installed:

```bash
git --version
node --version
npm --version
```

### Step 1: Clone Repository

```bash
git clone https://github.com/phuc-nt/slack-browser-mcp-server.git
cd slack-browser-mcp-server
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Build the Project

```bash
npm run build
```

## Step 4: Get Slack Tokens

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

## Step 5: Configure Claude Desktop

Add to your Claude Desktop config file (`~/.config/claude-desktop/config.json`):

```json
{
  "mcpServers": {
    "slack-browser": {
      "command": "node",
      "args": ["/full/path/to/slack-browser-mcp-server/dist/index.js"],
      "env": {
        "SLACK_XOXC_TOKEN": "xoxc-your-extracted-token-here",
        "SLACK_XOXD_TOKEN": "your-d-cookie-value-here",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Find Your Full Path

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

### Test with Claude Desktop

After restarting Claude Desktop, test with questions like:

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
- Ask Claude to search your Slack messages with advanced operators
- Collect thread discussions from specific time periods
- Post messages and manage conversations directly from Claude
- Get comprehensive workspace data and analytics

**Need help?** Check the troubleshooting section or visit our [GitHub repository](https://github.com/phuc-nt/slack-browser-mcp-server) for support.

**Ready to explore?** Start with simple commands like *"List all channels in my workspace"* or *"Search for messages about 'project' from last week"*.

---

**✅ Production-ready Slack integration achieved!**
