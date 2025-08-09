# Cách lấy toàn bộ Thread & Messages trong Time Range

Để thực hiện mục đích **"lấy toàn bộ các thread và message bên trong, của các thread có phát sinh message trong 1 time range nhất định"**, bạn cần thực hiện **3 bước tuần tự** với 2 API khác nhau:

## 🔄 **Quy trình 3 bước**

### **Bước 1: Lấy messages trong time range**

**API**: `conversations.history`

```
POST https://slack.com/api/conversations.history
```

**Parameters**:

```javascript
{
  channel: "C1234567890",
  oldest: "1693526400.000000",    // Start timestamp
  latest: "1693612800.000000",    // End timestamp
  inclusive: true,
  limit: 999                      // Max messages per call
}
```

**Mục đích**: Tìm tất cả messages trong time range để identify các thread có activity

---

### **Bước 2: Identify thread messages**

**Logic processing**: Từ response của bước 1, filter ra các messages có:

- `thread_ts` field (messages thuộc thread)
- `reply_count > 0` (parent messages có replies)

```javascript
// Lọc thread parent messages
const threadParents = messages.filter((msg) => msg.reply_count && msg.reply_count > 0);

// Lọc thread replies
const threadReplies = messages.filter((msg) => msg.thread_ts && msg.thread_ts !== msg.ts);

// Collect unique thread timestamps
const threadTimestamps = new Set([
  ...threadParents.map((msg) => msg.ts),
  ...threadReplies.map((msg) => msg.thread_ts),
]);
```

---

### **Bước 3: Lấy complete thread data**

**API**: `conversations.replies`

```
POST https://slack.com/api/conversations.replies
```

**Parameters cho mỗi thread**:

```javascript
{
  channel: "C1234567890",
  ts: "1512085950.000216",        // thread_ts từ bước 2
  inclusive: true,
  limit: 999                      // Max replies per thread
}
```

**Thực hiện**: Loop qua tất cả `threadTimestamps` từ bước 2

---

## 💻 **Implementation Code**

```javascript
async function getThreadsInTimeRange(channel, oldest, latest) {
  // BƯỚC 1: Lấy messages trong time range
  let allMessages = [];
  let cursor = null;

  do {
    const historyResponse = await fetch('https://slack.com/api/conversations.history', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SLACK_USER_TOKEN_XOXC}`,
        Cookie: `d=${process.env.SLACK_COOKIE_D}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        channel,
        oldest,
        latest,
        inclusive: 'true',
        limit: '999',
        ...(cursor && { cursor }),
      }),
    });

    const historyData = await historyResponse.json();
    allMessages.push(...historyData.messages);
    cursor = historyData.response_metadata?.next_cursor;
  } while (cursor);

  // BƯỚC 2: Identify threads có activity trong time range
  const threadTimestamps = new Set();

  allMessages.forEach((msg) => {
    // Thread parent có replies
    if (msg.reply_count && msg.reply_count > 0) {
      threadTimestamps.add(msg.ts);
    }
    // Thread reply
    if (msg.thread_ts && msg.thread_ts !== msg.ts) {
      threadTimestamps.add(msg.thread_ts);
    }
  });

  // BƯỚC 3: Lấy complete thread data
  const completeThreads = [];

  for (const threadTs of threadTimestamps) {
    const repliesResponse = await fetch('https://slack.com/api/conversations.replies', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SLACK_USER_TOKEN_XOXC}`,
        Cookie: `d=${process.env.SLACK_COOKIE_D}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        channel,
        ts: threadTs,
        inclusive: 'true',
        limit: '999',
      }),
    });

    const repliesData = await repliesResponse.json();
    if (repliesData.ok) {
      completeThreads.push({
        thread_ts: threadTs,
        messages: repliesData.messages,
      });
    }
  }

  return completeThreads;
}
```

---

## 🎯 **Response Data Structure**

```javascript
// Kết quả cuối cùng
const result = [
  {
    thread_ts: '1512085950.000216',
    messages: [
      {
        type: 'message',
        text: 'Thread parent message',
        user: 'U012AB3CDE',
        ts: '1512085950.000216',
        reply_count: 3,
        // ... other fields
      },
      {
        type: 'message',
        text: 'First reply',
        user: 'U061F7AUR',
        ts: '1512104434.000490',
        thread_ts: '1512085950.000216',
        // ... other fields
      },
      // ... more replies
    ],
  },
  // ... more complete threads
];
```

Quy trình này đảm bảo bạn có **complete thread data** cho tất cả threads có hoạt động trong time range được chỉ định, với đầy đủ parent message và tất cả replies.

## 🎯 **Chú ý**

- Tool description cần mô tả chi tiết về use case đặc biệt này, để AI Client dễ phán đoán khi nào nên dùng
