/**
 * Sprint 3.3: Thread Workflow Management Tools
 * Advanced thread lifecycle management và workflow automation
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
import { SlackMessage } from '../slack/types.js';

/**
 * Thread Workflow Helper Class
 */
class ThreadWorkflowHelper {
  static async initializeSlackClient(): Promise<SlackClient> {
    const auth = new SlackAuth();
    const tokens = auth.extractTokensFromEnvironment();
    if (!tokens) {
      throw new Error('Slack authentication required for thread workflow operations');
    }
    return new SlackClient(tokens);
  }

  static validateThreadParams(args: any): { isValid: boolean; error?: string } {
    if (!args.thread_ts || !/^\d+\.\d+$/.test(args.thread_ts)) {
      return { isValid: false, error: 'Valid thread_ts is required' };
    }
    if (!args.channel_id || !/^[CDG][A-Z0-9]+$/.test(args.channel_id)) {
      return { isValid: false, error: 'Valid channel_id is required' };
    }
    return { isValid: true };
  }

  static async getThreadMetadata(client: SlackClient, channelId: string, threadTs: string) {
    const response = await client.getConversationReplies(channelId, threadTs, { limit: 1 });
    if (!response.ok || !response.messages?.[0]) {
      throw new Error(`Failed to get thread metadata: ${response.error}`);
    }
    return response.messages[0];
  }

  static async notifyStakeholders(
    client: SlackClient, 
    channelId: string, 
    threadTs: string, 
    action: string,
    participants: string[]
  ) {
    const mentions = participants.slice(0, 5).map(userId => `<@${userId}>`).join(' ');
    const message = `🔔 Thread ${action}: ${mentions}`;
    
    try {
      await client.postMessage(channelId, message, threadTs);
    } catch (error) {
      logger.warn('Failed to notify stakeholders', { error });
    }
  }
}

/**
 * Thread Workflow Tools Factory
 */
export class ThreadWorkflowTools {
  
  /**
   * Thread Promotion Tool - Promote thread to important discussion
   */
  static createPromoteThreadTool(): SlackTool {
    return {
      name: 'promote_thread',
      description: 'Promote thread to important discussion with highlighting and notifications',
      category: ToolCategory.CONVERSATIONS,
      inputSchema: {
        type: 'object',
        properties: {
          thread_ts: { 
            type: 'string', 
            description: 'Thread timestamp to promote' 
          },
          channel_id: { 
            type: 'string', 
            description: 'Channel ID containing thread' 
          },
          promotion_reason: { 
            type: 'string', 
            description: 'Reason for thread promotion' 
          },
          notify_channel: { 
            type: 'boolean', 
            description: 'Notify entire channel about promotion',
            default: false
          },
          pin_thread: { 
            type: 'boolean', 
            description: 'Pin the promoted thread',
            default: true
          },
          add_reaction: { 
            type: 'string', 
            description: 'Reaction to add to promoted thread',
            default: 'star'
          }
        },
        required: ['thread_ts', 'channel_id']
      },
      requiresAuth: true,
      rateLimit: { maxCalls: 10, windowMs: 60000 }
    };
  }

  /**
   * Thread Escalation Tool - Escalate thread for urgent attention
   */
  static createEscalateThreadTool(): SlackTool {
    return {
      name: 'escalate_thread',
      description: 'Escalate thread for urgent attention with notifications and status updates',
      category: ToolCategory.CONVERSATIONS,
      inputSchema: {
        type: 'object',
        properties: {
          thread_ts: { 
            type: 'string', 
            description: 'Thread timestamp to escalate' 
          },
          channel_id: { 
            type: 'string', 
            description: 'Channel ID containing thread' 
          },
          escalation_level: { 
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical'],
            description: 'Level of escalation urgency',
            default: 'medium'
          },
          escalation_reason: { 
            type: 'string', 
            description: 'Detailed reason for escalation' 
          },
          notify_users: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific users to notify for escalation'
          },
          deadline: {
            type: 'string',
            description: 'Expected resolution deadline (ISO 8601 format)'
          }
        },
        required: ['thread_ts', 'channel_id', 'escalation_reason']
      },
      requiresAuth: true,
      rateLimit: { maxCalls: 5, windowMs: 60000 }
    };
  }

  /**
   * Thread Merge Tool - Merge related threads together
   */
  static createMergeThreadsTool(): SlackTool {
    return {
      name: 'merge_threads',
      description: 'Merge related threads into a single consolidated discussion',
      category: ToolCategory.CONVERSATIONS,
      inputSchema: {
        type: 'object',
        properties: {
          primary_thread: {
            type: 'object',
            properties: {
              thread_ts: { type: 'string' },
              channel_id: { type: 'string' }
            },
            required: ['thread_ts', 'channel_id'],
            description: 'Primary thread to merge others into'
          },
          secondary_threads: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                thread_ts: { type: 'string' },
                channel_id: { type: 'string' }
              },
              required: ['thread_ts', 'channel_id']
            },
            description: 'List of threads to merge into primary thread',
            minItems: 1,
            maxItems: 5
          },
          merge_strategy: {
            type: 'string',
            enum: ['reference', 'copy', 'summarize'],
            description: 'How to handle secondary thread content',
            default: 'reference'
          },
          merge_reason: {
            type: 'string',
            description: 'Reason for merging threads'
          }
        },
        required: ['primary_thread', 'secondary_threads']
      },
      requiresAuth: true,
      rateLimit: { maxCalls: 5, windowMs: 60000 }
    };
  }

  /**
   * Thread Split Tool - Split off-topic conversation into new thread
   */
  static createSplitThreadTool(): SlackTool {
    return {
      name: 'split_thread',
      description: 'Split off-topic conversation from existing thread into new thread',
      category: ToolCategory.CONVERSATIONS,
      inputSchema: {
        type: 'object',
        properties: {
          source_thread_ts: { 
            type: 'string', 
            description: 'Original thread timestamp' 
          },
          channel_id: { 
            type: 'string', 
            description: 'Channel ID containing thread' 
          },
          split_from_message_ts: {
            type: 'string',
            description: 'Message timestamp to start the split from'
          },
          new_thread_topic: {
            type: 'string',
            description: 'Topic for the new split thread'
          },
          messages_to_move: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific message timestamps to move to new thread'
          },
          split_reason: {
            type: 'string',
            description: 'Reason for splitting the thread'
          }
        },
        required: ['source_thread_ts', 'channel_id', 'new_thread_topic']
      },
      requiresAuth: true,
      rateLimit: { maxCalls: 10, windowMs: 60000 }
    };
  }

  /**
   * Thread Watcher Tool - Monitor thread for activity and status changes
   */
  static createThreadWatcherTool(): SlackTool {
    return {
      name: 'watch_thread',
      description: 'Monitor thread for activity, status changes, and automated notifications',
      category: ToolCategory.CONVERSATIONS,
      inputSchema: {
        type: 'object',
        properties: {
          thread_ts: { 
            type: 'string', 
            description: 'Thread timestamp to watch' 
          },
          channel_id: { 
            type: 'string', 
            description: 'Channel ID containing thread' 
          },
          watch_type: {
            type: 'string',
            enum: ['activity', 'resolution', 'escalation', 'all'],
            description: 'Type of thread activity to watch',
            default: 'activity'
          },
          notification_threshold: {
            type: 'number',
            description: 'Number of new messages to trigger notification',
            default: 5,
            minimum: 1
          },
          watch_duration_hours: {
            type: 'number',
            description: 'How long to watch thread (hours)',
            default: 24,
            minimum: 1,
            maximum: 168
          },
          notify_users: {
            type: 'array',
            items: { type: 'string' },
            description: 'Users to notify of thread activity'
          }
        },
        required: ['thread_ts', 'channel_id']
      },
      requiresAuth: true,
      rateLimit: { maxCalls: 20, windowMs: 60000 }
    };
  }

  /**
   * Thread Metrics Tool - Analyze thread performance and engagement metrics
   */
  static createThreadMetricsTool(): SlackTool {
    return {
      name: 'analyze_thread_metrics',
      description: 'Analyze thread performance, engagement metrics, and resolution patterns',
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
          analysis_type: {
            type: 'string',
            enum: ['engagement', 'resolution_time', 'participation', 'sentiment', 'comprehensive'],
            description: 'Type of metrics analysis to perform',
            default: 'comprehensive'
          },
          comparison_period: {
            type: 'string',
            enum: ['1d', '7d', '30d', '90d'],
            description: 'Period to compare thread metrics against',
            default: '7d'
          },
          include_benchmarks: {
            type: 'boolean',
            description: 'Include channel benchmarks for comparison',
            default: true
          }
        },
        required: ['thread_ts', 'channel_id']
      },
      requiresAuth: true,
      rateLimit: { maxCalls: 15, windowMs: 60000 }
    };
  }

  /**
   * Get all workflow tool definitions
   */
  static getAllWorkflowTools(): SlackTool[] {
    return [
      this.createPromoteThreadTool(),
      this.createEscalateThreadTool(),
      this.createMergeThreadsTool(),
      this.createSplitThreadTool(),
      this.createThreadWatcherTool(),
      this.createThreadMetricsTool()
    ];
  }

  /**
   * Get workflow tools by category
   */
  static getWorkflowToolsByCategory(): Record<string, SlackTool[]> {
    return {
      promotion: [
        this.createPromoteThreadTool(),
        this.createEscalateThreadTool()
      ],
      management: [
        this.createMergeThreadsTool(),
        this.createSplitThreadTool()
      ],
      monitoring: [
        this.createThreadWatcherTool(),
        this.createThreadMetricsTool()
      ]
    };
  }
}