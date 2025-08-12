Dựa trên thông tin tìm được, tôi có thể đưa ra hướng dẫn chi tiết cho việc tạo 2 tool mới cho MCP server của bạn:

## `post_message_blocks` - Dedicated Block Kit Message Posting

**Endpoint sử dụng**: `POST https://slack.com/api/chat.postMessage`[1]

### Key Parameters:

- `channel` (required) - Channel ID để post message
- `blocks` (required) - JSON array chứa Block Kit blocks[2][1]
- `text` (optional but recommended) - Fallback text cho notifications[3]
- `thread_ts` (optional) - Reply to specific message thread[1]
- `reply_broadcast` (optional) - Make thread reply visible to all[1]

### Đặc điểm quan trọng:

- **Block Kit support**: Có thể chứa tối đa 50 blocks trong mỗi message[2]
- **Text behavior**: Khi có `blocks`, `text` chỉ dùng làm fallback cho notifications, không hiển thị trong message[3]
- **Authentication**: Hỗ trợ browser tokens (xoxc/xoxd) mà MCP server đang sử dụng[1]

### Example Implementation Structure:

```json
{
  "channel": "C1234567890",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "Hello *World*"
      }
    }
  ],
  "text": "Hello World"
}
```

---

## `update_message_blocks` - Update Existing Messages with Block Kit

**Endpoint sử dụng**: `POST https://slack.com/api/chat.update`[4][5]

### Key Parameters:

- `channel` (required) - Channel chứa message cần update
- `ts` (required) - Message timestamp làm message ID[4]
- `blocks` (required) - JSON array chứa Block Kit blocks mới[5]
- `text` (optional) - Fallback text

### Behavior quan trọng:

- **Block replacement**: Nếu cung cấp `blocks`, toàn bộ blocks cũ sẽ bị thay thế[5]
- **No "edited" flag**: Khi update với `blocks`, Slack sẽ không hiển thị flag "edited"[5]
- **Partial updates possible**: Có thể lấy existing blocks và chỉ modify specific elements[6]

### Advanced Update Pattern:

```javascript
// Lấy existing blocks từ message
const existingBlocks = messageData.blocks;

// Modify specific elements
existingBlocks[1]['elements'][0]['style'] = 'primary';
existingBlocks[1]['elements'][0]['text']['text'] = 'Updated Button';

// Update message với modified blocks
client.chat.update({
  channel: channelId,
  ts: messageTs,
  blocks: existingBlocks,
});
```

---

## Implementation Notes cho MCP Server:

### 1. **Error Handling**:

- `invalid_blocks` - Block structure không hợp lệ
- `blocks_too_large` - Vượt quá 50 blocks limit[2]
- `message_not_found` - Message timestamp không tồn tại (cho update)

### 5. **Use Cases phổ biến**:

- Interactive buttons và forms
- Progress indicators
- Status dashboards
- Rich content formatting với markdown, images, dividers
- Dynamic workflows với button actions

Cả 2 tools này sẽ significantly mở rộng khả năng tương tác của AI assistant với Slack workspace, đặc biệt cho interactive và rich content scenarios.
