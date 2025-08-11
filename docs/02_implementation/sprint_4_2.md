# Sprint 4.2: Simple Data Tools Implementation

> **Phase 4 - Tool-Only Architecture: Data Retrieval Tools**  
> **Duration**: 1 day | **Status**: 📋 PLANNED  
> **Focus**: Implement 5 simple API-based data tools to replace resources

## 📋 Sprint Objectives

1. **Data Tools** - Implement 5 simple data retrieval tools
2. **API Integration** - Use documented working Slack API endpoints
3. **Resource Replacement** - Replace removed resources with tools
4. **Simple Implementation** - No complex pagination or cursors

---

## 🛠️ Tools to Implement

### 1. **list_workspace_channels**
- **Purpose**: Get all accessible channels in workspace
- **API**: Existing workspace channels functionality
- **Parameters**: 
  - `include_private` (boolean, default: false)
  - `include_archived` (boolean, default: false)
  - `limit` (number, max: 1000)

**Implementation:**
```typescript
static createListWorkspaceChannelsTool(): SlackTool {
  return {
    name: 'list_workspace_channels',
    description: 'List all accessible channels in the Slack workspace',
    inputSchema: {
      type: 'object',
      properties: {
        include_private: { type: 'boolean', default: false },
        include_archived: { type: 'boolean', default: false },
        limit: { type: 'number', default: 100, maximum: 1000 }
      }
    },
    handler: async (args) => {
      // Use existing SlackResources.generateWorkspaceChannelsContent()
      const channels = await SlackClient.getChannels(args);
      return { success: true, data: { channels }, count: channels.length };
    }
  };
}
```

### 2. **list_workspace_users**  
- **Purpose**: Get all users in the workspace
- **API**: Existing workspace users functionality
- **Parameters**:
  - `include_bots` (boolean, default: false)
  - `include_deleted` (boolean, default: false)
  - `limit` (number, max: 1000)

### 3. **get_channel_history**
- **Purpose**: Get message history from specific channel
- **API**: Existing channel history functionality
- **Parameters**:
  - `channel_id` (string, required)
  - `limit` (number, default: 20, max: 1000) 
  - `oldest` (string, optional) - timestamp
  - `latest` (string, optional) - timestamp

### 4. **get_thread_replies** 
- **Purpose**: Get replies from a specific thread (replaces broken navigate tools)
- **API**: `conversations.replies` from api-doc.md
- **Parameters**:
  - `channel_id` (string, required)
  - `thread_ts` (string, required) 
  - `limit` (number, default: 100, max: 1000)
  - `inclusive` (boolean, default: true)

**Implementation:**
```typescript
static createGetThreadRepliesTool(): SlackTool {
  return {
    name: 'get_thread_replies',
    description: 'Get all replies from a specific thread',
    inputSchema: {
      type: 'object',
      properties: {
        channel_id: { type: 'string', description: 'Channel ID containing the thread' },
        thread_ts: { type: 'string', description: 'Thread timestamp' },
        limit: { type: 'number', default: 100, maximum: 1000 },
        inclusive: { type: 'boolean', default: true }
      },
      required: ['channel_id', 'thread_ts']
    },
    handler: async (args) => {
      const response = await SlackClient.getConversationReplies({
        channel: args.channel_id,
        ts: args.thread_ts,
        limit: args.limit,
        inclusive: args.inclusive
      });
      
      return {
        success: true,
        data: {
          thread_ts: args.thread_ts,
          channel_id: args.channel_id,
          messages: response.messages || [],
          reply_count: response.messages?.length || 0
        }
      };
    }
  };
}
```

### 5. **search_messages**
- **Purpose**: Search messages across workspace  
- **API**: `search.modules.messages` from api-doc.md
- **Parameters**:
  - `query` (string, required)
  - `channel` (string, optional) - limit to specific channel
  - `user` (string, optional) - limit to specific user
  - `limit` (number, default: 20, max: 100)
  - `after` (string, optional) - messages after date
  - `before` (string, optional) - messages before date

---

## 🏗️ Implementation Structure

### File Organization

**Create new file: `src/tools/data-tools.ts`**
```typescript
import { SlackTool } from '../types/tools.js';
import { SlackClient } from '../slack/client.js';
import { SlackResources } from '../resources/slack.js';

export class DataTools {
  static createListWorkspaceChannelsTool(): SlackTool { /* ... */ }
  static createListWorkspaceUsersTool(): SlackTool { /* ... */ }
  static createGetChannelHistoryTool(): SlackTool { /* ... */ }
  static createGetThreadRepliesTool(): SlackTool { /* ... */ }
  static createSearchMessagesTool(): SlackTool { /* ... */ }
}
```

### Integration Points

1. **Update `src/tools/factory.ts`**:
   - Import DataTools
   - Register 5 new data tools
   - Update tool counts

2. **Update `src/tools/system-tools.ts`**:
   - Add "data" category to tool registry
   - Update total tool count to 26

3. **API Client Extensions**:
   - Ensure `SlackClient.getConversationReplies()` exists
   - Add message search functionality if needed

---

## 📊 Expected Results

### Tool Count Changes

| Category | Before | After | Change |
|----------|--------|-------|--------|
| System Tools | 7 | 7 | No change |
| Messaging | 4 | 4 | No change |
| Thread Management | 4 | 4 | No change |
| Workflow | 6 | 6 | No change |
| **Data Retrieval** | **0** | **5** | **+5** |
| **Total** | **21** | **26** | **+5** |

### Resource Replacement

| Old Resource | New Tool | Status |
|-------------|----------|--------|
| `slack://workspace/channels` | `list_workspace_channels` | ✅ Replaced |
| `slack://workspace/users` | `list_workspace_users` | ✅ Replaced |
| `slack://channels/{id}/history` | `get_channel_history` | ✅ Replaced |
| Thread navigation resources | `get_thread_replies` | ✅ Replaced |
| Search resources | `search_messages` | ✅ Partial |

---

## 🧪 Testing Plan

### Test 1: Data Tool Functionality
```bash
cd test-client && npx tsx -e "
// Test each new data tool
const client = new MCPClient();
await client.callTool('list_workspace_channels', {});
await client.callTool('get_thread_replies', { 
  channel_id: 'C099184U2TU', 
  thread_ts: '1754661651.179039' 
});
"
```

### Test 2: API Integration
- Test with real Slack workspace data
- Verify no invalid_cursor errors
- Confirm simple parameter-based interface

### Test 3: Performance
- Measure response times for each tool
- Ensure <500ms response times
- Verify memory usage stays low

---

## ✅ Success Criteria

### Functional Requirements
- ✅ **5 Data Tools Working** - All tools return valid data
- ✅ **API Integration** - Uses documented Slack API endpoints
- ✅ **Simple Interface** - No complex cursors or pagination
- ✅ **Error Handling** - Graceful handling of API errors

### Technical Requirements  
- ✅ **Performance** - <500ms response times
- ✅ **Type Safety** - Complete TypeScript coverage
- ✅ **Testing** - All tools tested with real data
- ✅ **Documentation** - Clear parameter documentation

### Integration Requirements
- ✅ **Tool Registry** - Proper registration in factory
- ✅ **System Tools** - Updated counts and categories  
- ✅ **Resource Replacement** - Functionality preserved
- ✅ **Clean Architecture** - Well-organized code

---

## 📋 Next Sprint Preview

**Sprint 4.3: Simple Search Tools Implementation**
- Add 4 search tools for comprehensive search functionality
- Target: 30 total tools (26 existing + 4 search)
- Focus on user, channel, and advanced search

---

**🎯 Sprint 4.2 Goal**: Add reliable data retrieval tools using simple API calls, replacing removed resources.

_📅 Created: 2025-08-08 | Status: 📋 PLANNED | Focus: Data Tools_