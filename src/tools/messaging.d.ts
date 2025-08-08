/**
 * Slack Messaging Tools - MCP-compliant action operations
 * These tools perform messaging actions (POST/PUT/DELETE operations)
 */
import { BaseSlackTool } from './base.js';
import { ToolContext, ToolExecutionResult, ToolValidationResult } from '../types/tools.js';
/**
 * Arguments for posting a message
 */
export interface PostMessageArgs {
    channel: string;
    text: string;
    thread_ts?: string;
    blocks?: any[];
    attachments?: any[];
    unfurl_links?: boolean;
}
/**
 * Arguments for updating a message
 */
export interface UpdateMessageArgs {
    channel: string;
    ts: string;
    text: string;
    blocks?: any[];
}
/**
 * Arguments for deleting a message
 */
export interface DeleteMessageArgs {
    channel: string;
    ts: string;
}
/**
 * Arguments for replying to a thread
 */
export interface PostThreadReplyArgs {
    channel: string;
    thread_ts: string;
    text: string;
    blocks?: any[];
}
/**
 * Tool for posting messages to Slack channels
 * MCP Classification: Tool (Action - POST operation)
 */
export declare class PostMessageTool extends BaseSlackTool {
    constructor();
    /**
     * Validate post message arguments
     */
    validate(args: PostMessageArgs): Promise<ToolValidationResult>;
    /**
     * Execute post message operation
     */
    protected executeImpl(args: PostMessageArgs, context: ToolContext): Promise<ToolExecutionResult>;
}
/**
 * Tool for replying to message threads
 * MCP Classification: Tool (Action - POST operation)
 */
export declare class PostThreadReplyTool extends BaseSlackTool {
    constructor();
    /**
     * Validate thread reply arguments
     */
    validate(args: PostThreadReplyArgs): Promise<ToolValidationResult>;
    /**
     * Execute thread reply operation
     */
    protected executeImpl(args: PostThreadReplyArgs, context: ToolContext): Promise<ToolExecutionResult>;
}
/**
 * Tool for updating/editing existing messages
 * MCP Classification: Tool (Action - PUT operation)
 */
export declare class UpdateMessageTool extends BaseSlackTool {
    constructor();
    /**
     * Validate update message arguments
     */
    validate(args: UpdateMessageArgs): Promise<ToolValidationResult>;
    /**
     * Execute update message operation
     */
    protected executeImpl(args: UpdateMessageArgs, context: ToolContext): Promise<ToolExecutionResult>;
}
/**
 * Tool for deleting messages
 * MCP Classification: Tool (Action - DELETE operation)
 */
export declare class DeleteMessageTool extends BaseSlackTool {
    constructor();
    /**
     * Validate delete message arguments
     */
    validate(args: DeleteMessageArgs): Promise<ToolValidationResult>;
    /**
     * Execute delete message operation
     */
    protected executeImpl(args: DeleteMessageArgs, context: ToolContext): Promise<ToolExecutionResult>;
}
//# sourceMappingURL=messaging.d.ts.map