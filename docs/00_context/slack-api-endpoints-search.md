# Chi tiết API Slack Search Tools

Dưới đây là thông tin chi tiết về 4 API search tools quan trọng mà bạn có thể tích hợp vào MCP server:

## Phase 1: Essential Search Tools

### 1. `search.messages` - Core Message Search

**Endpoint**: `GET https://slack.com/api/search.messages`[1]

**Purpose**: Search messages across toàn workspace với khả năng advanced filtering

**Key Parameters**:

- `query` (required) - Search query với support cho operators
- `cursor` - Pagination cursor cho next page
- `highlight` (boolean) - Enable query highlighting markers
- `sort` - Sort direction (`asc` hoặc `desc`)
- `count` - Số results per page (max 100)
- `page` - Page number (max 100)

**Advanced Query Operators**:[1]

- `in:channel_name` - Search trong channel cụ thể
- `from:@UserID` - Search messages từ user cụ thể
- `from:botname` - Search messages từ bot cụ thể

**Response Structure**:[1]

```json
{
  "ok": true,
  "query": "search term",
  "messages": {
    "matches": [
      {
        "channel": {
          "id": "C12345678",
          "name": "general"
        },
        "text": "The meaning of life...",
        "ts": "1508284197.000015",
        "user": "U2U85N1RV",
        "permalink": "https://workspace.slack.com/archives/..."
      }
    ],
    "total": 2,
    "pagination": {
      "page": 1,
      "page_count": 1,
      "per_page": 20,
      "total_count": 2
    }
  }
}
```

**Ưu điểm so với `search.inline`**:

- Hỗ trợ highlight query terms với UTF-8 markers[1]
- Pagination tốt hơn với cursor support
- Advanced query operators mạnh mẽ hơn

---

### 2. `assistant.search.context` - AI-Optimized Search

**Endpoint**: `POST https://slack.com/api/assistant.search.context`[2]

**Purpose**: Search được optimize cho AI assistants với contextual relevance[2]

**Key Parameters**:

- `query` (required) - User prompt hoặc search query
- `action_token` (required) - Ephemeral token từ user interaction[3]
- `channel_types` - Filter by channel types: `public_channel`, `private_channel`, `mpim`, `im`[2]
- `content_types` - Content types: `messages`, `files`[2]
- `context_channel_id` - Context channel để scope search[2]
- `cursor` - Pagination cursor
- `include_bots` - Include bot messages[3]
- `limit` - Number of results (max 20, default 20)[3]

**Response Structure**:[2]

```json
{
  "ok": true,
  "results": {
    "messages": [
      {
        "author_user_id": "U0123456",
        "team_id": "T0123456",
        "channel_id": "C0123456",
        "message_ts": "123456.7890",
        "content": "Hey team, we'll be kicking off...",
        "is_author_bot": false,
        "permalink": "https://mycompany.slack.com/archives/..."
      }
    ]
  },
  "response_metadata": {
    "next_cursor": "Q1VSUkVOVF9QQUdFOjI="
  }
}
```

**Lý do quan trọng cho AI integration**:[3][2]

- Được design riêng cho AI assistants như Claude
- Trả về contextually relevant results
- Support real-time data retrieval cho broad và specific queries
- Efficient cursor-based pagination

---

## Phase 2: Advanced Search Tools

### 3. `search.all` - Universal Search

**Endpoint**: `GET https://slack.com/api/search.all`[4]

**Purpose**: Search cả messages và files trong một API call duy nhất[4]

**Key Parameters**:

- `query` (required) - Search query
- `highlight` - Enable highlighting
- `sort`, `sort_dir` - Sorting options
- `count`, `page` - Pagination
- Standard auth parameters

**Ưu điểm**:[4]

- **Tiết kiệm API calls**: Thay vì gọi riêng `search.messages` và `search.files`
- **Comprehensive results**: Bao gồm cả text content và file attachments
- **Consistent interface**: Cùng parameters như các search APIs khác

**Use cases ideal**:

- Tìm kiếm toàn diện khi không biết content ở dạng nào
- Search documents được mention trong messages
- Unified search experience cho users

---

### 4. `search.files` - File-Specific Search

**Endpoint**: `GET https://slack.com/api/search.files`[5]

**Purpose**: Chuyên search files và documents được share trong workspace[5]

**Key Parameters**:

- `query` (required) - Search query cho file names, content
- `highlight` - Enable query highlighting
- `sort`, `sort_dir` - File sorting options
- `count`, `page` - Pagination parameters

**File Types Supported**:

- Documents (PDF, Word, Excel, etc.)
- Images và media files
- Code files và snippets
- Any uploaded attachments

**Response Structure tương tự**:[5]

```json
{
  "ok": true,
  "files": {
    "matches": [
      {
        "id": "F1234567890",
        "name": "document.pdf",
        "title": "Project Specification",
        "mimetype": "application/pdf",
        "permalink": "https://workspace.slack.com/files/...",
        "channels": ["C1234567890"],
        "user": "U1234567890"
      }
    ],
    "total": 5
  }
}
```

**Lý do quan trọng**:

- Files thường chứa detailed information không có trong messages
- Tìm presentations, spreadsheets, technical docs
- Support cho knowledge management workflows

## 🔑 Implementation Notes

### Authentication Requirements:

- Tất cả APIs này đều support **browser tokens** (xoxc/xoxd) mà bạn đang sử dụng
- Cần scope `search:read` permission[6]

### Rate Limiting:

- `search.messages`: Max 100 results per page, max 100 pages[1]
- `assistant.search.context`: Max 20 results per request[3]
- Standard Slack API rate limits áp dụng

### Error Handling chung:[1][2]

- `rate_limited`, `query_too_long`, `missing_query`
- `invalid_auth`, `token_expired`, `access_denied`
- `feature_not_enabled` (cho `assistant.search.context`)

Những APIs này sẽ làm phong phú đáng kể khả năng search của MCP server, đặc biệt với `assistant.search.context` được optimize riêng cho AI integration như Claude.
