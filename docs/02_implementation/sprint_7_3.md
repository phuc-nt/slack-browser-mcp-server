# Sprint 7.3: Block Kit Support & Enhanced Thread Collection

**Timeline**: August 11, 2025  
**Status**: 📋 PLANNED  
**Focus**: Dedicated Block Kit tools & keyword-based thread collection

## 🎯 Sprint Objectives

1. **Block Kit Integration**: Create dedicated tools for Block Kit messaging (post & update)
2. **Enhanced Thread Collection**: Add keyword search capability to thread collection 
3. **100% Tool Functionality**: Achieve complete feature parity and production readiness
4. **Developer Experience**: Improve Block Kit workflow for AI assistants

## 🔧 Technical Implementation Plan

### 1. Block Kit Tools Development

#### **New Tool: `post_message_blocks`**

**Purpose**: Dedicated Block Kit message posting
**Files to create**:
- `src/tools/block-kit-messaging.ts` - New dedicated file
- Add to `src/tools/production-factory.ts` registration

**Implementation**:
```typescript
export class PostMessageBlocksTool extends BaseSlackTool {
  name = "post_message_blocks";
  description = "Post message with Block Kit elements (buttons, sections, dividers)";
  
  inputSchema = {
    channel: { type: "string", required: true },
    blocks: { type: "array", required: true }, // Properly validated Block Kit array
    text: { type: "string", required: false }, // Fallback text
    thread_ts: { type: "string", required: false }
  };
}
```

#### **New Tool: `update_message_blocks`**

**Purpose**: Update existing messages with Block Kit
**Implementation**:
```typescript
export class UpdateMessageBlocksTool extends BaseSlackTool {
  name = "update_message_blocks";
  description = "Update existing message with Block Kit elements";
  
  inputSchema = {
    channel: { type: "string", required: true },
    ts: { type: "string", required: true },
    blocks: { type: "array", required: true },
    text: { type: "string", required: false }
  };
}
```

### 2. Enhanced Thread Collection

#### **Enhanced Tool: `collect_threads_by_keyword`**

**Purpose**: Search and collect threads containing specific keywords
**Files to modify**:
- `src/tools/time-range-thread-collection.ts` - Add new tool class

**Implementation**:
```typescript
export class CollectThreadsByKeywordTool extends BaseSlackTool {
  name = "collect_threads_by_keyword";
  description = "Collect threads containing specific keywords within timerange";
  
  inputSchema = {
    channel: { type: "string", required: true },
    keywords: { type: "array", required: true }, // Array of search terms
    start_time: { type: "string", required: true },
    end_time: { type: "string", required: true },
    match_type: { type: "string", enum: ["any", "all"], default: "any" }
  };
}
```

#### **Enhanced Existing Tool: `collect_threads_by_timerange`**

**Add optional keyword filtering**:
```typescript
// Add to existing inputSchema
keywords: { type: "array", required: false },
match_type: { type: "string", enum: ["any", "all"], default: "any", required: false }
```

## 📊 Expected Tool Architecture

### **New Tool Count: 11 → 13 tools**

| Category                  | Before | After  | Change                                        |
| ------------------------- | ------ | ------ | --------------------------------------------- |
| **Messaging Tools**       | 4      | 6      | +2 (post_message_blocks, update_message_blocks) |
| **Data Retrieval Tools**  | 3      | 3      | No change                                     |
| **Enhanced Search Tools** | 2      | 2      | No change                                     |
| **Thread Collection Tools** | 1    | 2      | +1 (collect_threads_by_keyword)               |
| **Total**                 | **10** | **13** | **+3**                                        |

### **Tool Categorization**

#### **🏷️ MESSAGING Tools (6)**
- ✅ `post_message` - Simple text messages
- ✅ `update_message` - Simple text updates  
- ✅ `delete_message` - Message deletion
- ✅ `react_to_message` - Emoji reactions
- 🆕 `post_message_blocks` - **Block Kit posting**
- 🆕 `update_message_blocks` - **Block Kit updates**

#### **🏷️ DATA Tools (3)**
- ✅ `get_thread_replies` - Thread conversation data
- ✅ `list_workspace_channels` - Channel enumeration
- ✅ `list_workspace_users` - User enumeration  
- ✅ `get_user_profile` - Individual user details

#### **🏷️ SEARCH Tools (2)**
- ✅ `search_messages` - Message content search
- ✅ `search_files` - File content search

#### **🏷️ COLLECTION Tools (2)**
- ✅ `collect_threads_by_timerange` - Time-based thread collection
- 🆕 `collect_threads_by_keyword` - **Keyword-based thread collection**

## 🔍 Implementation Details

### Block Kit Validation Strategy

#### **Proper Array Validation**
```typescript
// Current issue in post_message
if (!Array.isArray(blocks)) {
  throw new Error("Blocks must be an array");
}

// Enhanced validation for Block Kit
private validateBlockKitBlocks(blocks: any[]): void {
  if (!Array.isArray(blocks)) {
    throw new Error("Blocks must be an array");
  }
  
  blocks.forEach((block, index) => {
    if (!block.type) {
      throw new Error(`Block ${index} missing required 'type' field`);
    }
    
    // Validate common Block Kit types
    if (!['section', 'divider', 'actions', 'header', 'context'].includes(block.type)) {
      throw new Error(`Block ${index} has unsupported type: ${block.type}`);
    }
  });
}
```

### Keyword Search Implementation

#### **Thread Filtering Logic**
```typescript
private async filterThreadsByKeywords(
  threads: SlackThread[],
  keywords: string[],
  matchType: 'any' | 'all' = 'any'
): Promise<SlackThread[]> {
  
  return threads.filter(thread => {
    const allMessages = [thread.parent_message, ...thread.replies];
    const allText = allMessages.map(msg => msg.text?.toLowerCase() || '').join(' ');
    
    if (matchType === 'all') {
      return keywords.every(keyword => 
        allText.includes(keyword.toLowerCase())
      );
    } else {
      return keywords.some(keyword => 
        allText.includes(keyword.toLowerCase())
      );
    }
  });
}
```

## 🧪 Testing Strategy

### Block Kit Tools Testing

**Test Cases**:
1. **Basic Block Kit**: Simple section with text
2. **Complex Blocks**: Multiple sections, dividers, actions
3. **Interactive Elements**: Buttons, select menus
4. **Error Handling**: Invalid block structures
5. **Thread Integration**: Block Kit messages in threads

### Enhanced Thread Collection Testing

**Test Cases**:
1. **Single Keyword**: Find threads containing specific term
2. **Multiple Keywords (ANY)**: Threads containing any of the keywords
3. **Multiple Keywords (ALL)**: Threads containing all keywords
4. **Case Sensitivity**: Keyword matching behavior
5. **Thread vs Reply**: Keyword in parent vs reply messages

### Validation Criteria

**For Block Kit tools**:
- ✅ Valid Block Kit JSON accepted
- ✅ Invalid blocks rejected with clear error messages
- ✅ Message renders correctly in Slack
- ✅ Interactive elements functional

**For enhanced collection**:
- ✅ Keyword search accuracy
- ✅ Performance with large thread volumes
- ✅ Correct match type behavior (any vs all)
- ✅ Backward compatibility with existing timerange tool

## 📈 Expected Benefits

### Developer Experience Improvements

| Feature                     | Before                          | After                                |
| --------------------------- | ------------------------------- | ------------------------------------ |
| **Block Kit Support**       | Fails with validation error     | Dedicated tools with proper validation |
| **Thread Search**           | Manual filtering required       | Built-in keyword search capability   |
| **AI Assistant Integration** | Limited to simple messages     | Full Block Kit workflow support      |
| **Tool Specialization**     | Generic tools for all cases    | Specialized tools for specific needs |

### Performance Improvements

| Metric                      | Current | Target  | Improvement       |
| --------------------------- | ------- | ------- | ----------------- |
| **Block Kit Success Rate**  | 0%      | 100%    | Complete fix      |
| **Thread Search Efficiency** | Manual  | Automated | 10x faster      |
| **Tool Count**              | 11      | 13      | +2 specialized   |
| **Overall Success Rate**    | 91%     | 100%    | Production ready |

## 🚀 Implementation Order

### **Phase 1: Block Kit Foundation** (2 hours)
1. Create `src/tools/block-kit-messaging.ts`
2. Implement `PostMessageBlocksTool` with proper validation
3. Implement `UpdateMessageBlocksTool`
4. Update production factory registration

### **Phase 2: Enhanced Thread Collection** (2 hours)
1. Add keyword filtering to existing `collect_threads_by_timerange`
2. Implement new `CollectThreadsByKeywordTool`
3. Add keyword search logic and validation

### **Phase 3: Testing & Integration** (2 hours)
1. Update test suite for new tools
2. Block Kit validation testing
3. Keyword search accuracy testing
4. Integration with existing tool architecture

### **Phase 4: Documentation & Validation** (1 hour)
1. Update tool documentation
2. API schema validation
3. Production readiness testing

**Total Estimated Time**: 7 hours

## 🎯 Definition of Done

### Technical Criteria
- ✅ 2 new Block Kit tools fully implemented
- ✅ Enhanced thread collection with keyword support
- ✅ All 13 tools pass validation tests
- ✅ Zero build errors or broken functionality

### Functional Criteria
- ✅ Block Kit messages post and update successfully
- ✅ Keyword-based thread collection works accurately
- ✅ Backward compatibility maintained
- ✅ 100% production success rate achieved

### Quality Criteria
- ✅ Proper Block Kit validation with clear error messages
- ✅ Optimized response formats maintained (Sprint 7.2)
- ✅ Comprehensive test coverage for new functionality
- ✅ Documentation updated for all new tools

## 🔄 Migration Impact

### Tool Count Changes
- **Breaking Change**: Tool count increases from 11 to 13
- **Mitigation**: Additive changes, existing tools unchanged
- **Client Benefits**: More specialized, purpose-built tools

### API Compatibility
- **Existing Tools**: No changes to current tool schemas
- **New Tools**: Additional capabilities without breaking existing workflows
- **Enhanced Tools**: Optional keyword parameters maintain backward compatibility

## 📊 Success Metrics

### Quantitative Targets

| Metric                      | Target       | Measurement                    |
| --------------------------- | ------------ | ------------------------------ |
| **Tool Count**              | 13 tools     | Tool registry verification     |
| **Block Kit Success Rate**  | 100%         | Block Kit posting/updating     |
| **Overall Success Rate**    | 100% (13/13) | Comprehensive test suite       |
| **Keyword Search Accuracy** | >95%         | Thread collection validation   |

### Qualitative Goals
- ✅ Complete Block Kit workflow support
- ✅ Enhanced thread discovery capabilities  
- ✅ Better AI assistant integration
- ✅ Specialized tool architecture

---

**🎯 Sprint 7.3 Goal**: Complete Block Kit integration and enhance thread collection capabilities for 100% production readiness with 13 specialized tools.

_📅 Created: 2025-08-11 | Status: 📋 PLANNED | Focus: Block Kit Support & Enhanced Thread Collection_