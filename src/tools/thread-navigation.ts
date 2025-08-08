/**
 * Sprint 3.2: Navigation Thread Tools Implementation
 * Tools 1-2: get_thread_context, navigate_thread_replies
 */

import { BaseThreadTool } from './threads.js';
import { SlackAuth } from '../slack/auth.js';
import { SlackClient } from '../slack/client.js';
import { logger } from '../utils/logger.js';
import { 
  ToolContext, 
  ToolExecutionResult,
  ToolValidationResult 
} from '../types/tools.js';
import {
  ThreadToolParams,
  ThreadContextResult,
  ThreadNavigationResult,
  ThreadOperationResult,
  NavigateThreadRepliesArgs
} from '../types/thread-tools.js';
import { SlackMessage, SlackChannel } from '../slack/types.js';

/**
 * Tool 1: Get Thread Context
 * Provides complete thread information với parent message và metadata
 */
export class GetThreadContextTool extends BaseSlackTool {
  
  async execute(args: ThreadToolParams, context: ToolContext): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    logger.info('Executing get_thread_context', { 
      thread_ts: args.thread_ts,
      channel_id: args.channel_id 
    });

    try {
      // Validate input parameters
      const validationError = this.validateThreadParams(args);
      if (validationError) {
        return {
          success: false,
          error: validationError.message,
          errorCode: validationError.code,
          metadata: {
            processingTimeMs: Date.now() - startTime,
            apiCallsUsed: 0
          }
        };
      }

      // Get thread replies
      const threadResult = await this.getThreadReplies(
        args.channel_id,
        args.thread_ts,
        100 // Get all replies for full context
      );

      if (!threadResult.success || !threadResult.data) {
        return {
          success: false,
          error: threadResult.error?.message || 'Failed to fetch thread data',
          errorCode: threadResult.error?.code || 'THREAD_FETCH_FAILED',
          metadata: {
            processingTimeMs: Date.now() - startTime,
            apiCallsUsed: threadResult.api_calls_made
          }
        };
      }

      const messages = threadResult.data;
      const parentMessage = messages[0];
      const replies = messages.slice(1);

      // Get channel information for context
      let channelName: string | undefined;
      try {
        const client = await this.initializeSlackClient();
        const channelInfo = await client.getConversationInfo(args.channel_id);
        channelName = channelInfo.channel?.name;
      } catch (error) {
        logger.warn('Could not fetch channel name', { error });
      }

      // Extract participants and calculate metadata
      const participants = this.extractParticipants(messages);
      const threadAge = this.calculateThreadAge(args.thread_ts);
      const status = this.determineThreadStatus(messages);
      
      // Calculate engagement metrics
      const lastActivity = replies.length > 0 
        ? replies[replies.length - 1].ts 
        : parentMessage.ts;

      // Build thread context result
      const threadContext: ThreadContextResult = {
        thread_ts: args.thread_ts,
        channel: args.channel_id,
        channel_name: channelName,
        parent_message: parentMessage,
        replies: replies,
        participants: participants,
        total_replies: replies.length,
        last_activity: lastActivity,
        thread_age_hours: threadAge,
        status: status,
        metadata: {
          created_at: new Date(parseFloat(args.thread_ts) * 1000).toISOString(),
          updated_at: new Date(parseFloat(lastActivity) * 1000).toISOString(),
          is_broadcast: parentMessage.reply_broadcast || false,
          reply_users_count: participants.length,
          reply_count: replies.length,
          latest_reply: replies.length > 0 ? replies[replies.length - 1].ts : undefined
        }
      };

      // Include reactions if requested
      if (args.include_reactions && !threadContext.parent_message.reactions) {
        // Reactions are typically included in the message data from Slack API
        logger.debug('Reactions included in thread context', {
          parent_reactions: threadContext.parent_message.reactions?.length || 0
        });
      }

      logger.info('Thread context retrieved successfully', {
        thread_ts: args.thread_ts,
        total_replies: replies.length,
        participants: participants.length,
        status: status,
        processing_time_ms: Date.now() - startTime
      });

      return {
        success: true,
        data: threadContext,
        metadata: {
          processingTimeMs: Date.now() - startTime,
          apiCallsUsed: threadResult.api_calls_made + (channelName ? 1 : 0),
          cached: false
        }
      };

    } catch (error) {
      logger.error('Error in get_thread_context execution', { 
        error,
        thread_ts: args.thread_ts,
        channel_id: args.channel_id
      });

      return {
        success: false,
        error: `Thread context retrieval failed: ${error}`,
        errorCode: 'EXECUTION_ERROR',
        metadata: {
          processingTimeMs: Date.now() - startTime,
          apiCallsUsed: 0
        }
      };
    }
  }

  async validate(args: any): Promise<ToolValidationResult> {
    const errors: string[] = [];

    if (!args.thread_ts) {
      errors.push('thread_ts is required');
    } else if (!/^\d+\.\d+$/.test(args.thread_ts)) {
      errors.push('thread_ts must be in format "1234567890.123456"');
    }

    if (!args.channel_id) {
      errors.push('channel_id is required');
    } else if (!/^[CDG][A-Z0-9]+$/.test(args.channel_id)) {
      errors.push('channel_id must be a valid Slack channel ID');
    }

    if (args.include_reactions !== undefined && typeof args.include_reactions !== 'boolean') {
      errors.push('include_reactions must be a boolean');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Tool 2: Navigate Thread Replies  
 * Provides paginated navigation through thread replies
 */
export class NavigateThreadRepliesTool extends BaseThreadTool {
  
  async execute(args: NavigateThreadRepliesArgs, context: ToolContext): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    logger.info('Executing navigate_thread_replies', { 
      thread_ts: args.thread_ts,
      channel_id: args.channel_id,
      limit: args.limit,
      cursor: args.cursor
    });

    try {
      // Validate input parameters
      const validationError = this.validateThreadParams(args);
      if (validationError) {
        return {
          success: false,
          error: validationError.message,
          errorCode: validationError.code,
          metadata: {
            processingTimeMs: Date.now() - startTime,
            apiCallsUsed: 0
          }
        };
      }

      const limit = Math.min(Math.max(args.limit || 20, 1), 100);
      const includeParent = args.include_parent !== false;

      // Get thread replies với pagination
      const client = await this.initializeSlackClient();
      
      let fetchLimit = includeParent ? limit : limit + 1; // +1 to account for parent
      
      const response = await client.getConversationReplies(args.channel_id, args.thread_ts, {
        limit: fetchLimit,
        cursor: args.cursor,
        inclusive: true
      });

      if (!response.ok || !response.messages) {
        return {
          success: false,
          error: `Failed to fetch thread replies: ${response.error}`,
          errorCode: 'THREAD_NAVIGATION_FAILED',
          metadata: {
            processingTimeMs: Date.now() - startTime,
            apiCallsUsed: 1
          }
        };
      }

      let messages = response.messages;
      let parentMessage = messages[0];
      let replies = messages.slice(1);

      // Handle pagination logic
      let nextCursor = response.response_metadata?.next_cursor;
      let hasMore = !!nextCursor;
      
      // If not including parent, remove it from results but keep for total count
      let resultMessages: SlackMessage[];
      if (includeParent) {
        resultMessages = messages.slice(0, limit);
        // Adjust hasMore based on actual limit
        if (messages.length > limit) {
          hasMore = true;
          // Calculate next cursor if we have more data
          if (messages.length >= limit && messages[limit - 1]) {
            nextCursor = messages[limit - 1].ts;
          }
        }
      } else {
        resultMessages = replies.slice(0, limit);
        if (replies.length > limit) {
          hasMore = true;
          nextCursor = replies[limit - 1].ts;
        }
      }

      // Generate previous cursor logic (simplified)
      let prevCursor: string | undefined;
      if (args.cursor) {
        // For real prev cursor, we'd need to track navigation history
        // For now, we'll indicate that previous navigation is possible
        prevCursor = 'prev_available';
      }

      // Get total thread reply count for metadata
      let totalCount = replies.length;
      if (response.messages.length >= fetchLimit && hasMore) {
        // If we hit the limit, there might be more - get accurate count
        try {
          const fullResponse = await client.getConversationReplies(args.channel_id, args.thread_ts, {
            limit: 1000,
            inclusive: false
          });
          if (fullResponse.ok && fullResponse.messages) {
            totalCount = fullResponse.messages.length;
          }
        } catch (error) {
          logger.warn('Could not get accurate total count', { error });
        }
      }

      // Build navigation result
      const navigationResult: ThreadNavigationResult = {
        replies: resultMessages,
        has_more: hasMore,
        next_cursor: nextCursor,
        prev_cursor: prevCursor,
        total_count: totalCount,
        current_page: args.cursor ? undefined : 1, // Page concept needs cursor tracking
        page_size: limit
      };

      logger.info('Thread navigation completed successfully', {
        thread_ts: args.thread_ts,
        replies_returned: resultMessages.length,
        has_more: hasMore,
        total_count: totalCount,
        processing_time_ms: Date.now() - startTime
      });

      return {
        success: true,
        data: navigationResult,
        metadata: {
          processingTimeMs: Date.now() - startTime,
          apiCallsUsed: totalCount > replies.length ? 2 : 1, // Extra call for accurate count
          cached: false
        }
      };

    } catch (error) {
      logger.error('Error in navigate_thread_replies execution', { 
        error,
        thread_ts: args.thread_ts,
        channel_id: args.channel_id
      });

      return {
        success: false,
        error: `Thread navigation failed: ${error}`,
        errorCode: 'EXECUTION_ERROR',
        metadata: {
          processingTimeMs: Date.now() - startTime,
          apiCallsUsed: 0
        }
      };
    }
  }

  async validate(args: any): Promise<ToolValidationResult> {
    const errors: string[] = [];

    if (!args.thread_ts) {
      errors.push('thread_ts is required');
    } else if (!/^\d+\.\d+$/.test(args.thread_ts)) {
      errors.push('thread_ts must be in format "1234567890.123456"');
    }

    if (!args.channel_id) {
      errors.push('channel_id is required');  
    } else if (!/^[CDG][A-Z0-9]+$/.test(args.channel_id)) {
      errors.push('channel_id must be a valid Slack channel ID');
    }

    if (args.limit !== undefined) {
      if (typeof args.limit !== 'number' || args.limit < 1 || args.limit > 100) {
        errors.push('limit must be a number between 1 and 100');
      }
    }

    if (args.cursor !== undefined && typeof args.cursor !== 'string') {
      errors.push('cursor must be a string');
    }

    if (args.include_parent !== undefined && typeof args.include_parent !== 'boolean') {
      errors.push('include_parent must be a boolean');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}