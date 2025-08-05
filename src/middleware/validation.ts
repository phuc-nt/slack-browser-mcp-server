import { ToolMiddleware, ToolContext, ToolExecutionResult } from '../types/tools.js';
import { logger } from '../utils/logger.js';

/**
 * Input validation middleware
 */
export class ValidationMiddleware implements ToolMiddleware {
  name = 'ValidationMiddleware';
  priority = 200; // High priority - run early

  async before(context: ToolContext, args: any): Promise<void> {
    // Basic input sanitization
    const sanitizedArgs = this.sanitizeInput(args);
    
    // Replace original args with sanitized version
    Object.assign(args, sanitizedArgs);

    // Log validation info
    logger.debug('Input validation completed', {
      toolName: context.toolName,
      traceId: context.traceId,
      hasArgs: !!args,
      argCount: args ? Object.keys(args).length : 0
    });
  }

  /**
   * Sanitize input to prevent common security issues
   */
  private sanitizeInput(args: any): any {
    if (!args || typeof args !== 'object') {
      return args;
    }

    const sanitized = { ...args };
    
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string') {
        // Remove potential script tags
        sanitized[key] = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        
        // Limit string length to prevent DoS
        if (value.length > 10000) {
          sanitized[key] = value.substring(0, 10000);
          logger.warn('Input string truncated due to length', {
            field: key,
            originalLength: value.length,
            truncatedLength: 10000
          });
        }
      }
      
      // Recursively sanitize nested objects
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeInput(value);
      }
    }

    return sanitized;
  }
}

/**
 * Error handling middleware
 */
export class ErrorHandlingMiddleware implements ToolMiddleware {
  name = 'ErrorHandlingMiddleware';
  priority = 10; // Low priority - run last

  async onError(context: ToolContext, error: Error): Promise<void> {
    // Enhanced error logging with context
    logger.error('Tool execution error caught by middleware', {
      toolName: context.toolName,
      traceId: context.traceId,
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      executionTime: Date.now() - context.startTime,
      metadata: context.metadata
    });

    // Log additional context for debugging
    if (error.stack) {
      const stackLines = error.stack.split('\n').slice(0, 5); // First 5 lines
      logger.debug('Error stack trace (truncated)', {
        toolName: context.toolName,
        traceId: context.traceId,
        stackTrace: stackLines
      });
    }
  }

  async after(context: ToolContext, result: ToolExecutionResult): Promise<void> {
    // Check for errors in result and enhance error information
    if (!result.success && result.error) {
      logger.debug('Tool returned error result', {
        toolName: context.toolName,
        traceId: context.traceId,
        error: result.error,
        errorCode: result.errorCode,
        executionTime: Date.now() - context.startTime
      });

      // Add debugging hints based on error patterns
      const hints = this.getDebuggingHints(result.error, result.errorCode);
      if (hints.length > 0) {
        logger.info('Debugging hints for error', {
          toolName: context.toolName,
          traceId: context.traceId,
          hints
        });
      }
    }
  }

  /**
   * Get debugging hints based on error patterns
   */
  private getDebuggingHints(error: string, errorCode?: string): string[] {
    const hints: string[] = [];
    const errorLower = error.toLowerCase();

    if (errorLower.includes('validation')) {
      hints.push('Check input parameters against tool schema');
      hints.push('Verify required fields are provided');
    }

    if (errorLower.includes('timeout')) {
      hints.push('Check network connectivity');
      hints.push('Consider increasing timeout values');
    }

    if (errorLower.includes('not found') || errorCode === 'TOOL_NOT_FOUND') {
      hints.push('Verify tool name is correct');
      hints.push('Check if tool is properly registered');
    }

    if (errorLower.includes('authentication') || errorLower.includes('unauthorized')) {
      hints.push('Check authentication tokens');
      hints.push('Verify API credentials are valid');
    }

    if (errorLower.includes('rate limit')) {
      hints.push('Reduce request frequency');
      hints.push('Implement exponential backoff');
    }

    return hints;
  }
}

/**
 * Development mode middleware with extra debugging features
 */
export class DevelopmentMiddleware implements ToolMiddleware {
  name = 'DevelopmentMiddleware';
  priority = 50;

  private isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug';
  }

  async before(context: ToolContext, args: any): Promise<void> {
    if (!this.isDevelopment()) return;

    // Log detailed execution context
    logger.debug('Development mode - Tool execution context', {
      toolName: context.toolName,
      traceId: context.traceId,
      startTime: new Date(context.startTime).toISOString(),
      processInfo: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch
      },
      environmentInfo: {
        nodeEnv: process.env.NODE_ENV,
        logLevel: process.env.LOG_LEVEL
      }
    });

    // Validate args structure in development
    if (args && typeof args === 'object') {
      const argInfo = this.analyzeArgs(args);
      logger.debug('Development mode - Arguments analysis', {
        toolName: context.toolName,
        traceId: context.traceId,
        argInfo
      });
    }
  }

  async after(context: ToolContext, result: ToolExecutionResult): Promise<void> {
    if (!this.isDevelopment()) return;

    // Log detailed result analysis
    logger.debug('Development mode - Result analysis', {
      toolName: context.toolName,
      traceId: context.traceId,
      resultInfo: {
        success: result.success,
        hasData: !!result.data,
        dataType: result.data ? typeof result.data : null,
        hasError: !!result.error,
        hasMetadata: !!result.metadata,
        metadataKeys: result.metadata ? Object.keys(result.metadata) : []
      }
    });
  }

  /**
   * Analyze arguments structure for debugging
   */
  private analyzeArgs(args: any): any {
    const info: any = {
      type: typeof args,
      isArray: Array.isArray(args)
    };

    if (typeof args === 'object' && args !== null) {
      info.keys = Object.keys(args);
      info.keyCount = info.keys.length;
      
      // Analyze each key
      info.keyTypes = {};
      for (const key of info.keys) {
        info.keyTypes[key] = typeof args[key];
      }
    }

    return info;
  }
}