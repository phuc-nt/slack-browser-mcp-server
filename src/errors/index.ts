import { logger } from '../utils/logger.js';

/**
 * Base error class for MCP server errors
 */
export abstract class MCPError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  readonly timestamp: string;
  readonly traceId?: string;
  readonly context?: Record<string, any>;

  constructor(
    message: string, 
    traceId?: string, 
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date().toISOString();
    this.traceId = traceId;
    this.context = context;
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON for logging/response
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      traceId: this.traceId,
      context: this.context,
      stack: this.stack
    };
  }

  /**
   * Get user-friendly error message (without internal details)
   */
  getUserMessage(): string {
    return this.message;
  }
}

/**
 * Tool-related errors
 */
export class ToolNotFoundError extends MCPError {
  readonly code = 'TOOL_NOT_FOUND';
  readonly statusCode = 404;

  constructor(toolName: string, traceId?: string) {
    super(`Tool not found: ${toolName}`, traceId, { toolName });
  }
}

export class ToolExecutionError extends MCPError {
  readonly code = 'TOOL_EXECUTION_ERROR';
  readonly statusCode = 500;

  constructor(toolName: string, originalError: string, traceId?: string) {
    super(`Tool execution failed: ${originalError}`, traceId, { toolName, originalError });
  }
}

export class ToolValidationError extends MCPError {
  readonly code = 'TOOL_VALIDATION_ERROR';
  readonly statusCode = 400;

  constructor(toolName: string, validationErrors: string[], traceId?: string) {
    super(`Tool validation failed: ${validationErrors.join(', ')}`, traceId, { 
      toolName, 
      validationErrors 
    });
  }

  getUserMessage(): string {
    return `Invalid input for tool ${this.context?.toolName}: ${this.context?.validationErrors?.join(', ')}`;
  }
}

export class ToolTimeoutError extends MCPError {
  readonly code = 'TOOL_TIMEOUT';
  readonly statusCode = 408;

  constructor(toolName: string, timeout: number, traceId?: string) {
    super(`Tool execution timed out after ${timeout}ms`, traceId, { toolName, timeout });
  }
}

/**
 * Resource-related errors
 */
export class ResourceNotFoundError extends MCPError {
  readonly code = 'RESOURCE_NOT_FOUND';
  readonly statusCode = 404;

  constructor(resourceUri: string, traceId?: string) {
    super(`Resource not found: ${resourceUri}`, traceId, { resourceUri });
  }
}

export class ResourceGenerationError extends MCPError {
  readonly code = 'RESOURCE_GENERATION_ERROR';
  readonly statusCode = 500;

  constructor(resourceUri: string, originalError: string, traceId?: string) {
    super(`Resource generation failed: ${originalError}`, traceId, { resourceUri, originalError });
  }
}

export class ResourceAccessDeniedError extends MCPError {
  readonly code = 'RESOURCE_ACCESS_DENIED';
  readonly statusCode = 403;

  constructor(resourceUri: string, reason: string, traceId?: string) {
    super(`Access denied to resource: ${reason}`, traceId, { resourceUri, reason });
  }

  getUserMessage(): string {
    return 'Access denied to requested resource';
  }
}

/**
 * Security-related errors
 */
export class RateLimitExceededError extends MCPError {
  readonly code = 'RATE_LIMIT_EXCEEDED';
  readonly statusCode = 429;

  constructor(key: string, resetTime: number, traceId?: string) {
    super('Rate limit exceeded', traceId, { key, resetTime });
  }

  getUserMessage(): string {
    const resetTime = new Date(this.context?.resetTime || 0);
    return `Rate limit exceeded. Please try again after ${resetTime.toISOString()}`;
  }
}

export class InputValidationError extends MCPError {
  readonly code = 'INPUT_VALIDATION_ERROR';
  readonly statusCode = 400;

  constructor(field: string, reason: string, traceId?: string) {
    super(`Invalid input for field ${field}: ${reason}`, traceId, { field, reason });
  }

  getUserMessage(): string {
    return `Invalid input: ${this.context?.reason}`;
  }
}

export class SecurityViolationError extends MCPError {
  readonly code = 'SECURITY_VIOLATION';
  readonly statusCode = 403;

  constructor(violation: string, traceId?: string) {
    super(`Security violation detected: ${violation}`, traceId, { violation });
  }

  getUserMessage(): string {
    return 'Security violation detected';
  }
}

/**
 * System-related errors
 */
export class ConfigurationError extends MCPError {
  readonly code = 'CONFIGURATION_ERROR';
  readonly statusCode = 500;

  constructor(setting: string, reason: string, traceId?: string) {
    super(`Configuration error for ${setting}: ${reason}`, traceId, { setting, reason });
  }

  getUserMessage(): string {
    return 'Server configuration error';
  }
}

export class InitializationError extends MCPError {
  readonly code = 'INITIALIZATION_ERROR';
  readonly statusCode = 500;

  constructor(component: string, originalError: string, traceId?: string) {
    super(`Failed to initialize ${component}: ${originalError}`, traceId, { component, originalError });
  }

  getUserMessage(): string {
    return 'Server initialization failed';
  }
}

export class ConcurrencyLimitError extends MCPError {
  readonly code = 'CONCURRENCY_LIMIT_EXCEEDED';
  readonly statusCode = 429;

  constructor(limit: number, traceId?: string) {
    super(`Concurrency limit exceeded: ${limit}`, traceId, { limit });
  }

  getUserMessage(): string {
    return 'Server is currently busy. Please try again later.';
  }
}

/**
 * Error handler utility class
 */
export class ErrorHandler {
  /**
   * Handle and log error appropriately
   */
  static handleError(error: unknown, context?: Record<string, any>): MCPError {
    if (error instanceof MCPError) {
      // Already a structured error
      logger.error('MCP Error occurred', {
        error: error.toJSON(),
        context
      });
      return error;
    }

    if (error instanceof Error) {
      // Convert standard Error to MCPError
      const mcpError = new ToolExecutionError('unknown', error.message, context?.traceId);
      logger.error('Unhandled Error converted to MCPError', {
        error: mcpError.toJSON(),
        originalStack: error.stack,
        context
      });
      return mcpError;
    }

    // Unknown error type
    const mcpError = new ToolExecutionError('unknown', 'Unknown error occurred', context?.traceId);
    logger.error('Unknown error type', {
      error: mcpError.toJSON(),
      originalError: error,
      context
    });
    return mcpError;
  }

  /**
   * Create error response for MCP protocol
   */
  static createErrorResponse(error: MCPError): any {
    return {
      content: [{
        type: 'text',
        text: error.getUserMessage()
      }],
      isError: true,
      _meta: {
        error: {
          code: error.code,
          statusCode: error.statusCode,
          timestamp: error.timestamp,
          traceId: error.traceId
        }
      }
    };
  }

  /**
   * Handle async operation with error recovery
   */
  static async withErrorRecovery<T>(
    operation: () => Promise<T>,
    onError?: (error: MCPError) => T | Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const mcpError = ErrorHandler.handleError(error, context);
      
      if (onError) {
        try {
          return await onError(mcpError);
        } catch (recoveryError) {
          logger.error('Error recovery failed', {
            originalError: mcpError.toJSON(),
            recoveryError: ErrorHandler.handleError(recoveryError, context).toJSON()
          });
          throw mcpError;
        }
      }
      
      throw mcpError;
    }
  }

  /**
   * Wrap function with error handling
   */
  static wrapWithErrorHandling<TArgs extends any[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    context?: Record<string, any>
  ): (...args: TArgs) => Promise<TReturn> {
    return async (...args: TArgs): Promise<TReturn> => {
      return ErrorHandler.withErrorRecovery(
        () => fn(...args),
        undefined,
        { ...context, functionName: fn.name }
      );
    };
  }

  /**
   * Get error statistics
   */
  static getErrorStats(): {
    errorsByCode: Record<string, number>;
    errorsByComponent: Record<string, number>;
    recentErrors: Array<{ code: string; timestamp: string; message: string }>;
  } {
    // This would be implemented with actual error tracking
    // For now, return empty stats
    return {
      errorsByCode: {},
      errorsByComponent: {},
      recentErrors: []
    };
  }
}

/**
 * Error recovery strategies
 */
export class ErrorRecovery {
  /**
   * Retry with exponential backoff
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      initialDelay?: number;
      maxDelay?: number;
      factor?: number;
      retryCondition?: (error: MCPError) => boolean;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      factor = 2,
      retryCondition = (error) => error.statusCode >= 500
    } = options;

    let lastError: MCPError | undefined;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = ErrorHandler.handleError(error);
        
        if (attempt === maxRetries || !retryCondition(lastError)) {
          throw lastError;
        }

        logger.warn('Operation failed, retrying', {
          attempt: attempt + 1,
          maxRetries,
          delay,
          error: lastError.toJSON()
        });

        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * factor, maxDelay);
      }
    }

    throw lastError;
  }

  /**
   * Circuit breaker pattern
   */
  static createCircuitBreaker<TArgs extends any[], TReturn>(
    operation: (...args: TArgs) => Promise<TReturn>,
    options: {
      failureThreshold?: number;
      recoveryTimeout?: number;
      monitoringPeriod?: number;
    } = {}
  ): (...args: TArgs) => Promise<TReturn> {
    const {
      failureThreshold = 5,
      recoveryTimeout = 60000,
      monitoringPeriod = 30000
    } = options;

    let failures = 0;
    let lastFailureTime = 0;
    let state: 'closed' | 'open' | 'half-open' = 'closed';

    return async (...args: TArgs): Promise<TReturn> => {
      const now = Date.now();

      // Reset failures after monitoring period
      if (now - lastFailureTime > monitoringPeriod) {
        failures = 0;
      }

      // Check circuit state
      if (state === 'open') {
        if (now - lastFailureTime > recoveryTimeout) {
          state = 'half-open';
        } else {
          throw new ToolExecutionError('circuit-breaker', 'Circuit breaker is open');
        }
      }

      try {
        const result = await operation(...args);
        
        // Success - reset circuit
        if (state === 'half-open') {
          state = 'closed';
          failures = 0;
        }
        
        return result;
      } catch (error) {
        failures++;
        lastFailureTime = now;

        if (failures >= failureThreshold) {
          state = 'open';
          logger.warn('Circuit breaker opened', {
            failures,
            failureThreshold,
            recoveryTimeout
          });
        }

        throw error;
      }
    };
  }
}