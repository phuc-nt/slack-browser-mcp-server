import { BaseSlackTool } from './base.js';
import { ToolCategory } from '../types/tools.js';
import { logger } from '../utils/logger.js';
/**
 * Ping tool for testing connectivity
 */
export class PingTool extends BaseSlackTool {
    constructor() {
        const definition = {
            name: 'ping',
            description: 'Test tool connectivity and response time',
            category: ToolCategory.SYSTEM,
            inputSchema: {
                type: 'object',
                properties: {
                    message: {
                        type: 'string',
                        description: 'Optional message to echo back',
                        default: 'pong'
                    }
                }
            },
            tags: ['test', 'connectivity'],
            requiresAuth: false
        };
        super(definition);
    }
    async executeImpl(_args, context) {
        const message = _args.message || 'pong';
        logger.info('Ping tool executed', {
            traceId: context.traceId,
            message
        });
        return this.createSuccessResult({
            message: `${message} - Tool system is operational`,
            timestamp: new Date().toISOString(),
            traceId: context.traceId,
            executionTime: Date.now() - context.startTime
        });
    }
}
/**
 * Echo tool for testing input/output
 */
export class EchoTool extends BaseSlackTool {
    constructor() {
        const definition = {
            name: 'echo',
            description: 'Echo back the input for testing',
            category: ToolCategory.SYSTEM,
            inputSchema: {
                type: 'object',
                properties: {
                    text: {
                        type: 'string',
                        description: 'Text to echo back',
                        minLength: 1,
                        maxLength: 1000
                    },
                    repeat: {
                        type: 'number',
                        description: 'Number of times to repeat (max 5)',
                        minimum: 1,
                        maximum: 5,
                        default: 1
                    }
                },
                required: ['text']
            },
            tags: ['test', 'echo'],
            requiresAuth: false
        };
        super(definition);
    }
    async executeImpl(args, context) {
        const { text, repeat = 1 } = args;
        const echoedText = Array(repeat).fill(text).join(' ');
        logger.debug('Echo tool executed', {
            traceId: context.traceId,
            inputLength: text.length,
            repeat
        });
        return this.createSuccessResult({
            original: text,
            echoed: echoedText,
            repeat,
            timestamp: new Date().toISOString(),
            traceId: context.traceId
        });
    }
}
/**
 * Placeholder: Future conversations tools will go here
 * - conversations_history
 * - conversations_replies
 * - conversations_add_message
 * - conversations_info
 */
export class ConversationsPlaceholder {
    static getPlaceholderTools() {
        return [
            {
                name: 'conversations_history_v2',
                description: 'Get messages from a channel or DM (Enhanced version)',
                category: ToolCategory.CONVERSATIONS,
                inputSchema: {
                    type: 'object',
                    properties: {
                        channel_id: {
                            type: 'string',
                            description: 'Channel ID or name (with # prefix)'
                        },
                        limit: {
                            type: 'number',
                            default: 50,
                            minimum: 1,
                            maximum: 200
                        },
                        cursor: {
                            type: 'string',
                            description: 'Pagination cursor'
                        }
                    },
                    required: ['channel_id']
                },
                tags: ['conversations', 'messages', 'slack-api'],
                requiresAuth: true,
                rateLimit: {
                    maxCalls: 100,
                    windowMs: 60000 // 1 minute
                }
            },
            {
                name: 'conversations_replies_v2',
                description: 'Get thread replies for a message (Enhanced version)',
                category: ToolCategory.CONVERSATIONS,
                inputSchema: {
                    type: 'object',
                    properties: {
                        channel_id: {
                            type: 'string',
                            description: 'Channel ID where the thread exists'
                        },
                        thread_ts: {
                            type: 'string',
                            description: 'Timestamp of the parent message'
                        },
                        limit: {
                            type: 'number',
                            default: 50,
                            minimum: 1,
                            maximum: 200
                        }
                    },
                    required: ['channel_id', 'thread_ts']
                },
                tags: ['conversations', 'threads', 'slack-api'],
                requiresAuth: true,
                rateLimit: {
                    maxCalls: 50,
                    windowMs: 60000
                }
            },
            {
                name: 'conversations_post_message',
                description: 'Post a message to a channel or DM',
                category: ToolCategory.CONVERSATIONS,
                inputSchema: {
                    type: 'object',
                    properties: {
                        channel_id: {
                            type: 'string',
                            description: 'Channel ID or name to post to'
                        },
                        text: {
                            type: 'string',
                            description: 'Message text content'
                        },
                        thread_ts: {
                            type: 'string',
                            description: 'Optional thread timestamp to reply to'
                        },
                        markdown: {
                            type: 'boolean',
                            default: true,
                            description: 'Whether to parse text as markdown'
                        }
                    },
                    required: ['channel_id', 'text']
                },
                tags: ['conversations', 'post', 'slack-api'],
                requiresAuth: true,
                rateLimit: {
                    maxCalls: 20,
                    windowMs: 60000
                }
            }
        ];
    }
}
//# sourceMappingURL=conversations.js.map