import { BaseSlackTool, SlackToolFactory } from './base.js';
import { SlackTool, ToolCategory, ToolValidationResult, ToolContext, ToolExecutionResult } from '../types/tools.js';
/**
 * Enhanced tool factory with validation and dynamic loading
 */
export declare class EnhancedToolFactory extends SlackToolFactory {
    private toolInstances;
    private validationCache;
    constructor();
    /**
     * Register built-in tool classes
     */
    private registerBuiltInTools;
    /**
     * Create and cache tool instances
     */
    createTool(definition: SlackTool): BaseSlackTool | null;
    /**
     * Enhanced validation with JSON Schema validation
     */
    validateDefinition(definition: SlackTool): ToolValidationResult;
    /**
     * Validate tool input arguments against schema
     */
    validateToolInput(toolName: string, args: any): Promise<ToolValidationResult>;
    /**
     * Execute tool with comprehensive validation and error handling
     */
    executeTool(toolName: string, args: any, context: ToolContext): Promise<ToolExecutionResult>;
    /**
     * Load tools dynamically from definitions
     */
    loadToolsFromDefinitions(definitions: SlackTool[]): {
        loaded: string[];
        failed: string[];
    };
    /**
     * Get all tool instances
     */
    getAllToolInstances(): BaseSlackTool[];
    /**
     * Get tool by name
     */
    getToolInstance(name: string): BaseSlackTool | undefined;
    /**
     * Get tools by category
     */
    getToolsByCategory(category: ToolCategory): BaseSlackTool[];
    /**
     * Clear all caches
     */
    clearCaches(): void;
    /**
     * Get factory statistics
     */
    getStats(): {
        registeredClasses: number;
        instances: number;
        validationCacheSize: number;
        categoryCounts: Record<string, number>;
    };
    /**
     * Get count of tools by category
     */
    private getCategoryCounts;
    /**
     * Generate cache key for validation results
     */
    private getCacheKey;
}
//# sourceMappingURL=factory.d.ts.map