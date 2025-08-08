# Sprint 4.1: System Tools Migration
> **Phase 4 - Tool-Only Architecture: Foundation**  
> **Duration**: Aug 8-9, 2025 (2 days) | **Target**: Convert system resources to tools + foundation

## 📋 Sprint Overview

**Sprint 4.1 Goal**: Establish foundation cho tool-only architecture bằng cách convert 4 system resources thành tools và build core infrastructure cho Phase 4.

### 🎯 Sprint Objectives

1. **System Resource Migration**: Convert 4 system resources → 4 new tools
2. **Foundation Infrastructure**: Build BaseQueryTool class và tool patterns
3. **Caching System**: Implement intelligent tool-level caching
4. **Response Standardization**: Create unified response formats
5. **Testing Framework**: Setup testing cho new tool architecture

---

## 📊 Current → Target State

### Before (Phase 3): Mixed Architecture
```
System Components:
├── System Tools (2): ping, echo
└── System Resources (4):
    ├── slack://system/status
    ├── slack://system/info  
    ├── slack://tools/registry
    └── slack://system/metrics
```

### After (Sprint 4.1): Tool-Only Foundation
```
System Tools (6):
├── ping (existing)
├── echo (existing)
├── get_system_status (new)
├── get_system_info (new)
├── get_tool_registry (new)
└── get_system_metrics (new)
```

---

## 🛠️ Implementation Plan

### Day 1: Foundation Architecture (8 hours)

#### Morning (4 hours): Core Infrastructure
- **Hour 1-2**: Design BaseQueryTool abstract class
- **Hour 3-4**: Implement caching system architecture

**BaseQueryTool Implementation:**
```typescript
// src/tools/base-query-tool.ts
export abstract class BaseQueryTool extends BaseSlackTool {
  protected cacheEnabled: boolean = true;
  protected cacheTTL: number = 300; // 5 minutes default
  protected maxResults: number = 1000;
  
  // Abstract method for subclasses
  abstract executeQuery(args: any): Promise<any>;
  
  // Standardized execution flow
  async executeImpl(args: any): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      // 1. Validate arguments
      const validation = await this.validateArgs(args);
      if (!validation.isValid) {
        return this.createErrorResult(validation.error);
      }
      
      // 2. Check cache if enabled
      let result: any;
      let source = 'api';
      
      if (this.cacheEnabled) {
        const cacheKey = this.getCacheKey(args);
        const cachedResult = await CacheManager.get(cacheKey);
        if (cachedResult) {
          result = cachedResult;
          source = 'cache';
        }
      }
      
      // 3. Execute query if not cached
      if (!result) {
        result = await this.executeQuery(args);
        
        // Cache the result
        if (this.cacheEnabled && result) {
          const cacheKey = this.getCacheKey(args);
          await CacheManager.set(cacheKey, result, this.cacheTTL);
        }
      }
      
      // 4. Return standardized response
      return this.createSuccessResult(result, {
        source,
        execution_time_ms: Date.now() - startTime,
        cached: source === 'cache'
      });
      
    } catch (error) {
      logger.error(`Query tool execution failed: ${this.getDefinition().name}`, {
        error: error.message,
        args
      });
      
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Query execution failed'
      );
    }
  }
  
  // Helper methods
  protected getCacheKey(args: any): string {
    const toolName = this.getDefinition().name;
    const argsHash = this.hashArgs(args);
    return `tool:${toolName}:${argsHash}`;
  }
  
  protected createSuccessResult(data: any, metadata: any = {}): ToolResult {
    return {
      success: true,
      data: {
        success: true,
        data,
        metadata: {
          timestamp: new Date().toISOString(),
          tool: this.getDefinition().name,
          ...metadata
        }
      }
    };
  }
  
  protected createErrorResult(error: string): ToolResult {
    return {
      success: false,
      error,
      data: {
        success: false,
        error,
        metadata: {
          timestamp: new Date().toISOString(),
          tool: this.getDefinition().name
        }
      }
    };
  }
}
```

**Caching System Design:**
```typescript
// src/cache/tool-cache.ts
export class CacheManager {
  private static cache = new Map<string, CacheEntry>();
  
  static async get(key: string): Promise<any> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  static async set(key: string, data: any, ttlSeconds: number): Promise<void> {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttlSeconds * 1000),
      createdAt: Date.now()
    });
  }
  
  static getCacheStats(): CacheStats {
    return {
      totalEntries: this.cache.size,
      memoryUsage: this.estimateMemoryUsage(),
      hitRatio: this.calculateHitRatio()
    };
  }
}
```

#### Afternoon (4 hours): System Tools Implementation
- **Hour 5-6**: Implement get_system_status tool
- **Hour 7-8**: Implement get_system_info tool

**System Status Tool:**
```typescript
// src/tools/system/get-system-status.ts
export class GetSystemStatusTool extends BaseQueryTool {
  protected cacheEnabled = true;
  protected cacheTTL = 60; // 1 minute for system status
  
  getDefinition(): SlackTool {
    return {
      name: 'get_system_status',
      description: 'Get current system status, health metrics, and operational information',
      category: 'system',
      tags: ['system', 'health', 'monitoring'],
      inputSchema: {
        type: 'object',
        properties: {
          include_detailed: {
            type: 'boolean',
            description: 'Include detailed system metrics',
            default: false
          },
          format: {
            type: 'string',
            enum: ['json', 'summary'],
            description: 'Response format',
            default: 'json'
          }
        }
      }
    };
  }
  
  async executeQuery(args: GetSystemStatusArgs): Promise<SystemStatus> {
    const uptime = process.uptime();
    const memory = process.memoryUsage();
    
    const status: SystemStatus = {
      server: 'Slack MCP Server',
      version: '2.0.0',
      status: 'operational',
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(uptime),
      uptime_formatted: this.formatUptime(uptime),
      tools: {
        total: await this.getToolCount(),
        categories: await this.getToolCategories()
      },
      performance: {
        memory_usage_mb: Math.round(memory.heapUsed / 1024 / 1024),
        memory_total_mb: Math.round(memory.heapTotal / 1024 / 1024)
      }
    };
    
    if (args.include_detailed) {
      status.detailed_metrics = {
        memory: {
          rss: memory.rss,
          heapTotal: memory.heapTotal,
          heapUsed: memory.heapUsed,
          external: memory.external,
          arrayBuffers: memory.arrayBuffers
        },
        cache: CacheManager.getCacheStats(),
        tools: await this.getDetailedToolStats()
      };
    }
    
    return args.format === 'summary' ? this.formatSummary(status) : status;
  }
  
  private formatSummary(status: SystemStatus): SystemStatusSummary {
    return {
      status: status.status,
      uptime: status.uptime_formatted,
      tools_count: status.tools.total,
      memory_usage: `${status.performance.memory_usage_mb}MB`
    };
  }
}
```

### Day 2: Tool Registry & Metrics (8 hours)

#### Morning (4 hours): Tool Registry Tool
- **Hour 1-2**: Implement get_tool_registry tool
- **Hour 3-4**: Add advanced filtering capabilities

**Tool Registry Implementation:**
```typescript
// src/tools/system/get-tool-registry.ts
export class GetToolRegistryTool extends BaseQueryTool {
  protected cacheEnabled = true;
  protected cacheTTL = 300; // 5 minutes
  
  getDefinition(): SlackTool {
    return {
      name: 'get_tool_registry',
      description: 'Get information about registered tools and their capabilities',
      category: 'system',
      tags: ['tools', 'registry', 'metadata'],
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Filter by tool category',
            enum: ['system', 'messaging', 'thread', 'workflow', 'slack', 'search']
          },
          name_pattern: {
            type: 'string',
            description: 'Filter tools by name pattern (regex supported)'
          },
          include_schema: {
            type: 'boolean',
            description: 'Include input schema details',
            default: false
          },
          include_stats: {
            type: 'boolean', 
            description: 'Include usage statistics',
            default: false
          }
        }
      }
    };
  }
  
  async executeQuery(args: GetToolRegistryArgs): Promise<ToolRegistryResponse> {
    const toolRegistry = this.getToolRegistry();
    let tools = await toolRegistry.getAllToolInstances();
    
    // Apply filters
    if (args.category) {
      tools = tools.filter(tool => 
        tool.getDefinition().category === args.category
      );
    }
    
    if (args.name_pattern) {
      const pattern = new RegExp(args.name_pattern, 'i');
      tools = tools.filter(tool =>
        pattern.test(tool.getDefinition().name)
      );
    }
    
    // Format response
    const toolDetails = await Promise.all(
      tools.map(tool => this.formatToolDetails(tool, args))
    );
    
    return {
      total_tools: toolDetails.length,
      categories: this.getCategoryStats(tools),
      tools: toolDetails,
      metadata: {
        filters_applied: {
          category: args.category || null,
          name_pattern: args.name_pattern || null
        },
        include_schema: args.include_schema || false,
        include_stats: args.include_stats || false
      }
    };
  }
  
  private async formatToolDetails(tool: BaseSlackTool, args: GetToolRegistryArgs) {
    const definition = tool.getDefinition();
    
    const details: ToolDetails = {
      name: definition.name,
      description: definition.description,
      category: definition.category,
      tags: definition.tags || [],
      requires_auth: definition.requiresAuth || false
    };
    
    if (args.include_schema) {
      details.input_schema = definition.inputSchema;
    }
    
    if (args.include_stats) {
      details.usage_stats = await this.getToolUsageStats(definition.name);
    }
    
    return details;
  }
}
```

#### Afternoon (4 hours): System Metrics Tool
- **Hour 5-6**: Implement get_system_metrics tool
- **Hour 7-8**: Add performance tracking capabilities

**System Metrics Tool:**
```typescript
// src/tools/system/get-system-metrics.ts
export class GetSystemMetricsTool extends BaseQueryTool {
  protected cacheEnabled = true;
  protected cacheTTL = 30; // 30 seconds for real-time metrics
  
  getDefinition(): SlackTool {
    return {
      name: 'get_system_metrics',
      description: 'Get comprehensive system performance metrics and statistics',
      category: 'system',
      tags: ['metrics', 'performance', 'monitoring'],
      inputSchema: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['current', '1m', '5m', '15m', '1h'],
            description: 'Metrics time period',
            default: 'current'
          },
          include_tools: {
            type: 'boolean',
            description: 'Include per-tool metrics',
            default: true
          },
          include_cache: {
            type: 'boolean',
            description: 'Include cache performance metrics',
            default: true
          },
          format: {
            type: 'string',
            enum: ['detailed', 'summary'],
            default: 'detailed'
          }
        }
      }
    };
  }
  
  async executeQuery(args: GetSystemMetricsArgs): Promise<SystemMetrics> {
    const startTime = Date.now();
    
    const metrics: SystemMetrics = {
      timestamp: new Date().toISOString(),
      period: args.period,
      server: await this.getServerMetrics(),
      memory: this.getMemoryMetrics(),
      performance: await this.getPerformanceMetrics(args.period)
    };
    
    if (args.include_tools) {
      metrics.tools = await this.getToolMetrics(args.period);
    }
    
    if (args.include_cache) {
      metrics.cache = CacheManager.getCacheStats();
    }
    
    metrics.metadata = {
      collection_time_ms: Date.now() - startTime,
      metrics_version: '1.0.0'
    };
    
    return args.format === 'summary' 
      ? this.formatMetricsSummary(metrics)
      : metrics;
  }
  
  private async getPerformanceMetrics(period: string): Promise<PerformanceMetrics> {
    return {
      uptime_seconds: Math.floor(process.uptime()),
      cpu_usage: await this.getCPUUsage(),
      memory_usage: {
        heap_used_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external_mb: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      event_loop_delay: await this.getEventLoopDelay(),
      gc_stats: await this.getGCStats()
    };
  }
}
```

---

## 🧪 Testing Strategy

### Unit Testing
```typescript
// tests/tools/system/get-system-status.test.ts
describe('GetSystemStatusTool', () => {
  let tool: GetSystemStatusTool;
  
  beforeEach(() => {
    tool = new GetSystemStatusTool();
  });
  
  describe('basic functionality', () => {
    it('should return system status without detailed metrics', async () => {
      const result = await tool.execute({}, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.data.data).toHaveProperty('status', 'operational');
      expect(result.data.data).toHaveProperty('uptime_seconds');
      expect(result.data.data).not.toHaveProperty('detailed_metrics');
    });
    
    it('should include detailed metrics when requested', async () => {
      const result = await tool.execute(
        { include_detailed: true }, 
        mockContext
      );
      
      expect(result.success).toBe(true);
      expect(result.data.data).toHaveProperty('detailed_metrics');
      expect(result.data.data.detailed_metrics).toHaveProperty('memory');
      expect(result.data.data.detailed_metrics).toHaveProperty('cache');
    });
  });
  
  describe('caching behavior', () => {
    it('should cache results for subsequent calls', async () => {
      const result1 = await tool.execute({}, mockContext);
      const result2 = await tool.execute({}, mockContext);
      
      expect(result1.data.metadata.source).toBe('api');
      expect(result2.data.metadata.source).toBe('cache');
    });
  });
  
  describe('format options', () => {
    it('should return summary format when requested', async () => {
      const result = await tool.execute(
        { format: 'summary' }, 
        mockContext
      );
      
      expect(result.data.data).toHaveProperty('status');
      expect(result.data.data).toHaveProperty('uptime');
      expect(result.data.data).not.toHaveProperty('detailed_metrics');
    });
  });
});
```

### Integration Testing
```typescript
// tests/integration/system-tools.test.ts
describe('System Tools Integration', () => {
  let toolRegistry: ToolRegistry;
  
  beforeEach(async () => {
    toolRegistry = new ToolRegistry();
    await toolRegistry.initialize();
  });
  
  it('should have all 6 system tools registered', () => {
    const systemTools = toolRegistry.getToolsByCategory('system');
    expect(systemTools).toHaveLength(6);
    
    const toolNames = systemTools.map(t => t.getDefinition().name);
    expect(toolNames).toContain('ping');
    expect(toolNames).toContain('echo');
    expect(toolNames).toContain('get_system_status');
    expect(toolNames).toContain('get_system_info');
    expect(toolNames).toContain('get_tool_registry');
    expect(toolNames).toContain('get_system_metrics');
  });
  
  it('should execute all system tools successfully', async () => {
    const systemTools = toolRegistry.getToolsByCategory('system');
    
    for (const tool of systemTools) {
      const result = await toolRegistry.executeTool(
        tool.getDefinition().name,
        {},
        mockContext
      );
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('success', true);
    }
  });
});
```

---

## 📊 Success Criteria

### Functional Requirements
- ✅ BaseQueryTool abstract class implemented
- ✅ 4 system tools created và functional
- ✅ Tool-level caching system operational  
- ✅ Standardized response format across all tools
- ✅ Comprehensive parameter validation

### Performance Requirements
- ✅ System tools response time <100ms (cached)
- ✅ System tools response time <500ms (fresh)
- ✅ Cache hit ratio >70% for system tools
- ✅ Memory usage impact <10MB for caching system

### Quality Requirements
- ✅ 100% unit test coverage for new tools
- ✅ Integration tests passing for all system tools
- ✅ Comprehensive error handling implemented
- ✅ Clear documentation for BaseQueryTool pattern

---

## 🚨 Risk Management

### Technical Risks
1. **Caching Complexity**: Memory management cho tool-level cache
   - **Mitigation**: Implement LRU eviction, memory monitoring
   
2. **Performance Overhead**: Tool execution vs direct resource access
   - **Mitigation**: Benchmark all tools, optimize hot paths
   
3. **Breaking Changes**: Changing system endpoints
   - **Mitigation**: Run parallel with resources during development

### Timeline Risks
1. **BaseQueryTool Complexity**: Foundation class more complex than expected
   - **Buffer**: Allocate extra 4 hours in Day 1 afternoon
   
2. **Testing Coverage**: Comprehensive testing takes longer
   - **Mitigation**: Focus on critical paths first, expand coverage later

---

## 📈 Performance Benchmarks

### Target Metrics
```typescript
interface SystemToolBenchmarks {
  get_system_status: {
    response_time_ms: 50,    // <100ms target
    cache_hit_ratio: 80,     // >70% target
    memory_overhead_mb: 2    // <5MB target
  };
  get_system_info: {
    response_time_ms: 30,
    cache_hit_ratio: 90,     // Static data
    memory_overhead_mb: 1
  };
  get_tool_registry: {
    response_time_ms: 100,   // More complex
    cache_hit_ratio: 75,
    memory_overhead_mb: 3
  };
  get_system_metrics: {
    response_time_ms: 150,   // Real-time data
    cache_hit_ratio: 60,     // Shorter TTL
    memory_overhead_mb: 2
  };
}
```

### Monitoring Setup
- Tool execution time tracking
- Cache performance metrics
- Memory usage monitoring  
- Error rate tracking
- Response format validation

---

**🎯 Sprint 4.1 Goal**: Establish robust foundation cho tool-only architecture với system tools conversion và core infrastructure.

_📅 Created: 2025-08-08 | Target: 2025-08-09 | Status: PLANNED_