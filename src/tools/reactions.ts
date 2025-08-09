import { BaseSlackTool } from './base.js';
import { SlackTool, ToolContext, ToolExecutionResult } from '../types/tools.js';
import { SlackAuth } from '../slack/auth.js';
import { SlackClient } from '../slack/client.js';
import { logger } from '../utils/logger.js';

interface ReactToMessageArgs {
  channel_id: string;           // Required: Target channel
  message_ts: string;           // Required: Target message timestamp  
  reaction_type: 'resolved' | 'archived' | 'important' | 'urgent' | 'custom';
  custom_emoji?: string;        // For custom reactions
}

const REACTION_MAPPINGS = {
  resolved: 'white_check_mark',   // ✅ 
  archived: 'package',           // 📦
  important: 'star',             // ⭐
  urgent: 'rotating_light',      // 🚨
} as const;

/**
 * React to Message Tool
 * 
 * Consolidates thread status management tools (resolve_thread, archive_thread, 
 * promote_thread, escalate_thread) into single emoji reaction tool.
 * 
 * Replaces 4 separate tools with unified reaction interface.
 */
export class ReactToMessageTool extends BaseSlackTool {
  constructor() {
    const definition: SlackTool = {
      name: 'react_to_message',
      description: 'Add emoji reaction to any message (replaces resolve/archive/promote/escalate thread tools)',
      category: 'messaging',
      action: 'POST',
      requiresAuth: true,
      rateLimit: {
        rpm: 30,
        burst: 5
      },
      inputSchema: {
        type: 'object',
        properties: {
          channel_id: {
            type: 'string',
            description: 'Channel ID where the message is located'
          },
          message_ts: {
            type: 'string', 
            description: 'Message timestamp to react to'
          },
          reaction_type: {
            type: 'string',
            enum: ['resolved', 'archived', 'important', 'urgent', 'custom'],
            description: 'Type of reaction to add (resolved=✅, archived=📦, important=⭐, urgent=🚨)'
          },
          custom_emoji: {
            type: 'string',
            description: 'Custom emoji name when reaction_type is "custom" (without colons)'
          }
        },
        required: ['channel_id', 'message_ts', 'reaction_type']
      }
    };

    super(definition);
  }

  protected async executeImpl(args: ReactToMessageArgs, context: ToolContext): Promise<ToolExecutionResult> {
    try {
      // Validate custom emoji requirement
      if (args.reaction_type === 'custom' && !args.custom_emoji) {
        return this.createErrorResult(
          'custom_emoji parameter is required when reaction_type is "custom"',
          'VALIDATION_ERROR',
          { apiCalls: 0, cacheHits: 0 }
        );
      }

      // Get emoji name
      const emoji = args.reaction_type === 'custom' 
        ? args.custom_emoji!
        : REACTION_MAPPINGS[args.reaction_type];

      logger.info('Adding reaction to message', {
        channel: args.channel_id,
        messageTs: args.message_ts,
        emoji,
        reactionType: args.reaction_type
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

      // Create API client and add reaction
      const client = new SlackClient(authResult.tokens);
      const result = await client.addReaction(
        args.channel_id,
        args.message_ts, 
        emoji
      );

      if (!result.ok) {
        return this.createErrorResult(
          `Failed to add reaction: ${result.error || 'Unknown error'}`,
          'API_ERROR',
          { apiCalls: 1, cacheHits: 0 }
        );
      }

      const responseData = {
        success: true,
        message: `Successfully added ${emoji} reaction to message`,
        reaction: {
          channel_id: args.channel_id,
          message_ts: args.message_ts,
          reaction_added: emoji,
          action_type: args.reaction_type
        }
      };

      logger.info('Reaction added successfully', {
        channel: args.channel_id,
        messageTs: args.message_ts,
        emoji
      });

      return this.createSuccessResult(responseData, {
        apiCalls: 1,
        cacheHits: 0,
        executionTime: Date.now()
      });

    } catch (error: any) {
      logger.error('Failed to add reaction', {
        error: error.message || 'Unknown error',
        channel: args.channel_id,
        messageTs: args.message_ts
      });

      return this.createErrorResult(
        `Failed to add reaction: ${error.message || 'Unknown error'}`,
        'EXECUTION_ERROR',
        { apiCalls: 1, cacheHits: 0 }
      );
    }
  }
}