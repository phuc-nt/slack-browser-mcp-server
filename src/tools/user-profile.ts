import { BaseSlackTool } from './base.js';
import { ToolExecutionResult, ToolContext, SlackTool } from '../types/tools.js';
import { SlackAuth } from '../slack/auth.js';
import { SlackClient } from '../slack/client.js';
import { logger } from '../utils/logger.js';

/**
 * Arguments for getting user profile
 */
export interface GetUserProfileArgs {
  user_id: string; // Slack user ID (e.g., U08SBN9MTUG)
}

/**
 * Tool for getting user profile information
 * Returns display name and account username from email
 */
export class GetUserProfileTool extends BaseSlackTool {
  constructor() {
    const definition: SlackTool = {
      name: 'get_user_profile',
      description: 'Get user profile information including display name and account username',
      category: 'data',
      action: 'GET',
      requiresAuth: true,
      rateLimit: {
        rpm: 100,
        burst: 20,
      },
      inputSchema: {
        type: 'object',
        properties: {
          user_id: {
            type: 'string',
            description: 'Slack user ID (e.g., U08SBN9MTUG)',
            pattern: '^U[A-Z0-9]{8,}$',
          },
        },
        required: ['user_id'],
      },
    };

    super(definition);
  }

  protected async executeImpl(
    args: GetUserProfileArgs,
    context: ToolContext
  ): Promise<ToolExecutionResult> {
    try {
      logger.info('Getting user profile', { userId: args.user_id });

      // Authenticate with Slack
      const auth = new SlackAuth();
      const authResult = await auth.authenticate();

      if (!authResult.success || !authResult.tokens) {
        return {
          success: false,
          error: authResult.error || 'Authentication failed',
          content: [
            {
              type: 'text',
              text: `❌ Authentication failed: ${authResult.error || 'Unknown error'}`,
            },
          ],
          metadata: {
            executionTime: 0,
            apiCalls: 0,
            cacheHits: 0,
          },
        };
      }

      // Create API client
      const client = new SlackClient(authResult.tokens);

      // Call Slack API users.profile.get
      const response = await client.getUserProfile(args.user_id);

      if (!response.ok || !response.profile) {
        throw new Error(response.error || 'Failed to get user profile');
      }

      const profile = response.profile;

      // Extract account from email
      let account = '';
      if (profile.email) {
        const emailParts = profile.email.split('@');
        account = emailParts[0] || '';
      }

      const result = {
        display_name: profile.display_name || profile.real_name || '',
        account: account,
        user_id: args.user_id,
      };

      logger.info('User profile retrieved successfully', {
        userId: args.user_id,
        displayName: result.display_name,
        account: result.account,
      });

      return {
        success: true,
        data: result,
        content: [
          {
            type: 'text',
            text: `**User Profile:**\n- Display Name: ${result.display_name}\n- Account: ${result.account}\n- User ID: ${result.user_id}`,
          },
        ],
        metadata: {
          executionTime: 0,
          apiCalls: 1,
          cacheHits: 0,
        },
      };
    } catch (error) {
      logger.error('Failed to get user profile', {
        userId: args.user_id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: `Failed to get user profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
        content: [
          {
            type: 'text',
            text: `❌ Failed to get user profile for ${args.user_id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        metadata: {
          executionTime: 0,
          apiCalls: 1,
          cacheHits: 0,
        },
      };
    }
  }
}
