# Sprint 6.1: Enhanced Search Tools Implementation

**Duration**: Aug 12-13, 2025 (2 days)  
**Phase**: 6 - Advanced Search Integration  
**Focus**: Replace search.inline và add file search capabilities

## 🎯 Sprint Goals

### Primary Objectives
1. **Replace search.inline** với advanced search.messages API
2. **Implement file search** với search.files endpoint
3. **Enhanced tool descriptions** for AI Client optimal usage
4. **Complete query pattern documentation** for search operators

### Success Criteria
- ✅ 2 new search tools implemented và functional
- ✅ search.inline replaced với search.messages (backward compatibility)
- ✅ All search tools tested với real workspace data
- ✅ Comprehensive query pattern documentation for AI usage
- ✅ Zero regression in existing functionality

## 📋 Implementation Plan

### Task 1: Advanced Search Messages Tool (Day 1)
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

**Complete Query Pattern Documentation**:

#### Basic Search Patterns:
- `"error log"` - Simple text search
- `"deployment failed"` - Multi-word phrases  
- `"API OR database"` - Boolean OR logic
- `"error AND production"` - Boolean AND logic
- `"bug -resolved"` - Exclude terms with minus

#### Channel-Specific Search:
- `in:general "meeting notes"` - Search trong #general channel
- `in:#random "lunch"` - Search với # prefix
- `in:C1234567890 "update"` - Search với channel ID
- `in:general in:random "announcement"` - Multiple channels

#### User-Specific Search:  
- `from:@john "deadline"` - Messages từ user John
- `from:U1234567890 "completed"` - Messages từ user ID
- `from:botname "alert"` - Messages từ bot
- `from:@sarah to:@mike` - Conversation between users

#### Time-Based Search:
- `after:2025-08-01 "report"` - Messages sau ngày cụ thể
- `before:2025-08-15 "bug"` - Messages trước ngày cụ thể  
- `during:august "vacation"` - Messages trong tháng
- `on:2025-08-10 "meeting"` - Messages trong ngày cụ thể

#### Content-Type Search:
- `has:link "documentation"` - Messages có links
- `has:attachment "screenshot"` - Messages có file attachments
- `has:reaction "celebration"` - Messages có reactions
- `is:pinned "important"` - Pinned messages only

#### Advanced Combinations:
- `in:general from:@john after:2025-08-01 "deployment"` - Complex multi-criteria
- `(urgent OR priority) AND in:alerts` - Grouped boolean logic  
- `"server down" -scheduled` - Exclude planned maintenance
- `has:attachment in:design "mockup"` - Files trong specific channel

**Tool Description (AI-optimized)**:
```
Advanced message search across the entire Slack workspace with powerful query operators. 
Supports complex search patterns including:

CHANNEL SEARCH: Use 'in:channel_name' to search specific channels (e.g., 'in:general meeting')
USER SEARCH: Use 'from:@username' for user-specific messages (e.g., 'from:@john deployment')  
TIME SEARCH: Use 'after:date', 'before:date', 'on:date' for time-based filtering
CONTENT SEARCH: Use 'has:link', 'has:attachment', 'has:reaction' for content types
BOOLEAN LOGIC: Use AND, OR, parentheses, and minus (-) for complex queries

Examples:
- 'in:general from:@sarah "project update"' - Find project updates from Sarah in #general
- 'error AND production -scheduled' - Find production errors excluding scheduled events  
- 'has:attachment in:design "mockup"' - Find design files with mockups
- 'after:2025-08-01 (urgent OR priority)' - Find recent urgent messages

Returns highlighted results with pagination support for large result sets.
```

### Task 2: File-Specific Search Tool (Day 2)
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
- **Documents**: PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx)
- **Images**: PNG, JPG, GIF, WebP, SVG
- **Media**: MP4, MOV, AVI (video), MP3, WAV (audio)
- **Code Files**: JavaScript, TypeScript, Python, Java, C++, Go, etc.
- **Text Files**: TXT, CSV, JSON, XML, YAML, Markdown
- **Archives**: ZIP, RAR, TAR
- **Any uploaded attachments** in workspace

**File Search Query Patterns**:

#### File Name Search:
- `"specification.pdf"` - Exact file name
- `"*.xlsx"` - All Excel files (if supported)
- `"report"` - Files containing "report" in name
- `"2025 budget"` - Files with multiple keywords in name

#### Content Search (in supported file types):
- `"database schema"` - Search inside document content
- `"API endpoint"` - Technical terms in code/documentation
- `"quarterly results"` - Business terms in reports

#### File Type Filtering:
- Combined với file extension patterns
- Search by file categories (docs, images, code)

**Tool Description (AI-optimized)**:
```
Search specifically through files and documents uploaded to the workspace. 
This tool searches both file names and content within documents including:

FILE TYPES: PDF, Word, Excel, PowerPoint, images, code files, text files, and all attachments
SEARCH SCOPE: File names, document content, metadata, and file descriptions
USE CASES: Finding technical specifications, project documents, presentations, reports, or code files

Examples:
- 'specification.pdf' - Find specific PDF file
- 'quarterly report' - Find reports containing quarterly data  
- 'API documentation' - Find technical documentation files
- 'budget 2025' - Find budget-related files for 2025
- 'meeting notes' - Find uploaded meeting recordings or transcripts

Perfect for document research, finding uploaded resources, and locating files 
that contain specific technical or business information that wouldn't be in chat messages.
```

## 🔧 Technical Implementation

### Enhanced Search Tool Factory
```typescript
// Update ProductionToolFactory to include enhanced search tools
export class ProductionToolFactory {
  private registerSearchTools(): void {
    // Replace existing search tool với enhanced versions
    this.registerTool(new SearchMessagesTool());  // Replaces search_channel_messages
    this.registerTool(new SearchFilesTool());     // New file search capability
  }
}
```

### Client Extensions Required
```typescript
// src/slack/client.ts additions

async searchMessages(params: SearchMessagesParams): Promise<SearchResponse>
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
- **After**: 10 production tools (2 search tools) 
- **Net addition**: +1 tool, 1 replacement

### Enhanced Capabilities
1. **Advanced Query Operators**: Support for complex search expressions với comprehensive patterns
2. **File Search**: Dedicated file và document search capability
3. **AI-Optimized Descriptions**: Detailed guidance for AI assistant usage
4. **Better Performance**: More efficient APIs với enhanced features

### Backward Compatibility
- Old `search_channel_messages` tool → replaced với `search_messages`
- New `search_messages` provides same functionality + advanced operators
- Existing integrations continue working với enhanced capabilities

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
- ✅ Both search tools implemented và functional
- ✅ 100% test coverage for enhanced search functionality
- ✅ Performance targets: <500ms average response time
- ✅ Zero regressions in existing tools
- ✅ Complete query pattern documentation

### Quality Metrics
- ✅ Detailed AI-friendly tool descriptions với examples
- ✅ Comprehensive query operator documentation
- ✅ Comprehensive error handling
- ✅ Consistent response formatting
- ✅ Clear documentation và usage patterns

## 🔄 Integration với Existing Architecture

### Production Factory Update
```typescript
// Update ProductionToolFactory to include enhanced search tools
const PHASE_6_TOOLS = {
  messaging: 4,    // No change
  data: 3,         // No change  
  search: 2,       // Enhanced from 1 → 2
  system: 1        // No change
  // Total: 10 tools
};
```

### Client Configuration
- Add new search endpoints to SlackClient
- Update authentication scopes if needed
- Enhance caching strategy for search results

---

**Sprint 6.1 Status**: 📋 **PLANNED** - Ready for implementation  
**Phase 6 Complete**: Enhanced search capabilities with advanced query operators and file search