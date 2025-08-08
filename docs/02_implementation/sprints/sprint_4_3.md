# Sprint 4.3: Simple Search Tools Implementation

> **Phase 4 - Tool-Only Architecture: Search Tools**  
> **Duration**: 1 day | **Status**: 📋 PLANNED  
> **Focus**: Implement 4 simple search tools using documented API endpoints

## 📋 Sprint Objectives

1. **Search Tools** - Implement 4 comprehensive search tools
2. **API-Based** - Use documented working search endpoints
3. **User-Friendly** - Simple parameter-based searching
4. **Complete Coverage** - Users, channels, global, and threads

---

## 🔍 Tools to Implement

### 1. **search_workspace_global**
- **Purpose**: Global search across messages, files, and channels
- **API**: `search.inline` from api-doc.md
- **Parameters**:
  - `query` (string, required) - search query
  - `sort` (string, enum: ['timestamp', 'score'], default: 'score')
  - `limit` (number, default: 20, max: 100)
  - `include_files` (boolean, default: true)
  - `include_messages` (boolean, default: true)

**Implementation:**
```typescript
static createSearchWorkspaceGlobalTool(): SlackTool {
  return {
    name: 'search_workspace_global',
    description: 'Search across all workspace content including messages, files, and channels',
    inputSchema: {
      type: 'object',
      properties: {
        query: { 
          type: 'string', 
          description: 'Search query (supports Slack search syntax)' 
        },
        sort: { 
          type: 'string', 
          enum: ['timestamp', 'score'], 
          default: 'score',
          description: 'Sort results by relevance score or timestamp'
        },
        limit: { 
          type: 'number', 
          default: 20, 
          maximum: 100,
          description: 'Maximum number of results'
        },
        include_files: { type: 'boolean', default: true },
        include_messages: { type: 'boolean', default: true }
      },
      required: ['query']
    },
    handler: async (args) => {
      const results = await SlackClient.searchGlobal({
        query: args.query,
        sort: args.sort,
        count: args.limit,
        include_files: args.include_files,
        include_messages: args.include_messages
      });
      
      return {
        success: true,
        data: {
          query: args.query,
          total_count: results.messages?.total || 0,
          results: results.messages?.matches || [],
          files: results.files?.matches || [],
          search_metadata: {
            sort: args.sort,
            limit: args.limit,
            timestamp: new Date().toISOString()
          }
        }
      };
    }
  };
}
```

### 2. **search_users**
- **Purpose**: Search users by name, email, or profile information
- **API**: User search functionality
- **Parameters**:
  - `query` (string, required) - user search query
  - `limit` (number, default: 20, max: 100)
  - `include_bots` (boolean, default: false)
  - `include_deleted` (boolean, default: false)

### 3. **search_channels**
- **Purpose**: Search channels by name, purpose, or topic
- **API**: Channel search functionality  
- **Parameters**:
  - `query` (string, required) - channel search query
  - `type` (string, enum: ['all', 'public', 'private'], default: 'all')
  - `limit` (number, default: 20, max: 100)
  - `include_archived` (boolean, default: false)

### 4. **search_threads**
- **Purpose**: Simple thread search across workspace
- **API**: Thread search without complex filtering
- **Parameters**:
  - `query` (string, required) - thread search query
  - `channel` (string, optional) - limit to specific channel
  - `limit` (number, default: 10, max: 50)
  - `min_replies` (number, default: 1) - minimum reply count

**Implementation:**
```typescript
static createSearchThreadsTool(): SlackTool {
  return {
    name: 'search_threads',
    description: 'Search for threads containing specific keywords',
    inputSchema: {
      type: 'object',
      properties: {
        query: { 
          type: 'string', 
          description: 'Search query for thread content' 
        },
        channel: { 
          type: 'string', 
          description: 'Limit search to specific channel ID' 
        },
        limit: { 
          type: 'number', 
          default: 10, 
          maximum: 50 
        },
        min_replies: { 
          type: 'number', 
          default: 1,
          description: 'Minimum number of replies required'
        }
      },
      required: ['query']
    },
    handler: async (args) => {
      // Simple thread search implementation
      const searchQuery = args.channel 
        ? `${args.query} in:#${args.channel}`
        : args.query;
        
      const results = await SlackClient.searchMessages({
        query: searchQuery,
        count: args.limit * 2 // Get more results to filter threads
      });
      
      // Filter for messages that are thread parents
      const threads = results.messages?.matches?.filter(msg => 
        msg.reply_count && msg.reply_count >= args.min_replies
      ) || [];
      
      return {
        success: true,
        data: {
          query: args.query,
          channel_filter: args.channel,
          threads: threads.slice(0, args.limit),
          total_found: threads.length,
          search_metadata: {
            min_replies: args.min_replies,
            timestamp: new Date().toISOString()
          }
        }
      };
    }
  };
}
```

---

## 🏗️ Implementation Structure

### File Organization

**Create new file: `src/tools/search-tools.ts`**
```typescript
import { SlackTool } from '../types/tools.js';
import { SlackClient } from '../slack/client.js';
import { logger } from '../utils/logger.js';

export class SearchTools {
  static createSearchWorkspaceGlobalTool(): SlackTool { /* ... */ }
  static createSearchUsersTool(): SlackTool { /* ... */ }
  static createSearchChannelsTool(): SlackTool { /* ... */ }
  static createSearchThreadsTool(): SlackTool { /* ... */ }
}
```

### Integration Points

1. **Update `src/tools/factory.ts`**:
   - Import SearchTools
   - Register 4 new search tools
   - Update tool counts to 30 total

2. **Update `src/tools/system-tools.ts`**:
   - Add "search" category to tool registry
   - Update total tool count to 30
   - Update category descriptions

3. **API Client Extensions**:
   - Ensure search methods exist in SlackClient
   - Add thread filtering capabilities
   - Implement user/channel search if needed

---

## 📊 Expected Results

### Tool Count Changes

| Category | Before | After | Change |
|----------|--------|-------|--------|
| System Tools | 7 | 7 | No change |
| Messaging | 4 | 4 | No change |
| Thread Management | 4 | 4 | No change |
| Workflow | 6 | 6 | No change |
| Data Retrieval | 5 | 5 | No change |
| **Search Tools** | **0** | **4** | **+4** |
| **Total** | **26** | **30** | **+4** |

### Search Capabilities

| Search Type | Tool | Coverage |
|-------------|------|----------|
| Global Content | `search_workspace_global` | Messages, files, channels |
| User Directory | `search_users` | Names, emails, profiles |
| Channel Discovery | `search_channels` | Names, purposes, topics |
| Thread Discovery | `search_threads` | Thread content, replies |

---

## 🧪 Testing Plan

### Test 1: Search Functionality
```bash
cd test-client && npx tsx -e "
// Test each search tool
const client = new MCPClient();

// Global search
await client.callTool('search_workspace_global', { 
  query: 'test', 
  limit: 5 
});

// User search  
await client.callTool('search_users', { 
  query: 'phuc' 
});

// Channel search
await client.callTool('search_channels', { 
  query: 'general' 
});

// Thread search
await client.callTool('search_threads', { 
  query: 'mcp', 
  min_replies: 2 
});
"
```

### Test 2: API Integration
- Test with real search queries
- Verify results format and data
- Confirm no pagination errors

### Test 3: Search Quality
- Test various query types
- Verify filtering works correctly
- Check search result relevance

---

## ✅ Success Criteria

### Functional Requirements
- ✅ **4 Search Tools Working** - All search types functional
- ✅ **Query Processing** - Handles various search queries
- ✅ **Result Filtering** - Proper filtering by parameters
- ✅ **Result Formatting** - Consistent, useful result format

### Technical Requirements
- ✅ **Performance** - Search results in <1s
- ✅ **API Integration** - Uses documented search endpoints
- ✅ **Error Handling** - Graceful handling of search errors
- ✅ **Type Safety** - Complete TypeScript coverage

### User Experience Requirements
- ✅ **Simple Interface** - Easy-to-use search parameters
- ✅ **Relevant Results** - Useful search results
- ✅ **Search Syntax** - Supports Slack search operators
- ✅ **Result Metadata** - Helpful search metadata

---

## 📋 Next Sprint Preview

**Sprint 4.4: Tool-Only Architecture Completion**
- Remove all resources and ResourceRegistry
- Create pure tool-only MCP server
- Complete testing with 30 working tools
- Update documentation

---

**🎯 Sprint 4.3 Goal**: Complete search functionality with 4 reliable search tools using simple API calls.

_📅 Created: 2025-08-08 | Status: 📋 PLANNED | Focus: Search Tools_