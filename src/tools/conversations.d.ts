import { BaseSlackTool } from './base.js';
import { SlackTool, ToolContext, ToolExecutionResult } from '../types/tools.js';
/**
 * Ping tool for testing connectivity
 */
export declare class PingTool extends BaseSlackTool {
    constructor();
    protected executeImpl(_args: any, context: ToolContext): Promise<ToolExecutionResult>;
}
/**
 * Echo tool for testing input/output
 */
export declare class EchoTool extends BaseSlackTool {
    constructor();
    protected executeImpl(args: any, context: ToolContext): Promise<ToolExecutionResult>;
}
/**
 * Placeholder: Future conversations tools will go here
 * - conversations_history
 * - conversations_replies
 * - conversations_add_message
 * - conversations_info
 */
export declare class ConversationsPlaceholder {
    static getPlaceholderTools(): SlackTool[];
}
//# sourceMappingURL=conversations.d.ts.map