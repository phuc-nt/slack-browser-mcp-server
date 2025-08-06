import { SlackTool, ToolCategory, ToolContext, ToolExecutionResult, ToolValidationResult, ToolHandler } from '../types/tools.js';
import { logger } from '../utils/logger.js';

/**
 * Base abstract class for all Slack tools
 */
export abstract class BaseSlackTool implements ToolHandler {
  protected definition: SlackTool;
  private metrics: Map<string, number> = new Map();

  constructor(definition: SlackTool) {
    this.definition = definition;
  }

  /**
   * Execute the tool with context and metrics
   */
  async execute(args: any, context: ToolContext): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Validate input if validation is enabled
      if (this.validate) {
        const validation = await this.validate(args);
        if (!validation.isValid) {
          return {
            success: false,
            error: `Validation failed: ${validation.errors.join(', ')}`,
            errorCode: 'VALIDATION_ERROR',
            metadata: {
              executionTime: Date.now() - startTime,
              apiCalls: 0,
              cacheHits: 0
            }
          };
        }
      }

      // Execute the tool implementation
      const result = await this.executeImpl(args, context);
      
      // Update metrics
      this.updateMetrics('executions', 1);
      this.updateMetrics('totalTime', Date.now() - startTime);

      return {
        ...result,
        metadata: {
          executionTime: Date.now() - startTime,
          apiCalls: result.metadata?.apiCalls || 0,
          cacheHits: result.metadata?.cacheHits || 0
        }
      };

    } catch (error) {
      this.updateMetrics('errors', 1);
      
      logger.error(`Tool ${this.definition.name} execution failed:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        context,
        args
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode: 'EXECUTION_ERROR',
        metadata: {
          executionTime: Date.now() - startTime,
          apiCalls: 0,
          cacheHits: 0
        }
      };
    }
  }

  /**
   * Abstract method to be implemented by concrete tools
   */
  protected abstract executeImpl(args: any, context: ToolContext): Promise<ToolExecutionResult>;

  /**
   * Optional validation method
   */
  async validate?(args: any): Promise<ToolValidationResult>;

  /**
   * Optional cleanup method
   */
  async cleanup?(): Promise<void>;

  /**
   * Get tool definition
   */
  getDefinition(): SlackTool {
    return this.definition;
  }

  /**
   * Get tool metrics
   */
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Update internal metrics
   */
  private updateMetrics(key: string, value: number): void {
    this.metrics.set(key, (this.metrics.get(key) || 0) + value);
  }

  /**
   * Helper method to create successful result
   */
  protected createSuccessResult(data: any, metadata?: any): ToolExecutionResult {
    return {
      success: true,
      data,
      metadata
    };
  }

  /**
   * Helper method to create error result
   */
  protected createErrorResult(error: string, code?: string, metadata?: any): ToolExecutionResult {
    return {
      success: false,
      error,
      errorCode: code,
      metadata
    };
  }
}

/**
 * Factory for creating tool instances
 */
export class SlackToolFactory {
  private toolClasses: Map<string, typeof BaseSlackTool> = new Map();

  /**
   * Register a tool class
   */
  registerTool(name: string, toolClass: typeof BaseSlackTool): void {
    this.toolClasses.set(name, toolClass);
    logger.debug(`Registered tool class: ${name}`);
  }

  /**
   * Create tool instance
   */
  createTool(definition: SlackTool): BaseSlackTool | null {
    const ToolClass = this.toolClasses.get(definition.name);
    if (!ToolClass) {
      logger.warn(`No tool class found for: ${definition.name}`);
      return null;
    }

    // Create instance - ToolClass should be a concrete class extending BaseSlackTool
    return new (ToolClass as any)();
  }

  /**
   * Validate tool definition
   */
  validateDefinition(definition: SlackTool): ToolValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!definition.name) errors.push('Tool name is required');
    if (!definition.description) errors.push('Tool description is required');
    if (!definition.inputSchema) errors.push('Tool input schema is required');
    if (!definition.category) errors.push('Tool category is required');

    // Category validation
    if (definition.category && !Object.values(ToolCategory).includes(definition.category as ToolCategory)) {
      errors.push(`Invalid tool category: ${definition.category}`);
    }

    // Schema validation
    if (definition.inputSchema && typeof definition.inputSchema !== 'object') {
      errors.push('Input schema must be a valid JSON Schema object');
    }

    // Rate limit validation
    if (definition.rateLimit) {
      if (!definition.rateLimit.maxCalls || definition.rateLimit.maxCalls <= 0) {
        warnings.push('Rate limit maxCalls should be a positive number');
      }
      if (!definition.rateLimit.windowMs || definition.rateLimit.windowMs <= 0) {
        warnings.push('Rate limit windowMs should be a positive number');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get registered tool names
   */
  getRegisteredTools(): string[] {
    return Array.from(this.toolClasses.keys());
  }
}