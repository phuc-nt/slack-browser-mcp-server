/**
 * Sprint 3.3: Thread Workflow Management Tools
 * Advanced thread lifecycle management và workflow automation
 */
import { SlackTool } from '../types/tools.js';
/**
 * Thread Workflow Tools Factory
 */
export declare class ThreadWorkflowTools {
    /**
     * Thread Promotion Tool - Promote thread to important discussion
     */
    static createPromoteThreadTool(): SlackTool;
    /**
     * Thread Escalation Tool - Escalate thread for urgent attention
     */
    static createEscalateThreadTool(): SlackTool;
    /**
     * Thread Merge Tool - Merge related threads together
     */
    static createMergeThreadsTool(): SlackTool;
    /**
     * Thread Split Tool - Split off-topic conversation into new thread
     */
    static createSplitThreadTool(): SlackTool;
    /**
     * Thread Watcher Tool - Monitor thread for activity and status changes
     */
    static createThreadWatcherTool(): SlackTool;
    /**
     * Thread Metrics Tool - Analyze thread performance and engagement metrics
     */
    static createThreadMetricsTool(): SlackTool;
    /**
     * Get all workflow tool definitions
     */
    static getAllWorkflowTools(): SlackTool[];
    /**
     * Get workflow tools by category
     */
    static getWorkflowToolsByCategory(): Record<string, SlackTool[]>;
}
//# sourceMappingURL=thread-workflow.d.ts.map