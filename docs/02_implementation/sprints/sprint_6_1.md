# Sprint 6.1: Enhanced Search Tools Implementation

**Duration**: Aug 12-14, 2025 (3 days)  
**Phase**: 6 - Advanced Search Integration  
**Focus**: Replace and enhance search capabilities với powerful search tools

## 🎯 Sprint Goals

### Primary Objectives
1. **Replace search.inline** với advanced search.messages API
2. **Add universal search** với search.all endpoint  
3. **Implement file search** với search.files endpoint
4. **Enhanced tool descriptions** for AI Client optimal usage

### Success Criteria
- ✅ 4 new search tools implemented và functional
- ✅ search.inline replaced với search.messages (backward compatibility)
- ✅ All search tools tested với real workspace data
- ✅ Detailed tool descriptions for AI assistant usage
- ✅ Zero regression in existing functionality

## 📋 Implementation Plan

### Task 1: Core Search Messages Tool (Day 1)
**Tool**: `search_messages` (replaces `search_channel_messages`)

**Implementation Details**:
```typescript
// Tool: search_messages
// Endpoint: search.messages  
// Replaces: search.inline from Phase 5

interface SearchMessagesArgs {
  query: string;           // Required: Search query with operators support
  count?: number;          // Results per page (1-100, default 20)
  page?: number;           // Page number (1-100, default 1)
  sort?: 'asc' | 'desc';   // Sort direction (default 'desc')
  highlight?: boolean;     // Enable query highlighting (default true)
  cursor?: string;         // Pagination cursor for next page
}
```

**Advanced Query Operators Support**:
- `in:channel_name` - Search trong channel cụ thể
- `from:@user_id` - Search messages từ user cụ thể  
- `from:botname` - Search messages từ bot cụ thể
- Text search với boolean operators

**Tool Description (AI-optimized)**:
```
Search messages across the entire Slack workspace using advanced search operators. 
This tool supports complex queries like 'in:general from:@john error log' to find 
specific content. Use query operators: in:channel_name for channel-specific search, 
from:@user_id for user-specific messages, or combine terms with boolean logic. 
Returns highlighted results with pagination support for large result sets.
```

### Task 2: Universal Search Tool (Day 2)  
**Tool**: `search_all`

**Implementation Details**:
```typescript
// Tool: search_all
// Endpoint: search.all
// Purpose: Search both messages and files in one call

interface SearchAllArgs {
  query: string;           // Required: Search query
  count?: number;          // Results per page (1-100, default 20)
  page?: number;           // Page number (1-100, default 1) 
  sort?: 'score' | 'timestamp';  // Sort by relevance or time
  sort_dir?: 'asc' | 'desc';     // Sort direction
  highlight?: boolean;     // Enable highlighting (default true)
}
```

**Tool Description (AI-optimized)**:
```
Search both messages and files across the workspace in a single comprehensive search. 
This tool finds text content in messages AND searches through uploaded documents, 
images, and files. Use for broad searches when you're unsure if the information 
is in a message or an attached document. Returns combined results with both 
message text and file metadata, perfect for complete workspace knowledge discovery.
```

### Task 3: File-Specific Search Tool (Day 2)
**Tool**: `search_files`

**Implementation Details**:
```typescript  
// Tool: search_files
// Endpoint: search.files
// Purpose: Dedicated file and document search

interface SearchFilesArgs {
  query: string;           // Required: Search query for file names/content
  count?: number;          // Results per page (1-100, default 20)
  page?: number;           // Page number (1-100, default 1)
  sort?: 'score' | 'timestamp' | 'size';  // Sort options
  sort_dir?: 'asc' | 'desc';              // Sort direction  
  highlight?: boolean;     // Enable highlighting (default true)
}
```

**Supported File Types**:
- Documents (PDF, Word, Excel, PowerPoint)
- Images và media files (PNG, JPG, GIF, MP4)
- Code files và snippets (JS, TS, Python, etc.)
- Text files và logs
- Any uploaded attachments

**Tool Description (AI-optimized)**:
```
Search specifically through files and documents uploaded to the workspace. 
This tool searches file names, titles, and content within documents like PDFs, 
Word docs, spreadsheets, presentations, and code files. Use when looking for 
specific documents, technical specifications, presentations, or when you know 
the information is likely in an uploaded file rather than a chat message.
```

### Task 4: Workspace Search Tool (Day 3)
**Tool**: `search_workspace` (enhanced version)

**Implementation Details**:
```typescript
// Tool: search_workspace  
// Purpose: Intelligent workspace-wide search with auto-routing

interface SearchWorkspaceArgs {
  query: string;           // Required: Natural language search query
  content_types?: ('messages' | 'files')[];  // Content types to search
  include_bots?: boolean;  // Include bot messages (default false)
  limit?: number;          // Max results (1-50, default 20)
  context_channel?: string; // Scope search to channel context
}
```

**Tool Description (AI-optimized)**:
```
Intelligent workspace search that automatically determines the best search strategy 
based on your query. Searches across messages, files, and conversations using 
natural language queries. This tool is ideal for exploratory searches when you're 
not sure exactly what format the information is in. It combines results from 
multiple sources and presents the most relevant content first.
```

## 🔧 Technical Implementation

### New Search Tool Factory
```typescript
// src/tools/search-factory.ts
export class EnhancedSearchFactory {
  registerSearchTools(): BaseSlackTool[] {
    return [
      new SearchMessagesTool(),      // Replaces search_channel_messages
      new SearchAllTool(),           // New universal search  
      new SearchFilesTool(),         // New file search
      new SearchWorkspaceTool()      // New intelligent search
    ];
  }
}
```

### Client Extensions Required
```typescript
// src/slack/client.ts additions

async searchMessages(params: SearchMessagesParams): Promise<SearchResponse>
async searchAll(params: SearchAllParams): Promise<UniversalSearchResponse>  
async searchFiles(params: SearchFilesParams): Promise<FileSearchResponse>
```

### Enhanced Error Handling
- Query validation và sanitization
- Rate limiting awareness
- Graceful fallbacks khi APIs không available
- Clear error messages for AI clients

## 📊 Expected Outcomes

### Tool Count Update
- **Before**: 9 production tools (1 search tool)
- **After**: 12 production tools (4 search tools) 
- **Net addition**: +3 tools, 1 replacement

### Enhanced Capabilities
1. **Advanced Query Operators**: Support for complex search expressions
2. **Multi-Content Search**: Messages, files, và documents in one interface
3. **AI-Optimized Descriptions**: Clear guidance for AI assistant usage
4. **Better Performance**: More efficient APIs với pagination

### Backward Compatibility
- Old `search_channel_messages` tool → deprecated gracefully
- New `search_messages` provides same functionality + enhancements
- Existing integrations continue working

## ⚠️ Risk Mitigation

### Potential Issues
1. **API Rate Limits**: Search APIs có different limits
2. **Result Formatting**: Different response structures across APIs
3. **Query Complexity**: Advanced operators might confuse users

### Mitigation Strategies  
1. **Rate Limiting**: Implement per-tool rate limiting
2. **Response Normalization**: Standardize response formats
3. **Query Validation**: Validate và suggest query improvements
4. **Fallback Logic**: Graceful degradation nếu advanced features fail

## 🧪 Testing Strategy

### Unit Tests
- Query parameter validation
- Response parsing và formatting
- Error handling scenarios
- Rate limiting behavior

### Integration Tests  
- Real Slack workspace testing
- Cross-tool compatibility
- Performance benchmarking
- AI Client usability testing

### Test Data Requirements
- Sample queries với various operators
- Test files của different formats
- Different channel types và permissions
- Large result set pagination testing

## 📈 Success Metrics

### Functionality Metrics
- ✅ All 4 search tools implemented
- ✅ 100% test coverage for new search tools
- ✅ Performance targets: <500ms average response time
- ✅ Zero regressions in existing tools

### Quality Metrics
- ✅ Detailed AI-friendly tool descriptions
- ✅ Comprehensive error handling
- ✅ Consistent response formatting
- ✅ Clear documentation và examples

## 🔄 Integration với Existing Architecture

### Production Factory Update
```typescript
// Update ProductionToolFactory to include enhanced search tools
const PHASE_6_TOOLS = {
  messaging: 4,    // No change
  data: 3,         // No change  
  search: 4,       // Enhanced from 1 → 4
  system: 1        // No change
  // Total: 12 tools
};
```

### Client Configuration
- Add new search endpoints to SlackClient
- Update authentication scopes if needed
- Enhance caching strategy for search results

---

**Sprint 6.1 Status**: 📋 **PLANNED** - Ready for implementation  
**Next**: Sprint 6.2 - AI-Optimized Search Integration với assistant.search.context