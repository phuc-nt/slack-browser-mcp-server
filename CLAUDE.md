## PHẦN 1: QUY TẮC CHUNG (Reusable across projects)

## PHẦN 1: QUY TẮC CHUNG (Reusable across projects)

### Quy tắc cơ bản

- **Luôn sử dụng tiếng Việt để trả lời** trừ khi user yêu cầu tiếng Anh cụ thể
- Đọc project documentation trước khi bắt đầu bất kỳ task nào
- Tuân thủ workflow đã được định nghĩa trong project

### Git Commit Guidelines

- **Không sử dụng emoji** trong commit messages
- **Không thêm thông tin về Claude Code** hoặc AI tools trong commit message
- Sử dụng conventional commit format: `type: description`
- Ví dụ: `feat: add user authentication`, `fix: resolve memory leak in chat view`

---

## PHẦN 2: SLACK MCP SERVER PROJECT RULES

### 📖 Workflow Khởi Động (Mỗi session)

1. **LUÔN chạy "read Serena's initial instructions"** - Kích hoạt Serena MCP cho semantic search và code analysis
2. **Đọc docs/START_POINT.md** - Hiểu project status và current focus
3. **Đọc docs/03_implementation/current_sprint.md** - Tasks chi tiết tuần này
4. **Check current working files** - Files đang được implement

### 🔄 Task Management Process

```yaml
Task Lifecycle:
  1. Identify task: Từ current sprint hoặc user request
  2. Focus mode: Làm từng task một, không jump around
  3. Update progress: Cập nhật sprint doc khi complete
  4. Commit clean: Clear commit message theo convention
  5. Update status: Cập nhật START_POINT.md nếu có major change

Quality Gates:
  - Code compile: npm run build thành công
  - Tests pass: npm test pass (nếu có tests)
  - No token leaks: Không commit sensitive data
  - Documentation: Update docs nếu có API changes
```

### 📋 Checklist System (Simplified)

```markdown
# Mỗi task phải có checklist format:

## [TASK] Task Name

### Context: Tại sao cần làm task này

### Implementation:

- [ ] Step 1 with specific file (Est: 30min)
- [ ] Step 2 with verification (Est: 15min)
- [ ] Testing and validation (Est: 15min)

### Completion:

- [ ] Code works as expected
- [ ] Documentation updated if needed
- [ ] Sprint status updated
```

### 🎯 Documentation Rules

```yaml
Document Hierarchy:
  START_POINT.md: Central hub - overview only, link to details
  project_roadmap.md: Complete timeline, phases, results
  sprint_*.md: Detailed implementation tasks
  context/*.md: Technical specs, requirements, architecture

Update Rules:
  START_POINT.md: Major progress, phase completion
  project_roadmap.md: Phase completion, final results
  current_sprint.md: Daily progress updates
  Never: Requirements, architecture, security docs without approval

Maintenance Principles:
  - AVOID DUPLICATION: Link instead of repeat information
  - KEEP CONCISE: Overview docs stay short, details go in specific docs
  - SINGLE SOURCE OF TRUTH: Each piece of info lives in one place
  - CROSS-REFERENCE: Use links to connect related information
  - STATUS FIRST: Always show current status clearly

Writing Style:
  - Concise và actionable
  - Use status indicators: ✅ 🔄 📋 ❌
  - Include time estimates và actual time
  - Link related documents instead of duplicating content

Document Flow: START_POINT.md → project_roadmap.md → sprint_*.md → specific details
  Never put detailed task lists in overview documents
```

### � Document Cleanup Best Practices

```yaml
Phase Completion:
  - Update roadmap with final results
  - Mark sprint documents as COMPLETED
  - Update START_POINT.md with new phase status
  - NO separate phase completion documents - consolidate into roadmap

Information Architecture:
  - Overview documents: High-level status, links to details
  - Detail documents: Complete information on specific topics
  - Reference documents: Technical specs, requirements, architecture
  - Working documents: Current sprint, daily progress

Link Strategy:
  - Use descriptive anchor links: #phase-1-foundation
  - Always link to authoritative source
  - Update links when documents are reorganized
  - Prefer relative paths: ../context/requirements.md

Redundancy Elimination:
  - Regular audit for duplicate information
  - Consolidate overlapping content
  - Remove outdated task lists from overview docs
  - Keep only current status and next steps in overview
```

```yaml
Security:
  - Never log tokens trong console.log
  - Use environment variables cho sensitive data
  - No hardcoded credentials anywhere
  - Validate inputs from Slack API

Performance:
  - Cache-first strategy cho user/channel data
  - Batch API calls khi possible
  - Memory usage monitoring
  - Response time under 2 seconds for cached operations

Code Quality:
  - TypeScript strict mode
  - Proper error handling với meaningful messages
  - Unit tests cho core functions
  - Clean, readable code với comments
```

### 🤖 Serena MCP Integration

```yaml
Setup Requirements:
  - Serena đã được cài đặt cho project này
  - Codebase đã được indexed với "uvx --from git+https://github.com/oraios/serena index-project"
  - Cache được lưu tại .serena/cache/

Session Activation:
  - BẮT BUỘC: Chạy "read Serena's initial instructions" mỗi session mới
  - Serena cung cấp semantic search và code analysis tools
  - Giúp tìm kiếm code theo ngữ nghĩa thay vì chỉ keyword matching

Available Tools:
  - mcp__serena__search: Semantic search trong codebase
  - mcp__serena__get_instructions: Đọc hướng dẫn Serena
  - mcp__serena__analyze: Phân tích code structure
```
