# Test Client - Slack MCP Server Testing

This test client is used for testing the Slack MCP Server with real Slack workspace data during Phase 2 development.

## Setup for Phase 2 Testing

### 1. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your actual Slack tokens:

```bash
cp .env.example .env
```

### 2. Get Your Slack Tokens

#### Method 1: Browser DevTools (Recommended)

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

#### Get Team Domain:

- From your Slack URL: `https://yourteam.slack.com` → use `yourteam`

### 3. Safety Configuration

**IMPORTANT**: Update these safety settings in `.env`:

```env
# Use a dedicated test channel
TEST_CHANNEL_NAME=mcp-testing
ALLOWED_CHANNELS=mcp-testing,bot-experiments

# Enable safe mode
SAFE_MODE=true
```

### 4. Create Test Channel

Create a dedicated channel in your Slack workspace for testing:

1. Create channel: `#mcp-testing` or similar
2. Get the channel ID (right-click channel → Copy link → extract ID from URL)
3. Update `TEST_CHANNEL_ID` in `.env`

## Running Tests

### Complete Test Suite

```bash
# Run all tests
npm run test

# Or run all tests explicitly
npm run test:all
```

### Individual Tests

```bash
# Test MCP server connection
npm run test:connection

# Test all available tools (basic + Slack)
npm run test:tools

# Test all available resources
npm run test:resources
```

### Manual Testing

```bash
# Test MCP connection with real Slack data
npm run test

# Debug mode with verbose logging
LOG_LEVEL=debug npm run test
```

## Security Notes

- **Never commit `.env`** - it contains your actual tokens
- **Use dedicated test workspace** if possible
- **Test in safe channels only** - avoid important channels
- **Revoke tokens** when testing is complete
- **Monitor API usage** to avoid rate limits

## Troubleshooting

### Token Issues

- **Invalid token**: Check if you copied the full token
- **Expired token**: Re-extract from browser (tokens expire)
- **Permission denied**: Ensure your user has required permissions

### Rate Limiting

- Slack has API rate limits (~100 requests/minute)
- Tests include built-in rate limiting
- Use `API_RATE_LIMIT=true` to enable throttling

### Network Issues

- Check your internet connection
- Verify Slack workspace is accessible
- Try with different network if behind corporate firewall

## Development Workflow

1. **Start with auth testing**: Ensure tokens work
2. **Test basic APIs**: channels.list, users.list
3. **Test tools individually**: One tool at a time
4. **Integration testing**: Full workflows
5. **Performance testing**: Large workspace scenarios

---

**⚠️ Remember**: This is for development testing only. Never use in production with user tokens.
