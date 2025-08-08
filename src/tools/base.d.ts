import { SlackTool, ToolContext, ToolExecutionResult, ToolValidationResult, ToolHandler } from '../types/tools.js';
/**
 * Base abstract class for all Slack tools
 */
export declare abstract class BaseSlackTool implements ToolHandler {
    protected definition: SlackTool;
    private metrics;
    constructor(definition: SlackTool);
    /**
     * Execute the tool with context and metrics
     */
    execute(args: any, context: ToolContext): Promise<ToolExecutionResult>;
    /**
     * Abstract method to be implemented by concrete tools
     */
    protected abstract executeImpl(args: any, context: ToolContext): Promise<ToolExecutionResult>;
    /**
     * Optional validation method
     */
    validate?(args: any): Promise<ToolValidationResult>;
    /**
     * Optional cleanup method
     */
    cleanup?(): Promise<void>;
    /**
     * Get tool definition
     */
    getDefinition(): SlackTool;
    /**
     * Get tool metrics
     */
    getMetrics(): Record<string, number>;
    /**
     * Update internal metrics
     */
    private updateMetrics;
    /**
     * Helper method to create successful result
     */
    protected createSuccessResult(data: any, metadata?: any): ToolExecutionResult;
    /**
     * Helper method to create error result
     */
    protected createErrorResult(error: string, code?: string, metadata?: any): ToolExecutionResult;
}
/**
 * Factory for creating tool instances
 */
export declare class SlackToolFactory {
    private toolClasses;
    /**
     * Register a tool class
     */
    registerTool(name: string, toolClass: typeof BaseSlackTool): void;
    /**
     * Create tool instance
     */
    createTool(definition: SlackTool): BaseSlackTool | null;
    /**
     * Validate tool definition
     */
    validateDefinition(definition: SlackTool): ToolValidationResult;
    /**
     * Get registered tool names
     */
    getRegisteredTools(): string[];
}
//# sourceMappingURL=base.d.ts.map