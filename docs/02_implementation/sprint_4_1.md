# Sprint 4.1: Tool Cleanup & Broken Tool Removal

> **Phase 4 - Tool-Only Architecture: Remove Broken Tools**  
> **Duration**: 1 day | **Status**: 📋 PLANNED  
> **Focus**: Remove tools with invalid_cursor errors identified by Cline testing

## 📋 Sprint Objectives

1. **Remove Broken Tools** - Eliminate 4 tools causing invalid_cursor errors
2. **Clean Tool Registry** - Update factory and registration system
3. **Remove Dead Code** - Clean up unused cursor-related code
4. **Update Documentation** - Reflect reduced tool count

---

## 🚨 Background: Cline Test Results

**Working Tools**: ✅ ping, echo, messaging tools, basic thread actions  
**Broken Tools**: ❌ get_thread_context, navigate_thread_replies, summarize_thread, get_thread_participants  
**Root Cause**: Complex cursor-based pagination incompatible with actual Slack API

---

## 🗑️ Tools to Remove

### 1. **get_thread_context** 
- **File**: `src/tools/thread-navigation.ts`
- **Issue**: Complex cursor navigation not working with Slack API
- **Usage**: Thread context retrieval with metadata

### 2. **navigate_thread_replies**
- **File**: `src/tools/thread-navigation.ts` 
- **Issue**: Cursor pagination causing invalid_cursor errors
- **Usage**: Thread reply navigation with pagination

### 3. **summarize_thread**
- **File**: `src/tools/thread-tool-implementations.ts`
- **Issue**: Depends on broken get_thread_context tool
- **Usage**: AI-powered thread summarization

### 4. **get_thread_participants**
- **File**: `src/tools/thread-tool-implementations.ts`
- **Issue**: Depends on broken thread context tools
- **Usage**: Thread participant analysis

---

## 🛠️ Implementation Tasks

### Task 1: Remove Tool Implementations (2 hours)

**Files to modify:**
- `src/tools/thread-navigation.ts` - Remove get_thread_context, navigate_thread_replies
- `src/tools/thread-tool-implementations.ts` - Remove summarize_thread, get_thread_participants
- `src/tools/threads.ts` - Remove tool definitions from main file

**Actions:**
1. Remove tool creation functions
2. Remove handler implementations  
3. Remove related imports and exports
4. Clean up unused utility functions

### Task 2: Update Tool Factory (1 hour)

**Files to modify:**
- `src/tools/factory.ts` - Remove tool registration
- Update tool categories and counts

**Actions:**
1. Remove broken tools from factory registration
2. Update tool count from 20 to 16 (remove 4)
3. Update category assignments
4. Clean up imports

### Task 3: Clean Up Type Definitions (1 hour)

**Files to modify:**
- `src/types/thread-tools.ts` - Remove broken tool interfaces
- `src/types/tools.ts` - Update tool registry types

**Actions:**
1. Remove interface definitions for broken tools
2. Remove cursor-related types if unused
3. Update tool count constants
4. Clean up exports

### Task 4: Update System Tools (1 hour)

**Files to modify:**
- `src/tools/system-tools.ts` - Update list_available_tools counts

**Actions:**
1. Update tool registry to reflect 16 thread tools (down from 20)
2. Update total tool count to 26 (down from 30)
3. Remove broken tools from category listings

---

## 📊 Expected Results

### Tool Count Changes

| Category | Before | After | Change |
|----------|--------|-------|--------|
| System Tools | 7 | 7 | No change |
| Messaging | 4 | 4 | No change |
| Thread Management | 8 | 4 | -4 (removed broken ones) |
| Workflow | 6 | 6 | No change |
| **Total Existing** | **25** | **21** | **-4** |

### Files Modified

- ✅ Remove implementations from thread tool files
- ✅ Update factory registration 
- ✅ Clean up type definitions
- ✅ Update system tool registry
- ✅ Remove dead cursor-related code

### Architecture Improvements

- ✅ No more invalid_cursor errors
- ✅ Cleaner tool registry
- ✅ Reduced complexity
- ✅ Better reliability

---

## 🧪 Testing Plan

### Test 1: Build Verification
```bash
npm run build
# Should compile without errors
```

### Test 2: Tool Registry Check
```bash
cd test-client && npx tsx src/test-tools.ts
# Should show 21 working tools (down from 25)
```

### Test 3: No Broken Tools
- Verify removed tools no longer appear in tool list
- Confirm no invalid_cursor errors in any remaining tools

---

## ✅ Success Criteria

### Functional Requirements
- ✅ **4 Broken Tools Removed** - No more invalid_cursor errors
- ✅ **Build Success** - All TypeScript compilation successful  
- ✅ **Tool Registry Updated** - Correct tool counts and categories
- ✅ **No Dead Code** - Unused cursor code removed

### Quality Requirements  
- ✅ **Clean Architecture** - No broken or incomplete features
- ✅ **Updated Documentation** - Accurate tool counts everywhere
- ✅ **Test Compatibility** - All tests pass with reduced tool set

---

## 📋 Next Sprint Preview

**Sprint 4.2: Simple Data Tools Implementation**
- Add 5 new data retrieval tools to replace removed functionality
- Use simple API calls without complex pagination
- Target: 26 total tools (21 existing + 5 new)

---

**🎯 Sprint 4.1 Goal**: Clean, working tool set with no broken features, ready for Phase 4 tool additions.

_📅 Created: 2025-08-08 | Status: 📋 PLANNED | Focus: Tool Cleanup_