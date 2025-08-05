import { ToolMiddleware, ToolContext, ToolExecutionResult } from '../types/tools.js';
import { logger } from '../utils/logger.js';

/**
 * Development logging middleware
 */
export class LoggingMiddleware implements ToolMiddleware {
  name = 'LoggingMiddleware';
  priority = 100;

  async before(context: ToolContext, args: any): Promise<void> {
    logger.debug('Tool execution starting', {
      toolName: context.toolName,
      traceId: context.traceId,
      startTime: context.startTime,
      args: this.sanitizeArgs(args),
      metadata: context.metadata
    });
  }

  async after(context: ToolContext, result: ToolExecutionResult): Promise<void> {
    const executionTime = Date.now() - context.startTime;
    
    if (result.success) {
      logger.info('Tool execution completed successfully', {
        toolName: context.toolName,
        traceId: context.traceId,
        executionTime,
        success: result.success,
        hasData: !!result.data,
        metadata: result.metadata
      });
    } else {
      logger.warn('Tool execution failed', {
        toolName: context.toolName,
        traceId: context.traceId,
        executionTime,
        success: result.success,
        error: result.error,
        errorCode: result.errorCode,
        metadata: result.metadata
      });
    }
  }

  async onError(context: ToolContext, error: Error): Promise<void> {
    const executionTime = Date.now() - context.startTime;
    
    logger.error('Tool execution error', {
      toolName: context.toolName,
      traceId: context.traceId,
      executionTime,
      error: error.message,
      stack: error.stack,
      metadata: context.metadata
    });
  }

  /**
   * Sanitize args to remove sensitive data from logs
   */
  private sanitizeArgs(args: any): any {
    if (!args || typeof args !== 'object') {
      return args;
    }

    const sanitized = { ...args };
    const sensitiveFields = ['token', 'password', 'secret', 'key', 'auth'];
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}

/**
 * Performance monitoring middleware
 */  
export class PerformanceMiddleware implements ToolMiddleware {
  name = 'PerformanceMiddleware';
  priority = 90;
  
  private metrics: Map<string, {
    calls: number;
    totalTime: number;
    avgTime: number;
    minTime: number;
    maxTime: number;
  }> = new Map();

  async before(context: ToolContext, _args: any): Promise<void> {
    // Mark start time for performance tracking
    context.metadata = context.metadata || {};
    context.metadata.perfStart = process.hrtime.bigint();
  }

  async after(context: ToolContext, result: ToolExecutionResult): Promise<void> {
    if (!context.metadata?.perfStart) return;

    const endTime = process.hrtime.bigint();
    const executionTimeNs = Number(endTime - context.metadata.perfStart);
    const executionTimeMs = executionTimeNs / 1_000_000; // Convert to milliseconds

    // Update metrics
    this.updateMetrics(context.toolName, executionTimeMs);

    // Log performance info in debug mode
    logger.debug('Tool performance metrics', {
      toolName: context.toolName,
      traceId: context.traceId,
      executionTimeMs: Math.round(executionTimeMs * 100) / 100,
      success: result.success,
      apiCalls: result.metadata?.apiCalls || 0,
      cacheHits: result.metadata?.cacheHits || 0
    });

    // Warn for slow operations
    if (executionTimeMs > 5000) { // 5 seconds
      logger.warn('Slow tool execution detected', {
        toolName: context.toolName,
        traceId: context.traceId,
        executionTimeMs: Math.round(executionTimeMs * 100) / 100
      });
    }
  }

  private updateMetrics(toolName: string, executionTime: number): void {
    const current = this.metrics.get(toolName) || {
      calls: 0,
      totalTime: 0,
      avgTime: 0,
      minTime: Infinity,
      maxTime: 0
    };

    current.calls++;
    current.totalTime += executionTime;
    current.avgTime = current.totalTime / current.calls;
    current.minTime = Math.min(current.minTime, executionTime);
    current.maxTime = Math.max(current.maxTime, executionTime);

    this.metrics.set(toolName, current);
  }

  /**
   * Get performance metrics for all tools
   */
  getMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {};
    
    for (const [toolName, data] of this.metrics) {
      metrics[toolName] = {
        calls: data.calls,
        totalTimeMs: Math.round(data.totalTime * 100) / 100,
        avgTimeMs: Math.round(data.avgTime * 100) / 100,
        minTimeMs: Math.round(data.minTime * 100) / 100,
        maxTimeMs: Math.round(data.maxTime * 100) / 100
      };
    }
    
    return metrics;
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.metrics.clear();
    logger.info('Performance metrics reset');
  }
}

/**
 * Memory monitoring middleware
 */
export class MemoryMiddleware implements ToolMiddleware {
  name = 'MemoryMiddleware';
  priority = 80;

  async before(context: ToolContext, _args: any): Promise<void> {
    const memUsage = process.memoryUsage();
    
    context.metadata = context.metadata || {};
    context.metadata.memoryBefore = memUsage;

    // Log memory usage in debug mode
    logger.debug('Memory usage before tool execution', {
      toolName: context.toolName,
      traceId: context.traceId,
      memoryMB: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      }
    });
  }

  async after(context: ToolContext, _result: ToolExecutionResult): Promise<void> {
    const memUsage = process.memoryUsage();
    const memBefore = context.metadata?.memoryBefore;
    
    if (memBefore) {
      const memDiff = {
        rss: memUsage.rss - memBefore.rss,
        heapTotal: memUsage.heapTotal - memBefore.heapTotal,
        heapUsed: memUsage.heapUsed - memBefore.heapUsed,
        external: memUsage.external - memBefore.external
      };

      logger.debug('Memory usage after tool execution', {
        toolName: context.toolName,
        traceId: context.traceId,
        memoryMB: {
          rss: Math.round(memUsage.rss / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024)
        },
        memoryDiffMB: {
          rss: Math.round(memDiff.rss / 1024 / 1024),
          heapTotal: Math.round(memDiff.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memDiff.heapUsed / 1024 / 1024),
          external: Math.round(memDiff.external / 1024 / 1024)
        }
      });

      // Warn for significant memory increases
      if (memDiff.heapUsed > 50 * 1024 * 1024) { // 50MB
        logger.warn('Significant memory increase detected', {
          toolName: context.toolName,
          traceId: context.traceId,
          heapIncreaseMB: Math.round(memDiff.heapUsed / 1024 / 1024)
        });
      }
    }

    // Log warning if total memory usage is high
    const totalMemoryMB = memUsage.rss / 1024 / 1024;
    if (totalMemoryMB > 500) { // 500MB
      logger.warn('High memory usage detected', {
        toolName: context.toolName,
        traceId: context.traceId,
        totalMemoryMB: Math.round(totalMemoryMB)
      });
    }
  }
}