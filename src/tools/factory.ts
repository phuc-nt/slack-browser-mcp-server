import { BaseSlackTool, SlackToolFactory } from './base.js';
import { SlackTool, ToolCategory, ToolValidationResult, ToolContext, ToolExecutionResult } from '../types/tools.js';
import { PingTool, EchoTool } from './conversations.js';
import { logger } from '../utils/logger.js';
// Simple validation without Ajv for now

/**
 * Enhanced tool factory with validation and dynamic loading
 */
export class EnhancedToolFactory extends SlackToolFactory {
  private toolInstances: Map<string, BaseSlackTool> = new Map();
  private validationCache: Map<string, ToolValidationResult> = new Map();

  constructor() {
    super();
    
    // Register built-in tools
    this.registerBuiltInTools();
  }

  /**
   * Register built-in tool classes
   */
  private registerBuiltInTools(): void {
    // Create and register built-in tool instances directly
    const pingTool = new PingTool();
    const echoTool = new EchoTool();
    
    this.toolInstances.set(pingTool.getDefinition().name, pingTool);
    this.toolInstances.set(echoTool.getDefinition().name, echoTool);
    
    logger.info('Registered built-in tools', {
      tools: Array.from(this.toolInstances.keys())
    });
  }

  /**
   * Create and cache tool instances
   */
  createTool(definition: SlackTool): BaseSlackTool | null {
    // Check cache first
    if (this.toolInstances.has(definition.name)) {
      return this.toolInstances.get(definition.name)!;
    }

    // Validate definition
    const validation = this.validateDefinition(definition);
    if (!validation.isValid) {
      logger.error('Tool definition validation failed', {
        toolName: definition.name,
        errors: validation.errors
      });
      return null;
    }

    // Create instance
    const instance = super.createTool(definition);
    if (instance) {
      this.toolInstances.set(definition.name, instance);
      logger.debug('Created and cached tool instance', {
        toolName: definition.name,
        category: definition.category
      });
    }

    return instance;
  }

  /**
   * Enhanced validation with JSON Schema validation
   */
  validateDefinition(definition: SlackTool): ToolValidationResult {
    // Check cache first
    const cacheKey = this.getCacheKey(definition);
    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey)!;
    }

    // Base validation from parent
    const baseValidation = super.validateDefinition(definition);
    if (!baseValidation.isValid) {
      this.validationCache.set(cacheKey, baseValidation);
      return baseValidation;
    }

    const errors: string[] = [...baseValidation.errors];
    const warnings: string[] = [...baseValidation.warnings];

    // Enhanced validation (simplified)
    try {
      // Basic schema validation
      if (!definition.inputSchema.type) {
        errors.push('Input schema must have a type field');
      }

      // Validate tags
      if (definition.tags) {
        if (!Array.isArray(definition.tags)) {
          errors.push('Tags must be an array of strings');
        } else {
          const invalidTags = definition.tags.filter(tag => typeof tag !== 'string');
          if (invalidTags.length > 0) {
            errors.push(`Invalid tag types: ${invalidTags.join(', ')}`);
          }
        }
      }

      // Validate rate limit configuration
      if (definition.rateLimit) {
        if (definition.rateLimit.maxCalls <= 0) {
          errors.push('Rate limit maxCalls must be positive');
        }
        if (definition.rateLimit.windowMs <= 0) {
          errors.push('Rate limit windowMs must be positive');
        }
        if (definition.rateLimit.maxCalls > 1000) {
          warnings.push('Rate limit maxCalls is very high (>1000)');
        }
      }

    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const result: ToolValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings
    };

    // Cache result
    this.validationCache.set(cacheKey, result);
    
    return result;
  }

  /**
   * Validate tool input arguments against schema
   */
  async validateToolInput(toolName: string, args: any): Promise<ToolValidationResult> {
    const instance = this.toolInstances.get(toolName);
    if (!instance) {
      return {
        isValid: false,
        errors: [`Tool not found: ${toolName}`],
        warnings: []
      };
    }

    const definition = instance.getDefinition();
    
    try {
      // Simple validation - check required fields
      if (definition.inputSchema.required) {
        for (const field of definition.inputSchema.required) {
          if (!(field in args)) {
            return {
              isValid: false,
              errors: [`Required field missing: ${field}`],
              warnings: []
            };
          }
        }
      }

      return {
        isValid: true,
        errors: [],
        warnings: []
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Input validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  }

  /**
   * Execute tool with comprehensive validation and error handling
   */
  async executeTool(toolName: string, args: any, context: ToolContext): Promise<ToolExecutionResult> {
    const instance = this.toolInstances.get(toolName);
    if (!instance) {
      return {
        success: false,
        error: `Tool not found: ${toolName}`,
        errorCode: 'TOOL_NOT_FOUND',
        metadata: {
          executionTime: 0,
          apiCalls: 0,
          cacheHits: 0
        }
      };
    }

    // Validate input
    const inputValidation = await this.validateToolInput(toolName, args);
    if (!inputValidation.isValid) {
      return {
        success: false,
        error: `Input validation failed: ${inputValidation.errors.join(', ')}`,
        errorCode: 'INPUT_VALIDATION_ERROR',
        metadata: {
          executionTime: 0,
          apiCalls: 0,
          cacheHits: 0
        }
      };
    }

    // Execute tool
    try {
      const result = await instance.execute(args, context);
      
      logger.debug('Tool executed successfully', {
        toolName,
        traceId: context.traceId,
        executionTime: result.metadata?.executionTime,
        success: result.success
      });

      return result;
    } catch (error) {
      logger.error('Tool execution failed', {
        toolName,
        traceId: context.traceId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errorCode: 'TOOL_EXECUTION_ERROR',
        metadata: {
          executionTime: Date.now() - context.startTime,
          apiCalls: 0,
          cacheHits: 0
        }
      };
    }
  }

  /**
   * Load tools dynamically from definitions
   */
  loadToolsFromDefinitions(definitions: SlackTool[]): { loaded: string[], failed: string[] } {
    const loaded: string[] = [];
    const failed: string[] = [];

    for (const definition of definitions) {
      try {
        const instance = this.createTool(definition);
        if (instance) {
          loaded.push(definition.name);
        } else {
          failed.push(definition.name);
        }
      } catch (error) {
        logger.error('Failed to load tool from definition', {
          toolName: definition.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        failed.push(definition.name);
      }
    }

    logger.info('Dynamic tool loading completed', { loaded, failed });
    
    return { loaded, failed };
  }

  /**
   * Get all tool instances
   */
  getAllToolInstances(): BaseSlackTool[] {
    return Array.from(this.toolInstances.values());
  }

  /**
   * Get tool by name
   */
  getToolInstance(name: string): BaseSlackTool | undefined {
    return this.toolInstances.get(name);
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: ToolCategory): BaseSlackTool[] {
    return Array.from(this.toolInstances.values())
      .filter(tool => tool.getDefinition().category === category);
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.validationCache.clear();
    logger.debug('Tool factory caches cleared');
  }

  /**
   * Get factory statistics
   */
  getStats() {
    return {
      registeredClasses: this.getRegisteredTools().length,
      instances: this.toolInstances.size,
      validationCacheSize: this.validationCache.size,
      categoryCounts: this.getCategoryCounts()
    };
  }

  /**
   * Get count of tools by category
   */
  private getCategoryCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const tool of this.toolInstances.values()) {
      const category = tool.getDefinition().category;
      counts[category] = (counts[category] || 0) + 1;
    }
    
    return counts;
  }

  /**
   * Generate cache key for validation results
   */
  private getCacheKey(definition: SlackTool): string {
    return `${definition.name}:${definition.category}:${JSON.stringify(definition.inputSchema)}`;
  }
}