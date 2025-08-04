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
1. **Đọc docs/START_POINT.md** - Hiểu project status và current focus
2. **Đọc docs/03_implementation/current_sprint.md** - Tasks chi tiết tuần này
3. **Check current working files** - Files đang được implement

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
Update Rules:
  START_POINT.md: Khi có major progress hoặc status change
  current_sprint.md: Daily progress updates
  roadmap.md: End of phase updates

Writing Style:
  - Concise và actionable
  - Use status indicators: ✅ 🔄 📋 ❌
  - Include time estimates và actual time
  - Link related documents
  
Never Update Without Context:
  - Requirements documents (SRS)
  - Architecture decisions
  - Security-related docs
```

### 🔐 Security & Performance Standards
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
