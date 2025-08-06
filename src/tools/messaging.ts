/**
 * Slack Messaging Tools - MCP-compliant action operations
 * These tools perform messaging actions (POST/PUT/DELETE operations)
 */

import { BaseSlackTool } from './base.js';
import { SlackAuth } from '../slack/auth.js';
import { SlackClient } from '../slack/client.js';
import { logger } from '../utils/logger.js';
import { 
  SlackTool, 
  ToolContext, 
  ToolExecutionResult,
  ToolValidationResult 
} from '../types/tools.js';
import { SlackPostMessageResponse } from '../slack/types.js';

/**
 * Arguments for posting a message
 */
export interface PostMessageArgs {
  channel: string;          // Channel ID or name
  text: string;             // Message content
  thread_ts?: string;       // Reply to thread (optional)
  blocks?: any[];           // Rich formatting blocks (optional)
  attachments?: any[];      // Legacy attachments (optional)
  unfurl_links?: boolean;   // Auto-unfurl links (optional)
}

/**
 * Arguments for updating a message
 */
export interface UpdateMessageArgs {
  channel: string;          // Channel ID 
  ts: string;               // Message timestamp
  text: string;             // New message content
  blocks?: any[];           // New formatting blocks (optional)
}

/**
 * Arguments for deleting a message
 */
export interface DeleteMessageArgs {
  channel: string;          // Channel ID
  ts: string;               // Message timestamp to delete
}

/**
 * Arguments for replying to a thread
 */
export interface PostThreadReplyArgs {
  channel: string;          // Channel ID
  thread_ts: string;        // Parent message timestamp
  text: string;             // Reply content
  blocks?: any[];           // Rich formatting blocks (optional)
}

/**
 * Tool for posting messages to Slack channels
 * MCP Classification: Tool (Action - POST operation)
 */
export class PostMessageTool extends BaseSlackTool {
  constructor() {
    const definition: SlackTool = {
      name: 'post_message',
      description: 'Post a message to a Slack channel or thread',
      category: 'messaging',
      action: 'POST',
      requiresAuth: true,
      rateLimit: {
        rpm: 50,
        burst: 10
      },
      inputSchema: {
        type: 'object',
        properties: {
          channel: {
            type: 'string',
            description: 'Channel ID (e.g., C1234567890) or channel name (e.g., #general)',
            minLength: 1
          },
          text: {
            type: 'string', 
            description: 'Message content to post',
            minLength: 1,
            maxLength: 40000
          },
          thread_ts: {
            type: 'string',
            description: 'Optional: Reply to this message thread (message timestamp)',
            pattern: '^\\d+\\.\\d+$'
          },
          blocks: {
            type: 'array',
            description: 'Optional: Rich formatting using Slack Block Kit',
            items: {
              type: 'object'
            }
          },
          attachments: {
            type: 'array',
            description: 'Optional: Legacy attachments (deprecated, use blocks instead)',
            items: {
              type: 'object' 
            }
          },
          unfurl_links: {
            type: 'boolean',
            description: 'Optional: Automatically unfurl links in the message (default: true)',
            default: true
          }
        },
        required: ['channel', 'text']
      }
    };

    super(definition);
  }

  /**
   * Validate post message arguments
   */
  async validate(args: PostMessageArgs): Promise<ToolValidationResult> {
    const errors: string[] = [];

    // Validate channel
    if (!args.channel || args.channel.trim().length === 0) {
      errors.push('Channel is required');
    }

    // Validate text content
    if (!args.text || args.text.trim().length === 0) {
      errors.push('Message text is required');
    } else if (args.text.length > 40000) {
      errors.push('Message text exceeds 40,000 character limit');
    }

    // Validate thread_ts format if provided
    if (args.thread_ts && !/^\d+\.\d+$/.test(args.thread_ts)) {
      errors.push('Invalid thread_ts format (must be like "1234567890.123456")');
    }

    // Validate blocks if provided
    if (args.blocks && !Array.isArray(args.blocks)) {
      errors.push('Blocks must be an array');
    }

    // Validate attachments if provided
    if (args.attachments && !Array.isArray(args.attachments)) {
      errors.push('Attachments must be an array');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Execute post message operation
   */
  protected async executeImpl(args: PostMessageArgs, context: ToolContext): Promise<ToolExecutionResult> {
    try {
      logger.info('Posting message to Slack', {
        channel: args.channel,
        hasThreadTs: !!args.thread_ts,
        hasBlocks: !!args.blocks,
        textLength: args.text.length
      });

      // Authenticate with Slack
      const auth = new SlackAuth();
      const authResult = await auth.authenticate();
      
      if (!authResult.success || !authResult.tokens) {
        return this.createErrorResult(
          authResult.error || 'Authentication failed',
          'AUTH_ERROR',
          { apiCalls: 0, cacheHits: 0 }
        );
      }

      // Create API client
      const client = new SlackClient(authResult.tokens);

      // Prepare message data
      const messageData: any = {
        channel: args.channel.trim(),
        text: args.text.trim(),
      };

      // Add optional parameters
      if (args.thread_ts) {
        messageData.thread_ts = args.thread_ts;
      }

      if (args.blocks && args.blocks.length > 0) {
        messageData.blocks = JSON.stringify(args.blocks);
      }

      if (args.attachments && args.attachments.length > 0) {
        messageData.attachments = JSON.stringify(args.attachments);
      }

      if (args.unfurl_links !== undefined) {
        messageData.unfurl_links = args.unfurl_links;
      }

      // Post message via API client
      const response: SlackPostMessageResponse = await client.postMessage(
        messageData.channel,
        messageData.text,
        messageData.thread_ts
      );

      // Format successful response
      const result = {
        success: true,
        message: {
          channel: response.channel,
          ts: response.ts,
          text: response.message.text,
          user: response.message.user,
          thread_ts: response.message.thread_ts,
          posted_at: new Date().toISOString()
        },
        metadata: {
          channel_id: response.channel,
          message_ts: response.ts,
          is_thread_reply: !!args.thread_ts,
          has_rich_formatting: !!(args.blocks || args.attachments)
        }
      };

      logger.info('Message posted successfully', {
        channel: response.channel,
        messageTs: response.ts,
        isThreadReply: !!args.thread_ts
      });

      return this.createSuccessResult(result, {
        apiCalls: 1,
        cacheHits: 0,
        executionTime: Date.now()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('Failed to post message', {
        error: errorMessage,
        channel: args.channel,
        hasThreadTs: !!args.thread_ts
      });

      // Categorize error types
      let errorCode = 'EXECUTION_ERROR';
      if (errorMessage.includes('channel_not_found')) {
        errorCode = 'CHANNEL_NOT_FOUND';
      } else if (errorMessage.includes('not_in_channel')) {
        errorCode = 'NOT_IN_CHANNEL';
      } else if (errorMessage.includes('rate_limited')) {
        errorCode = 'RATE_LIMITED';
      } else if (errorMessage.includes('token')) {
        errorCode = 'AUTH_ERROR';
      }

      return this.createErrorResult(
        `Failed to post message: ${errorMessage}`,
        errorCode,
        { apiCalls: 1, cacheHits: 0 }
      );
    }
  }
}

/**
 * Tool for replying to message threads
 * MCP Classification: Tool (Action - POST operation) 
 */
export class PostThreadReplyTool extends BaseSlackTool {
  constructor() {
    const definition: SlackTool = {
      name: 'post_thread_reply',
      description: 'Reply to a message thread in Slack',
      category: 'messaging',
      action: 'POST',
      requiresAuth: true,
      rateLimit: {
        rpm: 50,
        burst: 10
      },
      inputSchema: {
        type: 'object',
        properties: {
          channel: {
            type: 'string',
            description: 'Channel ID where the thread exists',
            minLength: 1
          },
          thread_ts: {
            type: 'string',
            description: 'Parent message timestamp to reply to',
            pattern: '^\\d+\\.\\d+$'
          },
          text: {
            type: 'string',
            description: 'Reply content',
            minLength: 1,
            maxLength: 40000
          },
          blocks: {
            type: 'array',
            description: 'Optional: Rich formatting using Slack Block Kit',
            items: {
              type: 'object'
            }
          }
        },
        required: ['channel', 'thread_ts', 'text']
      }
    };

    super(definition);
  }

  /**
   * Validate thread reply arguments
   */
  async validate(args: PostThreadReplyArgs): Promise<ToolValidationResult> {
    const errors: string[] = [];

    if (!args.channel || args.channel.trim().length === 0) {
      errors.push('Channel is required');
    }

    if (!args.thread_ts || !/^\d+\.\d+$/.test(args.thread_ts)) {
      errors.push('Valid thread_ts is required (format: "1234567890.123456")');
    }

    if (!args.text || args.text.trim().length === 0) {
      errors.push('Reply text is required');
    } else if (args.text.length > 40000) {
      errors.push('Reply text exceeds 40,000 character limit');
    }

    if (args.blocks && !Array.isArray(args.blocks)) {
      errors.push('Blocks must be an array');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Execute thread reply operation
   */
  protected async executeImpl(args: PostThreadReplyArgs, context: ToolContext): Promise<ToolExecutionResult> {
    try {
      logger.info('Posting thread reply to Slack', {
        channel: args.channel,
        threadTs: args.thread_ts,
        textLength: args.text.length
      });

      // Authenticate with Slack
      const auth = new SlackAuth();
      const authResult = await auth.authenticate();
      
      if (!authResult.success || !authResult.tokens) {
        return this.createErrorResult(
          authResult.error || 'Authentication failed',
          'AUTH_ERROR',
          { apiCalls: 0, cacheHits: 0 }
        );
      }

      // Create API client
      const client = new SlackClient(authResult.tokens);

      // Post thread reply (using postMessage with thread_ts)
      const response = await client.postMessage(
        args.channel.trim(),
        args.text.trim(), 
        args.thread_ts
      );

      // Format successful response
      const result = {
        success: true,
        reply: {
          channel: response.channel,
          ts: response.ts,
          text: response.message.text,
          user: response.message.user,
          thread_ts: response.message.thread_ts,
          parent_ts: args.thread_ts,
          posted_at: new Date().toISOString()
        },
        thread_info: {
          parent_message_ts: args.thread_ts,
          reply_count: response.message.reply_count || 1
        }
      };

      logger.info('Thread reply posted successfully', {
        channel: response.channel,
        replyTs: response.ts,
        parentTs: args.thread_ts
      });

      return this.createSuccessResult(result, {
        apiCalls: 1,
        cacheHits: 0
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('Failed to post thread reply', {
        error: errorMessage,
        channel: args.channel,
        threadTs: args.thread_ts
      });

      let errorCode = 'EXECUTION_ERROR';
      if (errorMessage.includes('thread_not_found')) {
        errorCode = 'THREAD_NOT_FOUND';
      } else if (errorMessage.includes('channel_not_found')) {
        errorCode = 'CHANNEL_NOT_FOUND';
      } else if (errorMessage.includes('not_in_channel')) {
        errorCode = 'NOT_IN_CHANNEL';
      }

      return this.createErrorResult(
        `Failed to post thread reply: ${errorMessage}`,
        errorCode,
        { apiCalls: 1, cacheHits: 0 }
      );
    }
  }
}

/**
 * Tool for updating/editing existing messages
 * MCP Classification: Tool (Action - PUT operation)
 */
export class UpdateMessageTool extends BaseSlackTool {
  constructor() {
    const definition: SlackTool = {
      name: 'update_message',
      description: 'Update/edit an existing Slack message',
      category: 'messaging',
      action: 'PUT',
      requiresAuth: true,
      rateLimit: {
        rpm: 30,
        burst: 5
      },
      inputSchema: {
        type: 'object',
        properties: {
          channel: {
            type: 'string',
            description: 'Channel ID where the message exists',
            minLength: 1
          },
          ts: {
            type: 'string',
            description: 'Message timestamp to update',
            pattern: '^\\d+\\.\\d+$'
          },
          text: {
            type: 'string',
            description: 'New message content',
            minLength: 1,
            maxLength: 40000
          },
          blocks: {
            type: 'array',
            description: 'Optional: New rich formatting using Slack Block Kit',
            items: {
              type: 'object'
            }
          }
        },
        required: ['channel', 'ts', 'text']
      }
    };

    super(definition);
  }

  /**
   * Validate update message arguments
   */
  async validate(args: UpdateMessageArgs): Promise<ToolValidationResult> {
    const errors: string[] = [];

    if (!args.channel || args.channel.trim().length === 0) {
      errors.push('Channel is required');
    }

    if (!args.ts || !/^\d+\.\d+$/.test(args.ts)) {
      errors.push('Valid message timestamp is required (format: "1234567890.123456")');
    }

    if (!args.text || args.text.trim().length === 0) {
      errors.push('New message text is required');
    } else if (args.text.length > 40000) {
      errors.push('Message text exceeds 40,000 character limit');
    }

    if (args.blocks && !Array.isArray(args.blocks)) {
      errors.push('Blocks must be an array');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Execute update message operation
   */
  protected async executeImpl(args: UpdateMessageArgs, context: ToolContext): Promise<ToolExecutionResult> {
    try {
      logger.info('Updating Slack message', {
        channel: args.channel,
        messageTs: args.ts,
        newTextLength: args.text.length
      });

      // Authenticate with Slack
      const auth = new SlackAuth();
      const authResult = await auth.authenticate();
      
      if (!authResult.success || !authResult.tokens) {
        return this.createErrorResult(
          authResult.error || 'Authentication failed',
          'AUTH_ERROR',
          { apiCalls: 0, cacheHits: 0 }
        );
      }

      // Create API client
      const client = new SlackClient(authResult.tokens);

      // Update message
      const response = await client.updateMessage(
        args.channel.trim(),
        args.ts,
        args.text.trim(),
        args.blocks
      );

      // Format successful response
      const result = {
        success: true,
        updated_message: {
          channel: response.channel,
          ts: response.ts,
          text: response.message.text,
          user: response.message.user,
          updated_at: new Date().toISOString()
        },
        metadata: {
          original_ts: args.ts,
          has_rich_formatting: !!(args.blocks && args.blocks.length > 0)
        }
      };

      logger.info('Message updated successfully', {
        channel: response.channel,
        messageTs: response.ts
      });

      return this.createSuccessResult(result, {
        apiCalls: 1,
        cacheHits: 0
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('Failed to update message', {
        error: errorMessage,
        channel: args.channel,
        messageTs: args.ts
      });

      let errorCode = 'EXECUTION_ERROR';
      if (errorMessage.includes('message_not_found')) {
        errorCode = 'MESSAGE_NOT_FOUND';
      } else if (errorMessage.includes('cant_update_message')) {
        errorCode = 'CANNOT_UPDATE_MESSAGE';
      } else if (errorMessage.includes('channel_not_found')) {
        errorCode = 'CHANNEL_NOT_FOUND';
      }

      return this.createErrorResult(
        `Failed to update message: ${errorMessage}`,
        errorCode,
        { apiCalls: 1, cacheHits: 0 }
      );
    }
  }
}

/**
 * Tool for deleting messages
 * MCP Classification: Tool (Action - DELETE operation)
 */
export class DeleteMessageTool extends BaseSlackTool {
  constructor() {
    const definition: SlackTool = {
      name: 'delete_message',
      description: 'Delete a Slack message',
      category: 'messaging',
      action: 'DELETE',
      requiresAuth: true,
      rateLimit: {
        rpm: 20,
        burst: 5
      },
      inputSchema: {
        type: 'object',
        properties: {
          channel: {
            type: 'string',
            description: 'Channel ID where the message exists',
            minLength: 1
          },
          ts: {
            type: 'string',
            description: 'Message timestamp to delete',
            pattern: '^\\d+\\.\\d+$'
          }
        },
        required: ['channel', 'ts']
      }
    };

    super(definition);
  }

  /**
   * Validate delete message arguments
   */
  async validate(args: DeleteMessageArgs): Promise<ToolValidationResult> {
    const errors: string[] = [];

    if (!args.channel || args.channel.trim().length === 0) {
      errors.push('Channel is required');
    }

    if (!args.ts || !/^\d+\.\d+$/.test(args.ts)) {
      errors.push('Valid message timestamp is required (format: "1234567890.123456")');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Execute delete message operation
   */
  protected async executeImpl(args: DeleteMessageArgs, context: ToolContext): Promise<ToolExecutionResult> {
    try {
      logger.info('Deleting Slack message', {
        channel: args.channel,
        messageTs: args.ts
      });

      // Authenticate with Slack
      const auth = new SlackAuth();
      const authResult = await auth.authenticate();
      
      if (!authResult.success || !authResult.tokens) {
        return this.createErrorResult(
          authResult.error || 'Authentication failed',
          'AUTH_ERROR',
          { apiCalls: 0, cacheHits: 0 }
        );
      }

      // Create API client
      const client = new SlackClient(authResult.tokens);

      // Delete message
      const response = await client.deleteMessage(
        args.channel.trim(),
        args.ts
      );

      // Format successful response
      const result = {
        success: true,
        deleted_message: {
          channel: response.channel,
          ts: response.ts,
          deleted_at: new Date().toISOString()
        }
      };

      logger.info('Message deleted successfully', {
        channel: response.channel,
        messageTs: response.ts
      });

      return this.createSuccessResult(result, {
        apiCalls: 1,
        cacheHits: 0
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('Failed to delete message', {
        error: errorMessage,
        channel: args.channel,
        messageTs: args.ts
      });

      let errorCode = 'EXECUTION_ERROR';
      if (errorMessage.includes('message_not_found')) {
        errorCode = 'MESSAGE_NOT_FOUND';
      } else if (errorMessage.includes('cant_delete_message')) {
        errorCode = 'CANNOT_DELETE_MESSAGE';
      } else if (errorMessage.includes('channel_not_found')) {
        errorCode = 'CHANNEL_NOT_FOUND';
      }

      return this.createErrorResult(
        `Failed to delete message: ${errorMessage}`,
        errorCode,
        { apiCalls: 1, cacheHits: 0 }
      );
    }
  }
}
