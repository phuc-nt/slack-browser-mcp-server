# Slack Block Kit Quick Guide

## 🧱 Core Block Types

### 1. **Section Block** - Chứa text và accessories

```json
{
  "type": "section",
  "text": {
    "type": "mrkdwn",
    "text": "Hello *world*!"
  },
  "accessory": {
    "type": "button",
    "text": { "type": "plain_text", "text": "Click Me" }
  }
}
```

### 2. **Header Block** - Tiêu đề lớn

```json
{
  "type": "header",
  "text": {
    "type": "plain_text",
    "text": "New Request"
  }
}
```

### 3. **Divider Block** - Dòng phân cách

```json
{
  "type": "divider"
}
```

### 4. **Context Block** - Thông tin phụ (nhỏ, màu xám)

```json
{
  "type": "context",
  "elements": [
    {
      "type": "mrkdwn",
      "text": "Created by "
    }
  ]
}
```

### 5. **Image Block** - Hiển thị ảnh

```json
{
  "type": "image",
  "image_url": "https://example.com/image.png",
  "alt_text": "Image description"
}
```

### 6. **Actions Block** - Chứa buttons, menus

```json
{
  "type": "actions",
  "elements": [
    {
      "type": "button",
      "text": { "type": "plain_text", "text": "Approve" },
      "style": "primary",
      "action_id": "approve"
    }
  ]
}
```

### 7. **Rich Text Block** - Rich formatting[2]

```json
{
  "type": "rich_text",
  "elements": [
    {
      "type": "rich_text_section",
      "elements": [
        { "type": "text", "text": "Bold ", "style": { "bold": true } },
        { "type": "text", "text": "italic", "style": { "italic": true } }
      ]
    }
  ]
}
```

### 8. **Markdown Block** - Standard markdown[3][2]

```json
{
  "type": "markdown",
  "text": "**Bold text** and *italic text*\n\n- List item 1\n- List item 2"
}
```

---

## ✨ Text Object Types

### **mrkdwn** - Slack markdown

- `*bold*`, `_italic_`, `~strikethrough~`
- `` `code` ``, `code block`
- `` user mentions
- `` channel mentions
- ``

### **plain_text** - Plain text only

- No formatting
- `emoji: true` để support emojis

---

## 🎮 Interactive Elements

### **Button**

```json
{
  "type": "button",
  "text": { "type": "plain_text", "text": "Click" },
  "style": "primary", // primary, danger
  "action_id": "button_action",
  "value": "button_value"
}
```

### **Select Menu**

```json
{
  "type": "static_select",
  "action_id": "select_action",
  "placeholder": { "type": "plain_text", "text": "Choose..." },
  "options": [
    {
      "text": { "type": "plain_text", "text": "Option 1" },
      "value": "option_1"
    }
  ]
}
```

### **Text Input**

```json
{
  "type": "plain_text_input",
  "action_id": "input_action",
  "placeholder": { "type": "plain_text", "text": "Enter text..." },
  "multiline": true
}
```

---

## 🔧 Implementation cho MCP Server

### **Layout Structure**

```json
{
  "blocks": [
    {"type": "header", "text": {"type": "plain_text", "text": "Title"}},
    {"type": "divider"},
    {"type": "section", "text": {"type": "mrkdwn", "text": "Content"}},
    {"type": "actions", "elements": [...]}
  ]
}
```

### **Key Limits**[9][2]

- **Max 50 blocks** per message
- **Max 3,000 characters** trong text objects
- **Max 12,000 characters** trong markdown blocks[2][3]
- **Max 75 characters** cho button text

### **Best Practices**

- Luôn có `fallback text` cho notifications
- Sử dụng `action_id` unique cho mỗi interactive element
- Combine blocks để tạo layouts phức tạp
- Test với Block Kit Builder trước khi implement

### **Error Handling**

- `invalid_blocks` - Block structure sai
- `blocks_too_large` - Vượt quá size limit
- `missing_text` - Thiếu required text fields

Với 2 tools mới `post_message_blocks` và `update_message_blocks`, bạn có thể tạo rich interactive messages với buttons, forms, và dynamic content cho AI assistant trong Slack workspace.
