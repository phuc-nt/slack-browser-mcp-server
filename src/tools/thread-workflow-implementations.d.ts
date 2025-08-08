/**
 * Sprint 3.3: Thread Workflow Tool Implementations
 * Complete implementations for 6 workflow management tools
 */
import { BaseSlackTool } from './base.js';
import { ToolContext, ToolExecutionResult, ToolValidationResult } from '../types/tools.js';
/**
 * Tool 1: Promote Thread
 */
export declare class PromoteThreadTool extends BaseSlackTool {
    executeImpl(args: any, context: ToolContext): Promise<ToolExecutionResult>;
    validate(args: any): Promise<ToolValidationResult>;
}
/**
 * Tool 2: Escalate Thread
 */
export declare class EscalateThreadTool extends BaseSlackTool {
    executeImpl(args: any, context: ToolContext): Promise<ToolExecutionResult>;
    validate(args: any): Promise<ToolValidationResult>;
}
/**
 * Tool 3: Merge Threads
 */
export declare class MergeThreadsTool extends BaseSlackTool {
    executeImpl(args: any, context: ToolContext): Promise<ToolExecutionResult>;
    validate(args: any): Promise<ToolValidationResult>;
}
/**
 * Tool 4: Split Thread
 */
export declare class SplitThreadTool extends BaseSlackTool {
    executeImpl(args: any, context: ToolContext): Promise<ToolExecutionResult>;
    validate(args: any): Promise<ToolValidationResult>;
}
/**
 * Tool 5: Thread Watcher
 */
export declare class ThreadWatcherTool extends BaseSlackTool {
    executeImpl(args: any, context: ToolContext): Promise<ToolExecutionResult>;
    validate(args: any): Promise<ToolValidationResult>;
}
/**
 * Tool 6: Thread Metrics Analysis
 */
export declare class ThreadMetricsTool extends BaseSlackTool {
    executeImpl(args: any, context: ToolContext): Promise<ToolExecutionResult>;
    validate(args: any): Promise<ToolValidationResult>;
}
//# sourceMappingURL=thread-workflow-implementations.d.ts.map