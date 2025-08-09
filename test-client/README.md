# Slack MCP Server Test Client

Comprehensive test suite for the Slack MCP Server with real Slack data integration.

## Overview

This test client provides **2 focused test suites**:

1. **Connection & Tool Listing** - Verifies MCP server connectivity and tool enumeration
2. **Comprehensive Tool Testing** - Tests all tools with real Slack data and validation

## Quick Start

### 1. Configure Test Data

Update `src/test-config.ts` with your real Slack workspace data:

```typescript
export const TEST_CONFIG: TestConfig = {
  channels: {
    public: {
      id: "C1234567890", // ← Replace with real channel ID
      name: "general",
      description: "General discussion channel for testing"
    }
  },
  users: {
    test_user: {
      id: "U1234567890", // ← Replace with real user ID
      name: "testuser",
      email: "test@example.com"
    }
  },
  messages: {
    sample_thread: {
      channel_id: "C1234567890", // ← Same as channel above
      thread_ts: "1234567890.123456", // ← Replace with real thread timestamp
      description: "Sample thread for testing replies functionality"
    },
    search_queries: {
      simple: "hello", // ← Search term that exists in your workspace
      advanced: "from:@testuser has:link",
      channel_specific: "meeting notes"
    }
  }
  // ... other config
};
```

### 2. Set Environment Variables

```bash
# Required Slack tokens
export SLACK_XOXC_TOKEN="xoxc-your-cookie-token"
export SLACK_XOXD_TOKEN="xoxd-your-d-token"

# Optional: Environment overrides (alternative to updating test-config.ts)
export TEST_CHANNEL_ID="C1234567890"
export TEST_USER_ID="U1234567890" 
export TEST_THREAD_TS="1234567890.123456"
```

### 3. Run Tests

```bash
# Run all test suites (recommended)
npm test

# Run specific test suite
npm run test:connection  # Connection and tool listing only
npm run test:tools       # Comprehensive tool testing only
npm run test:all         # All test suites (same as npm test)
```

## Test Suites

### Suite 1: Connection & Tool Listing

**File:** `src/test-connection.ts`

**Tests:**
- ✅ MCP server connection and responsiveness
- ✅ Tool listing and completeness validation
- ✅ Tool categorization and schema validation
- ✅ Critical tool schema structure verification

**Run:** `npm run test:connection`

### Suite 2: Comprehensive Tool Testing

**File:** `src/test-all-tools.ts`

**Tests:**
- 🔧 **Basic Tools:** `ping`, `echo`
- 📊 **Data Retrieval:** `get_thread_replies`, `list_workspace_channels`, `list_workspace_users`
- 🔍 **Search Tools:** `search_channel_messages`, `search_messages`
- 💬 **Messaging Tools:** `post_message`, `post_thread_reply`, `update_message`, `delete_message` (schema validation only)
- 🧵 **Thread Management:** `create_thread`, `resolve_thread`, `archive_thread` (schema validation only)
- 🔄 **Thread Workflow:** `promote_thread`, `watch_thread`, etc. (schema validation only)
- ⚙️  **System Tools:** `get_server_status`, `list_available_tools`, `get_performance_metrics`

**Run:** `npm run test:tools`

## Test Configuration

### Real Data Requirements

For meaningful test results, you need:

1. **Valid Slack Tokens** (xoxc/xoxd)
2. **Existing Channel ID** that your tokens can access
3. **Real Thread Timestamp** from a thread in that channel
4. **Valid User ID** from your workspace
5. **Search Terms** that return results in your workspace

### Configuration Methods

#### Method 1: Update test-config.ts (Recommended)
```typescript
// Update the TEST_CONFIG object with your real data
export const TEST_CONFIG: TestConfig = {
  channels: { public: { id: "YOUR_REAL_CHANNEL_ID", ... } },
  // ... other real data
};
```

#### Method 2: Environment Variables
```bash
export TEST_CHANNEL_ID="C1234567890"
export TEST_USER_ID="U1234567890"
export TEST_THREAD_TS="1234567890.123456"
```

### Getting Real Slack Data

To get the required test data from your Slack workspace:

1. **Channel ID:** Right-click on a channel → Copy link → Extract ID from URL
2. **User ID:** Use Slack's API or developer console
3. **Thread Timestamp:** Right-click on a thread message → Copy link → Extract timestamp
4. **Search Terms:** Use terms that exist in your workspace for meaningful results

### Get Slack Tokens

#### Method: Browser DevTools

1. Open Slack in your browser and login to your workspace
2. Open DevTools (F12 or right-click → Inspect)
3. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)

#### Get xoxc Token:
- Navigate to **Local Storage** → `https://app.slack.com`
- Find key `localConfig_v2`
- Look for `"token":"xoxc-..."` in the JSON value
- Copy the token (starts with `xoxc-`)

#### Get xoxd Token:
- Navigate to **Cookies** → `https://app.slack.com`
- Find cookie named `d`
- Copy the value (starts with `xoxd-`)

## Test Output

### Connection Test Example
```
🔄 Starting Connection and Tool Listing Test Suite...

📋 Test Configuration:
   - Test Channel: general (C1234567890)
   - Test User: testuser (U1234567890)
   - Timeout: 30000ms

📦 Found 21 tools:
   1. ping - Basic connectivity test
   2. echo - Echo back the provided message
   3. get_thread_replies - Get replies for a specific thread
   ... (all tools listed)

🏷️  Tool Categories:
   basic: 2 tools (ping, echo)
   data: 3 tools (get_thread_replies, list_workspace_channels, list_workspace_users)
   search: 2 tools (search_channel_messages, search_messages)
   ... (all categories)

📊 Test Results Summary:
✅ MCP Server Connection (45ms)
✅ Server Responsiveness (Ping) (12ms)  
✅ Tool Listing Completeness (8ms)
✅ Tool Categorization (3ms)
✅ Critical Tool Schema Validation (15ms)

Summary: 5/5 tests passed
🏁 Connection and Tool Listing Test Suite PASSED
```

### Comprehensive Tool Test Example
```
🚀 Starting Comprehensive Tool Testing Suite...

🔧 Testing Basic Tools...
✅ ping - Basic ping test (23ms)
✅ echo - Basic echo test (18ms)

📊 Testing Data Retrieval Tools...
✅ get_thread_replies - Get thread replies with real thread data (156ms)
✅ list_workspace_channels - List workspace channels (89ms)
✅ list_workspace_users - List workspace users (134ms)

🔍 Testing Search Tools...
✅ search_channel_messages - Search messages in specific channel (198ms)
✅ search_messages - Advanced message search across workspace (176ms)

... (all tool categories tested)

📈 Overall Summary: 18/18 tests passed
🏁 Comprehensive Tool Testing Suite PASSED
```

## Architecture

### File Structure
```
test-client/
├── src/
│   ├── test-config.ts      # Test data configuration
│   ├── test-connection.ts  # Connection & tool listing tests
│   ├── test-all-tools.ts   # Comprehensive tool tests
│   └── run-tests.ts        # Test runner
├── dist/                   # Compiled JavaScript
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

### Design Principles

1. **Real Data Testing** - Uses actual Slack workspace data for meaningful results
2. **Comprehensive Coverage** - Tests all tools with proper validation
3. **Safe Testing** - Messaging/thread tools use schema validation (dry run) to avoid workspace spam
4. **Clear Results** - Structured output with detailed success/failure reporting
5. **Easy Configuration** - Simple config file with environment variable overrides

## Security Notes

- **Never commit tokens** - Keep SLACK_XOXC_TOKEN and SLACK_XOXD_TOKEN secure
- **Use dedicated test workspace** if possible
- **Test in safe channels only** - avoid important channels
- **Revoke tokens** when testing is complete
- **Monitor API usage** to avoid rate limits

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   ```
   ❌ Slack authentication required. Please set SLACK_XOXC_TOKEN and SLACK_XOXD_TOKEN environment variables.
   ```
   **Solution:** Set the required Slack tokens

2. **Invalid Channel/Thread Data**
   ```
   ❌ Failed to get thread replies: channel_not_found
   ```
   **Solution:** Update test-config.ts with valid channel IDs and thread timestamps

3. **Network/API Issues**
   ```
   ❌ Tool execution failed: Request timeout
   ```
   **Solution:** Check network connectivity and Slack API status

4. **Build Issues**
   ```
   ❌ Test files not found. Building tests...
   ```
   **Solution:** The test runner automatically builds tests, but you can manually run `npm run build`

---

**⚠️ Remember**: This is for development testing only. Never use in production with user tokens.
