import { ToolCategory } from '../types/tools.js';
import { logger } from '../utils/logger.js';
/**
 * Base abstract class for all Slack tools
 */
export class BaseSlackTool {
    definition;
    metrics = new Map();
    constructor(definition) {
        this.definition = definition;
    }
    /**
     * Execute the tool with context and metrics
     */
    async execute(args, context) {
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
        }
        catch (error) {
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
     * Get tool definition
     */
    getDefinition() {
        return this.definition;
    }
    /**
     * Get tool metrics
     */
    getMetrics() {
        return Object.fromEntries(this.metrics);
    }
    /**
     * Update internal metrics
     */
    updateMetrics(key, value) {
        this.metrics.set(key, (this.metrics.get(key) || 0) + value);
    }
    /**
     * Helper method to create successful result
     */
    createSuccessResult(data, metadata) {
        return {
            success: true,
            data,
            metadata
        };
    }
    /**
     * Helper method to create error result
     */
    createErrorResult(error, code, metadata) {
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
    toolClasses = new Map();
    /**
     * Register a tool class
     */
    registerTool(name, toolClass) {
        this.toolClasses.set(name, toolClass);
        logger.debug(`Registered tool class: ${name}`);
    }
    /**
     * Create tool instance
     */
    createTool(definition) {
        const ToolClass = this.toolClasses.get(definition.name);
        if (!ToolClass) {
            logger.warn(`No tool class found for: ${definition.name}`);
            return null;
        }
        // Create instance - ToolClass should be a concrete class extending BaseSlackTool
        return new ToolClass();
    }
    /**
     * Validate tool definition
     */
    validateDefinition(definition) {
        const errors = [];
        const warnings = [];
        // Required fields
        if (!definition.name)
            errors.push('Tool name is required');
        if (!definition.description)
            errors.push('Tool description is required');
        if (!definition.inputSchema)
            errors.push('Tool input schema is required');
        if (!definition.category)
            errors.push('Tool category is required');
        // Category validation
        if (definition.category && !Object.values(ToolCategory).includes(definition.category)) {
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
    getRegisteredTools() {
        return Array.from(this.toolClasses.keys());
    }
}
//# sourceMappingURL=base.js.map