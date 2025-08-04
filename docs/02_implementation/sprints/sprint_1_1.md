# Sprint 1.1: MCP Server Core Setup

> **Phase**: 1 - Foundation  
> **Duration**: Aug 5-11, 2025 (1 week)  
> **Goal**: Establish project foundation và basic MCP server infrastructure

---

## 🎯 Sprint Objectives

### Primary Goals
1. **Project Setup**: Complete TypeScript/Node.js project initialization
2. **MCP Framework**: Basic MCP server với stdio transport
3. **Development Environment**: Setup build system và tooling
4. **Proof of Concept**: Verify MCP connection với Claude Desktop

### Success Metrics
- ✅ Project builds without errors
- ✅ MCP server starts và accepts connections  
- ✅ Claude Desktop can discover và connect to server
- ✅ Basic tool registration system works

---

## 📋 Detailed Tasks

### Day 1-2: Project Foundation
**Task 1.1.1: Project Structure Setup**
- [ ] Initialize npm project với TypeScript
- [ ] Setup tsconfig.json với proper ES2022 config
- [ ] Create src/ directory structure:
  ```
  src/
  ├── index.ts           # Entry point
  ├── server.ts          # MCP Server core
  ├── tools/             # Tools directory
  │   └── index.ts       # Tools registry
  ├── transport/         # Transport layer
  │   └── stdio.ts       # Stdio transport
  └── utils/             # Utilities
      ├── logger.ts      # Logging
      └── config.ts      # Configuration
  ```
- [ ] Install core dependencies:
  - `@modelcontextprotocol/sdk`
  - `typescript`, `ts-node`
  - `winston` (logging)
  - `dotenv` (environment)

**Task 1.1.2: Build System**
- [ ] Setup package.json scripts:
  - `build`: TypeScript compilation  
  - `start`: Run compiled server
  - `dev`: Development mode với ts-node
- [ ] Configure ESLint + Prettier
- [ ] Setup .gitignore với proper exclusions

### Day 3-4: MCP Server Core

**Task 1.1.3: Basic MCP Server**
- [ ] Implement `src/server.ts`:
  - MCP Server initialization
  - Server capabilities declaration
  - Basic error handling
- [ ] Implement `src/transport/stdio.ts`:
  - Stdio transport setup
  - Connection handling
- [ ] Implement `src/index.ts`:
  - CLI argument parsing
  - Server startup
  - Graceful shutdown

**Task 1.1.4: Tools Registry Foundation**
- [ ] Create `src/tools/index.ts`:
  - Tool registration interface
  - Tool discovery mechanism
  - Basic tool execution framework
- [ ] Implement dummy tools for testing:
  - `ping` tool - Simple connectivity test
  - `echo` tool - Parameter validation test

### Day 5-6: Integration & Testing

**Task 1.1.5: Development Environment**
- [ ] Create environment configuration:
  - `.env.example` với required variables
  - `src/utils/config.ts` - Config management
- [ ] Setup logging system:
  - `src/utils/logger.ts` - Winston integration
  - Log levels và formatting
  - Development vs production configs

**Task 1.1.6: Claude Desktop Integration**
- [ ] Create `claude_desktop_config.json` example
- [ ] Test MCP server discovery
- [ ] Verify tool listing works
- [ ] Test basic tool execution

### Day 7: Documentation & Validation

**Task 1.1.7: Basic Documentation**
- [ ] Update project README.md:
  - Project description
  - Quick start guide
  - Development setup
- [ ] Create `docs/02_implementation/dev_setup.md`
- [ ] Document build và run processes

**Task 1.1.8: Sprint Validation**
- [ ] End-to-end test: Claude Desktop → MCP Server → Tool execution
- [ ] Performance baseline measurement
- [ ] Code review và cleanup
- [ ] Sprint retrospective

---

## 🛠️ Technical Specifications

### Dependencies
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "winston": "^3.11.0",
    "dotenv": "^16.3.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0",
    "@types/node": "^20.0.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0"
  }
}
```

### File Structure Target
```
slack-mcp-server/
├── src/
│   ├── index.ts              ✅ Entry point
│   ├── server.ts             ✅ MCP Server core  
│   ├── tools/
│   │   └── index.ts          ✅ Tools registry
│   ├── transport/
│   │   └── stdio.ts          ✅ Stdio transport
│   └── utils/
│       ├── logger.ts         ✅ Logging
│       └── config.ts         ✅ Configuration
├── package.json              ✅ Node.js project
├── tsconfig.json             ✅ TypeScript config
├── .env.example              ✅ Environment template
└── README.md                 ✅ Documentation
```

---

## 🚨 Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| MCP SDK learning curve | Medium | Medium | Start với simple examples, refer docs |
| Claude Desktop integration issues | Medium | High | Test early, có fallback SSE transport |
| TypeScript configuration complexity | Low | Low | Use proven configurations |

---

## 📊 Definition of Done

### Technical Criteria
- [ ] Code compiles without TypeScript errors
- [ ] All linting rules pass
- [ ] Basic test coverage implemented
- [ ] Error handling in place

### Functional Criteria  
- [ ] MCP server starts successfully
- [ ] Claude Desktop discovers server
- [ ] At least 2 dummy tools work end-to-end
- [ ] Logging system operational

### Documentation Criteria
- [ ] README.md updated với setup instructions
- [ ] Code commented appropriately
- [ ] Environment configuration documented

---

## 🔄 Handoff to Sprint 1.2

### Deliverables Ready for Next Sprint
1. **Working MCP server** - Ready for tool development
2. **Development environment** - Build system + tooling configured
3. **Documentation foundation** - Setup guides available
4. **Testing framework** - Ready for Slack integration testing

### Next Sprint Preview
Sprint 1.2 sẽ focus vào tool architecture và advanced development environment:
- Tool interface design
- Testing framework setup  
- Advanced logging và monitoring
- Development workflow optimization

---

*📅 **Created**: 2025-08-05*  
*🔄 **Status**: Ready to start*  
*👤 **Sprint Lead**: Development Team*
