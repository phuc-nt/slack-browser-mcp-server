/**
 * Sprint 3.2: Advanced Thread Management Tools
 * Factory và base classes cho thread operations
 */
import { BaseSlackTool } from './base.js';
import { SlackClient } from '../slack/client.js';
import { SlackTool } from '../types/tools.js';
import { ThreadOperationResult, ThreadOperationError } from '../types/thread-tools.js';
import { SlackMessage } from '../slack/types.js';
/**
 * Base class for all thread management tools
 */
export declare abstract class BaseThreadTool extends BaseSlackTool {
    protected slackClient: SlackClient | null;
    constructor(definition: SlackTool);
    /**
     * Initialize Slack client với authentication
     */
    protected initializeSlackClient(): Promise<SlackClient>;
    /**
     * Validate thread parameters
     */
    protected validateThreadParams(args: any): ThreadOperationError | null;
    /**
     * Get thread replies với error handling
     */
    protected getThreadReplies(channelId: string, threadTs: string, limit?: number): Promise<ThreadOperationResult<SlackMessage[]>>;
    /**
     * Calculate thread age in hours
     */
    protected calculateThreadAge(threadTs: string): number;
    /**
     * Extract unique participants từ thread messages
     */
    protected extractParticipants(messages: SlackMessage[]): string[];
    /**
     * Determine thread status based on reactions và content
     */
    protected determineThreadStatus(messages: SlackMessage[]): 'active' | 'resolved' | 'archived';
}
/**
 * Thread Tools Factory - Creates all 8 thread management tools
 */
export declare class ThreadTools {
    /**
     * Navigation Tools (2 tools)
     */
    static createGetThreadContextTool(): SlackTool;
    static createNavigateThreadRepliesTool(): SlackTool;
    /**
     * Action Tools (3 tools)
     */
    static createCreateThreadTool(): SlackTool;
    static createResolveThreadTool(): SlackTool;
    static createArchiveThreadTool(): SlackTool;
    /**
     * Analysis Tools (2 tools)
     */
    static createSummarizeThreadTool(): SlackTool;
    static createGetThreadParticipantsTool(): SlackTool;
    /**
     * Bulk Operations Tool (1 tool)
     */
    static createBulkThreadActionsTool(): SlackTool;
    /**
     * Get all thread tool definitions
     */
    static getAllThreadTools(): SlackTool[];
    /**
     * Get thread tools by category
     */
    static getThreadToolsByCategory(): Record<string, SlackTool[]>;
}
//# sourceMappingURL=threads.d.ts.map