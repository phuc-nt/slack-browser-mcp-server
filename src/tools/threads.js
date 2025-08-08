/**
 * Sprint 3.2: Advanced Thread Management Tools
 * Factory và base classes cho thread operations
 */
import { BaseSlackTool } from './base.js';
import { SlackAuth } from '../slack/auth.js';
import { SlackClient } from '../slack/client.js';
import { ToolCategory } from '../types/tools.js';
/**
 * Base class for all thread management tools
 */
export class BaseThreadTool extends BaseSlackTool {
    slackClient = null;
    constructor(definition) {
        super(definition);
    }
    /**
     * Initialize Slack client với authentication
     */
    async initializeSlackClient() {
        if (this.slackClient) {
            return this.slackClient;
        }
        const auth = new SlackAuth();
        const tokens = auth.extractTokensFromEnvironment();
        if (!tokens) {
            throw new Error('Slack authentication required for thread operations');
        }
        this.slackClient = new SlackClient(tokens);
        return this.slackClient;
    }
    /**
     * Validate thread parameters
     */
    validateThreadParams(args) {
        if (!args.thread_ts) {
            return {
                code: 'MISSING_THREAD_TS',
                message: 'Thread timestamp (thread_ts) is required',
                timestamp: new Date().toISOString()
            };
        }
        if (!args.channel_id) {
            return {
                code: 'MISSING_CHANNEL_ID',
                message: 'Channel ID (channel_id) is required',
                timestamp: new Date().toISOString()
            };
        }
        // Validate timestamp format
        if (!/^\d+\.\d+$/.test(args.thread_ts)) {
            return {
                code: 'INVALID_THREAD_TS',
                message: 'Thread timestamp must be in format "1234567890.123456"',
                timestamp: new Date().toISOString()
            };
        }
        // Validate channel ID format
        if (!/^[CDG][A-Z0-9]+$/.test(args.channel_id)) {
            return {
                code: 'INVALID_CHANNEL_ID',
                message: 'Channel ID must start with C, D, or G followed by alphanumeric characters',
                timestamp: new Date().toISOString()
            };
        }
        return null;
    }
    /**
     * Get thread replies với error handling
     */
    async getThreadReplies(channelId, threadTs, limit) {
        const startTime = Date.now();
        try {
            const client = await this.initializeSlackClient();
            const response = await client.getConversationReplies(channelId, threadTs, {
                limit: limit || 100,
                inclusive: true
            });
            if (!response.ok || !response.messages) {
                return {
                    success: false,
                    error: {
                        code: 'THREAD_FETCH_ERROR',
                        message: `Failed to fetch thread replies: ${response.error}`,
                        thread_ts: threadTs,
                        channel_id: channelId,
                        timestamp: new Date().toISOString()
                    },
                    processing_time_ms: Date.now() - startTime,
                    api_calls_made: 1,
                    cached_data_used: false
                };
            }
            return {
                success: true,
                data: response.messages,
                processing_time_ms: Date.now() - startTime,
                api_calls_made: 1,
                cached_data_used: false
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'THREAD_FETCH_EXCEPTION',
                    message: `Exception while fetching thread: ${error}`,
                    thread_ts: threadTs,
                    channel_id: channelId,
                    timestamp: new Date().toISOString(),
                    details: error
                },
                processing_time_ms: Date.now() - startTime,
                api_calls_made: 1,
                cached_data_used: false
            };
        }
    }
    /**
     * Calculate thread age in hours
     */
    calculateThreadAge(threadTs) {
        const threadTimestamp = parseFloat(threadTs) * 1000;
        const now = Date.now();
        return Math.round((now - threadTimestamp) / (1000 * 60 * 60) * 100) / 100;
    }
    /**
     * Extract unique participants từ thread messages
     */
    extractParticipants(messages) {
        const participants = new Set();
        messages.forEach(message => {
            if (message.user) {
                participants.add(message.user);
            }
        });
        return Array.from(participants);
    }
    /**
     * Determine thread status based on reactions và content
     */
    determineThreadStatus(messages) {
        const parentMessage = messages[0];
        if (!parentMessage)
            return 'active';
        // Check for resolved reactions
        const reactions = parentMessage.reactions || [];
        const hasResolvedReaction = reactions.some(r => ['white_check_mark', 'heavy_check_mark', '✅'].includes(r.name));
        if (hasResolvedReaction)
            return 'resolved';
        // Check for archive reactions
        const hasArchiveReaction = reactions.some(r => ['file_folder', 'card_file_box', '📁'].includes(r.name));
        if (hasArchiveReaction)
            return 'archived';
        return 'active';
    }
}
/**
 * Thread Tools Factory - Creates all 8 thread management tools
 */
export class ThreadTools {
    /**
     * Navigation Tools (2 tools)
     */
    static createGetThreadContextTool() {
        return {
            name: 'get_thread_context',
            description: 'Get complete thread information with parent message and metadata',
            category: ToolCategory.CONVERSATIONS,
            inputSchema: {
                type: 'object',
                properties: {
                    thread_ts: {
                        type: 'string',
                        description: 'Thread timestamp (format: 1234567890.123456)'
                    },
                    channel_id: {
                        type: 'string',
                        description: 'Channel ID containing the thread'
                    },
                    include_reactions: {
                        type: 'boolean',
                        description: 'Include message reactions in response',
                        default: false
                    }
                },
                required: ['thread_ts', 'channel_id']
            },
            requiresAuth: true,
            rateLimit: { maxCalls: 10, windowMs: 60000 }
        };
    }
    static createNavigateThreadRepliesTool() {
        return {
            name: 'navigate_thread_replies',
            description: 'Navigate through thread replies with pagination support',
            category: ToolCategory.CONVERSATIONS,
            inputSchema: {
                type: 'object',
                properties: {
                    thread_ts: {
                        type: 'string',
                        description: 'Thread timestamp'
                    },
                    channel_id: {
                        type: 'string',
                        description: 'Channel ID containing thread'
                    },
                    cursor: {
                        type: 'string',
                        description: 'Pagination cursor for navigation'
                    },
                    limit: {
                        type: 'number',
                        description: 'Number of replies to return (1-100)',
                        default: 20,
                        minimum: 1,
                        maximum: 100
                    },
                    include_parent: {
                        type: 'boolean',
                        description: 'Include parent message in results',
                        default: true
                    }
                },
                required: ['thread_ts', 'channel_id']
            },
            requiresAuth: true,
            rateLimit: { maxCalls: 20, windowMs: 60000 }
        };
    }
    /**
     * Action Tools (3 tools)
     */
    static createCreateThreadTool() {
        return {
            name: 'create_thread',
            description: 'Start a new thread from an existing message',
            category: ToolCategory.CONVERSATIONS,
            inputSchema: {
                type: 'object',
                properties: {
                    channel_id: {
                        type: 'string',
                        description: 'Target channel ID'
                    },
                    message_ts: {
                        type: 'string',
                        description: 'Source message timestamp to create thread from'
                    },
                    initial_reply: {
                        type: 'string',
                        description: 'Initial reply to start the thread discussion'
                    },
                    broadcast: {
                        type: 'boolean',
                        description: 'Broadcast the reply to channel',
                        default: false
                    }
                },
                required: ['channel_id', 'message_ts', 'initial_reply']
            },
            requiresAuth: true,
            rateLimit: { maxCalls: 20, windowMs: 60000 }
        };
    }
    static createResolveThreadTool() {
        return {
            name: 'resolve_thread',
            description: 'Mark thread as resolved with optional summary',
            category: ToolCategory.CONVERSATIONS,
            inputSchema: {
                type: 'object',
                properties: {
                    thread_ts: {
                        type: 'string',
                        description: 'Thread timestamp to resolve'
                    },
                    channel_id: {
                        type: 'string',
                        description: 'Channel ID containing thread'
                    },
                    resolution_summary: {
                        type: 'string',
                        description: 'Optional resolution summary to post'
                    },
                    mark_with_reaction: {
                        type: 'boolean',
                        description: 'Add resolved reaction to parent message',
                        default: true
                    },
                    notify_participants: {
                        type: 'boolean',
                        description: 'Notify all thread participants',
                        default: false
                    }
                },
                required: ['thread_ts', 'channel_id']
            },
            requiresAuth: true,
            rateLimit: { maxCalls: 20, windowMs: 60000 }
        };
    }
    static createArchiveThreadTool() {
        return {
            name: 'archive_thread',
            description: 'Archive thread by adding archive reaction and optional pin',
            category: ToolCategory.CONVERSATIONS,
            inputSchema: {
                type: 'object',
                properties: {
                    thread_ts: {
                        type: 'string',
                        description: 'Thread timestamp to archive'
                    },
                    channel_id: {
                        type: 'string',
                        description: 'Channel ID containing thread'
                    },
                    archive_reason: {
                        type: 'string',
                        description: 'Optional reason for archiving'
                    },
                    pin_thread: {
                        type: 'boolean',
                        description: 'Pin the thread before archiving',
                        default: false
                    },
                    add_to_bookmarks: {
                        type: 'boolean',
                        description: 'Add thread to channel bookmarks',
                        default: false
                    }
                },
                required: ['thread_ts', 'channel_id']
            },
            requiresAuth: true,
            rateLimit: { maxCalls: 20, windowMs: 60000 }
        };
    }
    /**
     * Analysis Tools (2 tools)
     */
    static createSummarizeThreadTool() {
        return {
            name: 'summarize_thread',
            description: 'Generate AI-powered summary of thread discussion',
            category: ToolCategory.CONVERSATIONS,
            inputSchema: {
                type: 'object',
                properties: {
                    thread_ts: {
                        type: 'string',
                        description: 'Thread timestamp to summarize'
                    },
                    channel_id: {
                        type: 'string',
                        description: 'Channel ID containing thread'
                    },
                    summary_style: {
                        type: 'string',
                        enum: ['brief', 'detailed', 'action_items'],
                        description: 'Style of summary to generate',
                        default: 'brief'
                    },
                    max_length: {
                        type: 'number',
                        description: 'Maximum summary length in characters',
                        default: 500,
                        minimum: 100,
                        maximum: 2000
                    },
                    focus_keywords: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Keywords to focus the summary on'
                    }
                },
                required: ['thread_ts', 'channel_id']
            },
            requiresAuth: true,
            rateLimit: { maxCalls: 10, windowMs: 60000 }
        };
    }
    static createGetThreadParticipantsTool() {
        return {
            name: 'get_thread_participants',
            description: 'Analyze thread participants and their contributions',
            category: ToolCategory.CONVERSATIONS,
            inputSchema: {
                type: 'object',
                properties: {
                    thread_ts: {
                        type: 'string',
                        description: 'Thread timestamp to analyze'
                    },
                    channel_id: {
                        type: 'string',
                        description: 'Channel ID containing thread'
                    },
                    include_stats: {
                        type: 'boolean',
                        description: 'Include detailed engagement statistics',
                        default: true
                    },
                    min_messages: {
                        type: 'number',
                        description: 'Minimum messages required to include participant',
                        default: 1,
                        minimum: 1
                    },
                    sort_by: {
                        type: 'string',
                        enum: ['messages', 'engagement', 'chronological'],
                        description: 'How to sort participants',
                        default: 'messages'
                    }
                },
                required: ['thread_ts', 'channel_id']
            },
            requiresAuth: true,
            rateLimit: { maxCalls: 20, windowMs: 60000 }
        };
    }
    /**
     * Bulk Operations Tool (1 tool)
     */
    static createBulkThreadActionsTool() {
        return {
            name: 'bulk_thread_actions',
            description: 'Perform actions on multiple threads efficiently',
            category: ToolCategory.CONVERSATIONS,
            inputSchema: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        enum: ['resolve', 'archive', 'summarize', 'analyze'],
                        description: 'Action to perform on all threads'
                    },
                    thread_list: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                thread_ts: { type: 'string' },
                                channel_id: { type: 'string' }
                            },
                            required: ['thread_ts', 'channel_id']
                        },
                        description: 'List of threads to process',
                        minItems: 1,
                        maxItems: 20
                    },
                    parameters: {
                        type: 'object',
                        description: 'Action-specific parameters',
                        additionalProperties: true
                    },
                    batch_size: {
                        type: 'number',
                        description: 'Processing batch size for rate limiting',
                        default: 5,
                        minimum: 1,
                        maximum: 10
                    },
                    dry_run: {
                        type: 'boolean',
                        description: 'Preview mode - show what would be done without executing',
                        default: false
                    }
                },
                required: ['action', 'thread_list']
            },
            requiresAuth: true,
            rateLimit: { maxCalls: 5, windowMs: 60000 }
        };
    }
    /**
     * Get all thread tool definitions
     */
    static getAllThreadTools() {
        return [
            // Navigation tools
            this.createGetThreadContextTool(),
            this.createNavigateThreadRepliesTool(),
            // Action tools
            this.createCreateThreadTool(),
            this.createResolveThreadTool(),
            this.createArchiveThreadTool(),
            // Analysis tools
            this.createSummarizeThreadTool(),
            this.createGetThreadParticipantsTool(),
            // Bulk operations
            this.createBulkThreadActionsTool()
        ];
    }
    /**
     * Get thread tools by category
     */
    static getThreadToolsByCategory() {
        return {
            navigation: [
                this.createGetThreadContextTool(),
                this.createNavigateThreadRepliesTool()
            ],
            actions: [
                this.createCreateThreadTool(),
                this.createResolveThreadTool(),
                this.createArchiveThreadTool()
            ],
            analysis: [
                this.createSummarizeThreadTool(),
                this.createGetThreadParticipantsTool()
            ],
            bulk: [
                this.createBulkThreadActionsTool()
            ]
        };
    }
}
//# sourceMappingURL=threads.js.map