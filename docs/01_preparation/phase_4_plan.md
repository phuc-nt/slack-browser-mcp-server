# Phase 4: Tool Cleanup & API-Based Implementation Plan

## 🚨 **Issue Analysis from Cline Testing**

### **Working Tools** ✅
- System tools: `ping`, `echo`
- Messaging tools: `post_message`, `post_thread_reply`, `update_message`, `delete_message`
- Thread actions: `resolve_thread`, `archive_thread`

### **Broken Tools** ❌ (invalid_cursor errors)
- `get_thread_context` - Complex cursor-based thread navigation
- `navigate_thread_replies` - Cursor pagination not working with Slack API
- `summarize_thread` - Depends on broken thread context tools
- `get_thread_participants` - Depends on broken thread context tools

### **Root Cause**
The broken tools use complex cursor-based pagination that doesn't match the actual Slack API format documented in `api-doc.md`.

---

## 📋 **Revised Phase 4 Plan**

### **Goal**: Create stable, working tool-only MCP server with **30 tools**

## **Step 1: Remove Broken Tools**

Remove these 4 problematic tools:
1. Remove `get_thread_context` from thread tools
2. Remove `navigate_thread_replies` from thread tools  
3. Remove `summarize_thread` from thread tools
4. Remove `get_thread_participants` from thread tools

## **Step 2: Implement Simple API-Based Tools**

Based on working API endpoints from `api-doc.md`:

### **New Data Retrieval Tools** (5 tools)

1. **`list_workspace_channels`** - Get all channels
   - **API**: Use existing workspace channels functionality
   - **Simple**: No pagination, direct channel list

2. **`list_workspace_users`** - Get all workspace users  
   - **API**: Use existing workspace users functionality
   - **Simple**: No pagination, direct user list

3. **`get_channel_history`** - Get channel messages
   - **API**: Use existing channel history functionality
   - **Parameters**: channel_id, limit, oldest, latest

4. **`get_thread_replies`** - Get thread replies (replacing broken navigation)
   - **API**: `conversations.replies` endpoint
   - **Parameters**: channel, thread_ts, limit
   - **Simple**: No cursor, direct thread reply list

5. **`search_messages`** - Search messages
   - **API**: `search.modules.messages` endpoint  
   - **Parameters**: query, channel, user, limit

### **New Search Tools** (4 tools)

6. **`search_workspace_global`** - Global workspace search
   - **API**: `search.inline` endpoint
   - **Parameters**: query, limit, sort

7. **`search_users`** - Search users by name/email
   - **API**: Use existing user search functionality
   - **Parameters**: query, limit

8. **`search_channels`** - Search channels by name
   - **API**: Use existing channel search functionality
   - **Parameters**: query, type, limit

9. **`search_threads`** - Simple thread search
   - **API**: Thread search without complex filters
   - **Parameters**: query, channel, limit

## **Step 3: Update Tool Registry**

### **Final Tool Count: 30 tools**

| Category | Count | Tools |
|----------|-------|-------|
| **System Tools** | 7 | ping, echo, get_server_status, get_server_info, list_available_tools, get_performance_metrics, get_workspace_info |
| **Messaging Tools** | 4 | post_message, post_thread_reply, update_message, delete_message |
| **Thread Actions** | 4 | create_thread, resolve_thread, archive_thread, bulk_thread_actions |
| **Workflow Tools** | 6 | promote_thread, escalate_thread, merge_threads, split_thread, watch_thread, analyze_thread_metrics |
| **Data Retrieval** | 5 | list_workspace_channels, list_workspace_users, get_channel_history, get_thread_replies, search_messages |
| **Search Tools** | 4 | search_workspace_global, search_users, search_channels, search_threads |

### **Removed Tools** (4 tools)
- ❌ `get_thread_context` (cursor issues)
- ❌ `navigate_thread_replies` (cursor issues)  
- ❌ `summarize_thread` (depends on broken tools)
- ❌ `get_thread_participants` (depends on broken tools)

## **Step 4: Remove All Resources**

- Remove ResourceRegistry completely
- Update MCP server to be tool-only
- All 14 resources converted to tools or removed

---

## 🎯 **Implementation Strategy**

### **Sprint 4.1: Tool Cleanup** (1 day)
- Remove 4 broken tools from codebase
- Update tool factory registration
- Clean up unused cursor-related code

### **Sprint 4.2: Simple Data Tools** (1 day)  
- Implement 5 data retrieval tools
- Use existing working API endpoints
- No complex pagination or cursors

### **Sprint 4.3: Simple Search Tools** (1 day)
- Implement 4 search tools
- Use documented API endpoints
- Simple parameter-based searching

### **Sprint 4.4: Tool-Only Architecture** (1 day)
- Remove ResourceRegistry completely
- Update MCP server core
- Complete testing with 30 tools

---

## ✅ **Expected Results**

**Before Phase 4:**
- 20 tools + 14 resources = 34 total features
- Some tools broken (invalid_cursor)
- Complex resource system

**After Phase 4:**
- 30 working tools + 0 resources = 30 total features  
- All tools tested and working
- Simple, reliable tool-only architecture
- Clean API-based implementation

**Benefits:**
- ✅ All tools work (no more invalid_cursor errors)
- ✅ Simpler architecture (tool-only)
- ✅ Based on actual working API endpoints
- ✅ Easier to maintain and extend
- ✅ Better user experience (no broken features)

---

**Ready to start implementation with tool cleanup!**