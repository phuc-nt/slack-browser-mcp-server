/**
 * Sprint 3.2: Advanced Thread Management Tools
 * Factory và base classes cho thread operations
 */

import { BaseSlackTool } from './base.js';
import { SlackAuth } from '../slack/auth.js';
import { SlackClient } from '../slack/client.js';
import { logger } from '../utils/logger.js';
import { 
  SlackTool, 
  ToolContext, 
  ToolExecutionResult,
  ToolValidationResult,
  ToolCategory
} from '../types/tools.js';
import {
  ThreadToolParams,
  ThreadContextResult,
  ThreadNavigationResult,
  ThreadSummary,
  ThreadParticipantsResult,
  BulkActionResult,
  CreateThreadArgs,
  ResolveThreadArgs,
  ArchiveThreadArgs,
  SummarizeThreadArgs,
  GetThreadParticipantsArgs,
  NavigateThreadRepliesArgs,
  ThreadOperationResult,
  ThreadOperationError
} from '../types/thread-tools.js';
import { SlackMessage } from '../slack/types.js';

/**
 * Base class for all thread management tools
 */
export abstract class BaseThreadTool extends BaseSlackTool {
  protected slackClient: SlackClient | null = null;
  
  constructor(definition: SlackTool) {
    super(definition);
  }

  /**
   * Initialize Slack client với authentication
   */
  protected async initializeSlackClient(): Promise<SlackClient> {
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
  protected validateThreadParams(args: any): ThreadOperationError | null {
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
  protected async getThreadReplies(
    channelId: string, 
    threadTs: string, 
    limit?: number
  ): Promise<ThreadOperationResult<SlackMessage[]>> {
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
    } catch (error) {
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
  protected calculateThreadAge(threadTs: string): number {
    const threadTimestamp = parseFloat(threadTs) * 1000;
    const now = Date.now();
    return Math.round((now - threadTimestamp) / (1000 * 60 * 60) * 100) / 100;
  }

  /**
   * Extract unique participants từ thread messages
   */
  protected extractParticipants(messages: SlackMessage[]): string[] {
    const participants = new Set<string>();
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
  protected determineThreadStatus(messages: SlackMessage[]): 'active' | 'resolved' | 'archived' {
    const parentMessage = messages[0];
    if (!parentMessage) return 'active';

    // Check for resolved reactions
    const reactions = parentMessage.reactions || [];
    const hasResolvedReaction = reactions.some(r => 
      ['white_check_mark', 'heavy_check_mark', '✅'].includes(r.name)
    );
    if (hasResolvedReaction) return 'resolved';

    // Check for archive reactions
    const hasArchiveReaction = reactions.some(r => 
      ['file_folder', 'card_file_box', '📁'].includes(r.name)
    );
    if (hasArchiveReaction) return 'archived';

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
  




  /**
   * Action Tools (3 tools)
   */

  static createCreateThreadTool(): SlackTool {
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

  static createResolveThreadTool(): SlackTool {
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

  static createArchiveThreadTool(): SlackTool {
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





  /**
   * Bulk Operations Tool (1 tool)
   */

  static createBulkThreadActionsTool(): SlackTool {
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
  static getAllThreadTools(): SlackTool[] {
    return [
      // Action tools
      this.createCreateThreadTool(),
      this.createResolveThreadTool(),
      this.createArchiveThreadTool(),
      
      // Bulk operations
      this.createBulkThreadActionsTool()
    ];
  }

  /**
   * Get thread tools by category
   */
  static getThreadToolsByCategory(): Record<string, SlackTool[]> {
    return {
      actions: [
        this.createCreateThreadTool(),
        this.createResolveThreadTool(),
        this.createArchiveThreadTool()
      ],
      bulk: [
        this.createBulkThreadActionsTool()
      ]
    };
  }
}