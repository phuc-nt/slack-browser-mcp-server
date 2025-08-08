/**
 * Sprint 3.2: Simplified Thread Tool Implementations
 * All 8 thread management tools in one file để avoid inheritance issues
 */
import { BaseSlackTool } from './base.js';
import { ToolContext, ToolExecutionResult, ToolValidationResult } from '../types/tools.js';
/**
 * Tool 1: Get Thread Context
 */
export declare class GetThreadContextTool extends BaseSlackTool {
    executeImpl(args: any, context: ToolContext): Promise<ToolExecutionResult>;
    validate(args: any): Promise<ToolValidationResult>;
}
/**
 * Tool 2: Navigate Thread Replies
 */
export declare class NavigateThreadRepliesTool extends BaseSlackTool {
    executeImpl(args: any, context: ToolContext): Promise<ToolExecutionResult>;
    validate(args: any): Promise<ToolValidationResult>;
}
/**
 * Tool 3: Create Thread
 */
export declare class CreateThreadTool extends BaseSlackTool {
    executeImpl(args: any, context: ToolContext): Promise<ToolExecutionResult>;
    validate(args: any): Promise<ToolValidationResult>;
}
/**
 * Tool 4: Resolve Thread
 */
export declare class ResolveThreadTool extends BaseSlackTool {
    executeImpl(args: any, context: ToolContext): Promise<ToolExecutionResult>;
    validate(args: any): Promise<ToolValidationResult>;
}
/**
 * Tool 5: Archive Thread
 */
export declare class ArchiveThreadTool extends BaseSlackTool {
    executeImpl(args: any, context: ToolContext): Promise<ToolExecutionResult>;
    validate(args: any): Promise<ToolValidationResult>;
}
/**
 * Tool 6: Summarize Thread
 */
export declare class SummarizeThreadTool extends BaseSlackTool {
    executeImpl(args: any, context: ToolContext): Promise<ToolExecutionResult>;
    private generateTitle;
    validate(args: any): Promise<ToolValidationResult>;
}
/**
 * Tool 7: Get Thread Participants
 */
export declare class GetThreadParticipantsTool extends BaseSlackTool {
    executeImpl(args: any, context: ToolContext): Promise<ToolExecutionResult>;
    validate(args: any): Promise<ToolValidationResult>;
}
/**
 * Tool 8: Bulk Thread Actions
 */
export declare class BulkThreadActionsTool extends BaseSlackTool {
    executeImpl(args: any, context: ToolContext): Promise<ToolExecutionResult>;
    validate(args: any): Promise<ToolValidationResult>;
}
//# sourceMappingURL=thread-tool-implementations.d.ts.map