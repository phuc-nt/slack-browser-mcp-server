import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { EnhancedToolFactory } from './factory.js';
import {
  ToolMiddleware,
  ToolMetrics,
  ToolRegistryConfig,
  ToolContext,
  ToolExecutionResult,
} from '../types/tools.js';
import { ConversationsPlaceholder } from './conversations.js';
import { SearchPlaceholder } from './search.js';
import { listChannels, listUsers, getChannelHistory } from './slack-channels.js';
import { logger } from '../utils/logger.js';

// Export types for convenience
export { ToolExecutionResult, ToolHandler } from '../types/tools.js';

export class ToolRegistry {
  private factory: EnhancedToolFactory;
  private middleware: ToolMiddleware[] = [];
  private metrics: Map<string, ToolMetrics> = new Map();
  private config: ToolRegistryConfig;
  private isInitialized = false;
  private concurrentExecutions = 0;

  constructor(config?: Partial<ToolRegistryConfig>) {
    this.config = {
      enableMetrics: true,
      enableTracing: true,
      defaultTimeout: 30000,
      maxConcurrentExecutions: 10,
      middleware: [],
      ...config,
    };

    this.factory = new EnhancedToolFactory();
    this.middleware = [...this.config.middleware];

    logger.info('Enhanced ToolRegistry initialized', {
      enableMetrics: this.config.enableMetrics,
      enableTracing: this.config.enableTracing,
      maxConcurrentExecutions: this.config.maxConcurrentExecutions,
    });
  }

  /**
   * Initialize registry with discovery and validation
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('ToolRegistry already initialized');
      return;
    }

    try {
      // Load built-in tools
      await this.loadBuiltInTools();

      // Load placeholder definitions for future Slack tools
      await this.loadPlaceholderTools();

      // Initialize metrics
      if (this.config.enableMetrics) {
        this.initializeMetrics();
      }

      this.isInitialized = true;

      logger.info('ToolRegistry initialization completed', {
        toolCount: this.factory.getAllToolInstances().length,
        categories: this.factory.getStats().categoryCounts,
      });
    } catch (error) {
      logger.error('ToolRegistry initialization failed', error);
      throw error;
    }
  }

  /**
   * Load built-in tools (ping, echo)
   */
  private async loadBuiltInTools(): Promise<void> {
    // Built-in tools are already registered in the factory constructor
    const stats = this.factory.getStats();
    logger.info('Built-in tools loaded', {
      count: stats.instances,
      tools: this.factory.getRegisteredTools(),
    });
  }

  /**
   * Load placeholder tool definitions
   */
  private async loadPlaceholderTools(): Promise<void> {
    const placeholderTools = [
      ...ConversationsPlaceholder.getPlaceholderTools(),
      ...SearchPlaceholder.getPlaceholderTools(),
    ];

    logger.info('Loading placeholder tools for future Slack integration', {
      count: placeholderTools.length,
    });

    // Note: These are just definitions, actual implementations will come in Phase 2
    for (const tool of placeholderTools) {
      logger.debug('Placeholder tool registered', {
        name: tool.name,
        category: tool.category,
        requiresAuth: tool.requiresAuth,
      });
    }
  }

  /**
   * Initialize metrics collection
   */
  private initializeMetrics(): void {
    const instances = this.factory.getAllToolInstances();

    for (const instance of instances) {
      const definition = instance.getDefinition();
      this.metrics.set(definition.name, {
        toolName: definition.name,
        executionCount: 0,
        totalExecutionTime: 0,
        averageExecutionTime: 0,
        errorCount: 0,
        lastExecuted: new Date(),
        cacheHitRate: 0,
      });
    }

    logger.debug('Metrics initialized for tools', {
      toolCount: this.metrics.size,
    });
  }

  /**
   * Register middleware
   */
  registerMiddleware(middleware: ToolMiddleware): void {
    this.middleware.push(middleware);
    this.middleware.sort((a, b) => b.priority - a.priority);

    logger.debug('Middleware registered', {
      name: middleware.name,
      priority: middleware.priority,
      totalMiddleware: this.middleware.length,
    });
  }

  /**
   * Get all available tools for MCP
   */
  getTools(): Tool[] {
    const instances = this.factory.getAllToolInstances();

    return instances.map((instance) => {
      const definition = instance.getDefinition();
      return {
        name: definition.name,
        description: definition.description,
        inputSchema: {
          type: 'object' as const,
          properties: definition.inputSchema.properties || {},
          required: definition.inputSchema.required || [],
        },
      };
    });
  }

  /**
   * Execute tool with comprehensive lifecycle management
   */
  async executeTool(name: string, args: Record<string, unknown>): Promise<ToolExecutionResult> {
    // Check concurrency limits
    if (this.concurrentExecutions >= this.config.maxConcurrentExecutions) {
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: 'Error: Maximum concurrent executions exceeded. Please try again later.',
          },
        ],
        isError: true,
      };
    }

    this.concurrentExecutions++;

    try {
      const context: ToolContext = {
        toolName: name,
        startTime: Date.now(),
        traceId: this.generateTraceId(),
        metadata: {
          concurrentExecutions: this.concurrentExecutions,
        },
      };

      logger.debug('Tool execution started', {
        toolName: name,
        traceId: context.traceId,
        args,
      });

      // Execute middleware beforeTool hooks
      await this.executeMiddlewareBefore(context, args);

      // Execute the tool
      const result = await this.factory.executeTool(name, args, context);

      // Update metrics
      if (this.config.enableMetrics) {
        this.updateMetrics(name, result);
      }

      // Execute middleware after hooks
      await this.executeMiddlewareAfter(context, result);

      // Convert to MCP format
      const mcpResult = this.convertToMCPResult(result);

      logger.debug('Tool execution completed', {
        toolName: name,
        traceId: context.traceId,
        success: result.success,
        executionTime: result.metadata?.executionTime,
      });

      return mcpResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Tool execution failed', {
        toolName: name,
        error: errorMessage,
      });

      // Update error metrics
      if (this.config.enableMetrics) {
        this.updateErrorMetrics(name);
      }

      return {
        success: false,
        content: [
          {
            type: 'text',
            text: `Error executing tool ${name}: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    } finally {
      this.concurrentExecutions--;
    }
  }

  /**
   * Execute middleware before hooks
   */
  private async executeMiddlewareBefore(context: ToolContext, args: any): Promise<void> {
    for (const middleware of this.middleware) {
      if (middleware.before) {
        try {
          await middleware.before(context, args);
        } catch (error) {
          logger.warn('Middleware before hook failed', {
            middleware: middleware.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }
  }

  /**
   * Execute middleware after hooks
   */
  private async executeMiddlewareAfter(
    context: ToolContext,
    result: ToolExecutionResult
  ): Promise<void> {
    for (const middleware of this.middleware) {
      if (middleware.after) {
        try {
          await middleware.after(context, result);
        } catch (error) {
          logger.warn('Middleware after hook failed', {
            middleware: middleware.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }
  }

  /**
   * Update tool metrics
   */
  private updateMetrics(toolName: string, result: ToolExecutionResult): void {
    const metrics = this.metrics.get(toolName);
    if (!metrics) return;

    metrics.executionCount++;
    metrics.lastExecuted = new Date();

    if (result.metadata?.executionTime) {
      metrics.totalExecutionTime += result.metadata.executionTime;
      metrics.averageExecutionTime = metrics.totalExecutionTime / metrics.executionCount;
    }

    if (!result.success) {
      metrics.errorCount++;
    }

    if (result.metadata?.cacheHits && result.metadata?.apiCalls) {
      const totalRequests = result.metadata.cacheHits + result.metadata.apiCalls;
      metrics.cacheHitRate =
        totalRequests > 0 ? (result.metadata.cacheHits / totalRequests) * 100 : 0;
    }
  }

  /**
   * Update error metrics
   */
  private updateErrorMetrics(toolName: string): void {
    const metrics = this.metrics.get(toolName);
    if (metrics) {
      metrics.errorCount++;
    }
  }

  /**
   * Convert internal result to MCP format
   */
  private convertToMCPResult(result: ToolExecutionResult): ToolExecutionResult {
    if (result.success && result.data) {
      return {
        success: true,
        content: [
          {
            type: 'text',
            text:
              typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2),
          },
        ],
      };
    } else {
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: result.error || 'Unknown error occurred',
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Generate trace ID for request tracking
   */
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get registry statistics
   */
  getStats() {
    return {
      ...this.factory.getStats(),
      isInitialized: this.isInitialized,
      concurrentExecutions: this.concurrentExecutions,
      maxConcurrentExecutions: this.config.maxConcurrentExecutions,
      middlewareCount: this.middleware.length,
      metricsEnabled: this.config.enableMetrics,
    };
  }

  /**
   * Get tool metrics
   */
  getToolMetrics(): ToolMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Reset tool metrics
   */
  resetMetrics(): void {
    for (const metrics of this.metrics.values()) {
      metrics.executionCount = 0;
      metrics.totalExecutionTime = 0;
      metrics.averageExecutionTime = 0;
      metrics.errorCount = 0;
      metrics.cacheHitRate = 0;
    }

    logger.info('Tool metrics reset');
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    logger.info('ToolRegistry cleanup started');

    // Cleanup all tool instances
    const instances = this.factory.getAllToolInstances();
    for (const instance of instances) {
      if (instance.cleanup) {
        try {
          await instance.cleanup();
        } catch (error) {
          logger.warn('Tool cleanup failed', {
            toolName: instance.getDefinition().name,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    // Clear caches
    this.factory.clearCaches();
    this.metrics.clear();

    logger.info('ToolRegistry cleanup completed');
  }
}

// Re-export types and factory for external use
export { EnhancedToolFactory } from './factory.js';
export { BaseSlackTool } from './base.js';
export * from '../types/tools.js';
