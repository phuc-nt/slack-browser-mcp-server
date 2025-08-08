/**
 * Sprint 3.2: Action Thread Tools Implementation
 * Tools 3-5: create_thread, resolve_thread, archive_thread
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
  CreateThreadArgs,
  ResolveThreadArgs,
  ArchiveThreadArgs,
  ThreadOperationResult
} from '../types/thread-tools.js';
import { SlackMessage } from '../slack/types.js';

/**
 * Tool 3: Create Thread
 * Starts a new thread from an existing message
 */
export class CreateThreadTool extends BaseThreadTool {
  
  async execute(args: CreateThreadArgs, context: ToolContext): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    logger.info('Executing create_thread', { 
      channel_id: args.channel_id,
      message_ts: args.message_ts,
      broadcast: args.broadcast
    });

    try {
      // Validate parameters
      const validationResult = await this.validate(args);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validationResult.errors.join(', ')}`,
          errorCode: 'VALIDATION_ERROR',
          metadata: {
            processingTimeMs: Date.now() - startTime,
            apiCallsUsed: 0
          }
        };
      }

      const client = await this.initializeSlackClient();

      // First, verify the source message exists
      try {
        const messageInfo = await client.getPermalink(args.channel_id, args.message_ts);
        if (!messageInfo.ok) {
          return {
            success: false,
            error: 'Source message not found or not accessible',
            errorCode: 'SOURCE_MESSAGE_NOT_FOUND',
            metadata: {
              processingTimeMs: Date.now() - startTime,
              apiCallsUsed: 1
            }
          };
        }
      } catch (error) {
        logger.warn('Could not verify source message', { error });
        // Continue anyway - the post will fail if message doesn't exist
      }

      // Post the initial reply to create the thread
      const postResponse = await client.postMessage({
        channel: args.channel_id,
        text: args.initial_reply,
        thread_ts: args.message_ts,
        reply_broadcast: args.broadcast || false
      });

      if (!postResponse.ok) {
        return {
          success: false,
          error: `Failed to create thread: ${postResponse.error}`,
          errorCode: 'THREAD_CREATION_FAILED',
          metadata: {
            processingTimeMs: Date.now() - startTime,
            apiCallsUsed: 2
          }
        };
      }

      // Add thread starter reaction to indicate thread was created
      try {
        await client.addReaction(args.channel_id, args.message_ts, 'speech_balloon');
      } catch (error) {
        logger.warn('Could not add thread starter reaction', { error });
        // Not critical - thread was still created successfully
      }

      const result = {
        thread_ts: args.message_ts,
        channel_id: args.channel_id,
        reply_ts: postResponse.ts,
        message: postResponse.message,
        thread_created: true,
        broadcast: args.broadcast || false
      };

      logger.info('Thread created successfully', {
        thread_ts: args.message_ts,
        reply_ts: postResponse.ts,
        broadcast: args.broadcast,
        processing_time_ms: Date.now() - startTime
      });

      return {
        success: true,
        data: result,
        metadata: {
          processingTimeMs: Date.now() - startTime,
          apiCallsUsed: 3, // permalink check + post + reaction
          cached: false
        }
      };

    } catch (error) {
      logger.error('Error in create_thread execution', { 
        error,
        channel_id: args.channel_id,
        message_ts: args.message_ts
      });

      return {
        success: false,
        error: `Thread creation failed: ${error}`,
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

    if (!args.channel_id) {
      errors.push('channel_id is required');
    } else if (!/^[CDG][A-Z0-9]+$/.test(args.channel_id)) {
      errors.push('channel_id must be a valid Slack channel ID');
    }

    if (!args.message_ts) {
      errors.push('message_ts is required');
    } else if (!/^\d+\.\d+$/.test(args.message_ts)) {
      errors.push('message_ts must be in format "1234567890.123456"');
    }

    if (!args.initial_reply) {
      errors.push('initial_reply is required');
    } else if (args.initial_reply.length > 4000) {
      errors.push('initial_reply must be 4000 characters or less');
    }

    if (args.broadcast !== undefined && typeof args.broadcast !== 'boolean') {
      errors.push('broadcast must be a boolean');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Tool 4: Resolve Thread
 * Marks thread as resolved với optional summary
 */
export class ResolveThreadTool extends BaseThreadTool {
  
  async execute(args: ResolveThreadArgs, context: ToolContext): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    logger.info('Executing resolve_thread', { 
      thread_ts: args.thread_ts,
      channel_id: args.channel_id,
      mark_with_reaction: args.mark_with_reaction
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

      const client = await this.initializeSlackClient();
      let apiCallsUsed = 0;

      // Add resolved reaction to parent message
      if (args.mark_with_reaction !== false) {
        try {
          await client.addReaction(args.channel_id, args.thread_ts, 'white_check_mark');
          apiCallsUsed++;
          logger.debug('Added resolved reaction to thread');
        } catch (error) {
          logger.warn('Could not add resolved reaction', { error });
          // Continue - not critical for thread resolution
        }
      }

      // Post resolution summary if provided
      let resolutionMessageTs: string | undefined;
      if (args.resolution_summary) {
        try {
          const postResponse = await client.postMessage({
            channel: args.channel_id,
            text: `🎯 **Thread Resolved**\n\n${args.resolution_summary}`,
            thread_ts: args.thread_ts,
            reply_broadcast: false
          });
          
          if (postResponse.ok) {
            resolutionMessageTs = postResponse.ts;
            apiCallsUsed++;
            logger.debug('Posted resolution summary', { message_ts: postResponse.ts });
          }
        } catch (error) {
          logger.warn('Could not post resolution summary', { error });
          // Continue - reaction was still added
        }
      }

      // Notify participants if requested
      if (args.notify_participants) {
        try {
          // Get thread participants first
          const threadResult = await this.getThreadReplies(args.channel_id, args.thread_ts, 100);
          if (threadResult.success && threadResult.data) {
            const participants = this.extractParticipants(threadResult.data);
            const mentions = participants.map(userId => `<@${userId}>`).join(' ');
            
            await client.postMessage({
              channel: args.channel_id,
              text: `📢 Thread marked as resolved. ${mentions}`,
              thread_ts: args.thread_ts,
              reply_broadcast: false
            });
            apiCallsUsed += 2; // get replies + post notification
          }
        } catch (error) {
          logger.warn('Could not notify participants', { error });
        }
      }

      const result = {
        thread_ts: args.thread_ts,
        channel_id: args.channel_id,
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolution_message_ts: resolutionMessageTs,
        reaction_added: args.mark_with_reaction !== false,
        participants_notified: args.notify_participants || false,
        summary: args.resolution_summary
      };

      logger.info('Thread resolved successfully', {
        thread_ts: args.thread_ts,
        resolution_provided: !!args.resolution_summary,
        participants_notified: args.notify_participants,
        processing_time_ms: Date.now() - startTime
      });

      return {
        success: true,
        data: result,
        metadata: {
          processingTimeMs: Date.now() - startTime,
          apiCallsUsed: apiCallsUsed,
          cached: false
        }
      };

    } catch (error) {
      logger.error('Error in resolve_thread execution', { 
        error,
        thread_ts: args.thread_ts,
        channel_id: args.channel_id
      });

      return {
        success: false,
        error: `Thread resolution failed: ${error}`,
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

    if (args.resolution_summary && args.resolution_summary.length > 4000) {
      errors.push('resolution_summary must be 4000 characters or less');
    }

    if (args.mark_with_reaction !== undefined && typeof args.mark_with_reaction !== 'boolean') {
      errors.push('mark_with_reaction must be a boolean');
    }

    if (args.notify_participants !== undefined && typeof args.notify_participants !== 'boolean') {
      errors.push('notify_participants must be a boolean');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Tool 5: Archive Thread
 * Archives thread by adding archive reaction và optional pin
 */
export class ArchiveThreadTool extends BaseThreadTool {
  
  async execute(args: ArchiveThreadArgs, context: ToolContext): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    logger.info('Executing archive_thread', { 
      thread_ts: args.thread_ts,
      channel_id: args.channel_id,
      pin_thread: args.pin_thread,
      add_to_bookmarks: args.add_to_bookmarks
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

      const client = await this.initializeSlackClient();
      let apiCallsUsed = 0;
      const actions: string[] = [];

      // Add archive reaction to parent message  
      try {
        await client.addReaction(args.channel_id, args.thread_ts, 'file_folder');
        apiCallsUsed++;
        actions.push('archive_reaction');
        logger.debug('Added archive reaction to thread');
      } catch (error) {
        logger.warn('Could not add archive reaction', { error });
        // Continue with other archive actions
      }

      // Pin thread if requested
      let pinnedMessage = false;
      if (args.pin_thread) {
        try {
          const pinResponse = await client.pinMessage(args.channel_id, args.thread_ts);
          if (pinResponse.ok) {
            pinnedMessage = true;
            actions.push('pinned');
            apiCallsUsed++;
            logger.debug('Pinned thread message');
          }
        } catch (error) {
          logger.warn('Could not pin thread message', { error });
        }
      }

      // Add to bookmarks if requested (note: this might require specific permissions)
      let addedToBookmarks = false;
      if (args.add_to_bookmarks) {
        try {
          // Note: Bookmark API might not be available in all setups
          // This is a placeholder for potential bookmark functionality
          logger.info('Bookmark functionality requested but not implemented in this version');
          actions.push('bookmark_requested');
        } catch (error) {
          logger.warn('Could not add to bookmarks', { error });
        }
      }

      // Post archive reason if provided
      let archiveMessageTs: string | undefined;
      if (args.archive_reason) {
        try {
          const postResponse = await client.postMessage({
            channel: args.channel_id,
            text: `📁 **Thread Archived**\n\nReason: ${args.archive_reason}`,
            thread_ts: args.thread_ts,
            reply_broadcast: false
          });
          
          if (postResponse.ok) {
            archiveMessageTs = postResponse.ts;
            actions.push('archive_reason_posted');
            apiCallsUsed++;
            logger.debug('Posted archive reason', { message_ts: postResponse.ts });
          }
        } catch (error) {
          logger.warn('Could not post archive reason', { error });
        }
      }

      const result = {
        thread_ts: args.thread_ts,
        channel_id: args.channel_id,
        archived: true,
        archived_at: new Date().toISOString(),
        actions_performed: actions,
        archive_message_ts: archiveMessageTs,
        pinned: pinnedMessage,
        bookmarked: addedToBookmarks,
        reason: args.archive_reason
      };

      logger.info('Thread archived successfully', {
        thread_ts: args.thread_ts,
        actions_performed: actions,
        pinned: pinnedMessage,
        processing_time_ms: Date.now() - startTime
      });

      return {
        success: true,
        data: result,
        metadata: {
          processingTimeMs: Date.now() - startTime,
          apiCallsUsed: apiCallsUsed,
          cached: false
        }
      };

    } catch (error) {
      logger.error('Error in archive_thread execution', { 
        error,
        thread_ts: args.thread_ts,
        channel_id: args.channel_id
      });

      return {
        success: false,
        error: `Thread archival failed: ${error}`,
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

    if (args.archive_reason && args.archive_reason.length > 4000) {
      errors.push('archive_reason must be 4000 characters or less');
    }

    if (args.pin_thread !== undefined && typeof args.pin_thread !== 'boolean') {
      errors.push('pin_thread must be a boolean');
    }

    if (args.add_to_bookmarks !== undefined && typeof args.add_to_bookmarks !== 'boolean') {
      errors.push('add_to_bookmarks must be a boolean');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}