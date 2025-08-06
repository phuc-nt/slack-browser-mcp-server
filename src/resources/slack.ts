/**
 * Slack Resources - MCP-compliant read-only operations
 * These resources replace the incorrectly-classified tools for data retrieval
 */

import { SlackMCPResource } from '../types/mcp.js';
import { SlackAuth } from '../slack/auth.js';
import { SlackClient } from '../slack/client.js';
import { logger } from '../utils/logger.js';

/**
 * Slack workspace resources factory
 */
export class SlackResources {
  /**
   * Create workspace channels resource
   */
  static createWorkspaceChannelsResource(): SlackMCPResource {
    return {
      uri: 'slack://workspace/channels',
      name: 'Workspace Channels',
      description: 'List of all accessible channels in the workspace',
      mimeType: 'application/json',
      requiresAuth: true,
      cacheable: true,
      generator: {
        type: 'cached',
        refreshInterval: 300000 // 5 minutes
      }
    };
  }

  /**
   * Generate workspace channels content
   */
  static async generateWorkspaceChannelsContent(params?: Record<string, string>): Promise<string> {
    try {
      // Authenticate with Slack
      const auth = new SlackAuth();
      const authResult = await auth.authenticate();

      if (!authResult.success) {
        throw new Error(authResult.error || 'Authentication failed');
      }

      // Create API client
      const client = new SlackClient(authResult.tokens!);

      // Get channels
      const channels = await client.getChannels();

      // Apply filters from query parameters
      let filteredChannels = channels;
      
      if (params?.include_archived !== 'true') {
        filteredChannels = filteredChannels.filter(channel => !channel.is_archived);
      }

      if (params?.types) {
        const types = params.types.split(',');
        filteredChannels = filteredChannels.filter(channel => {
          if (types.includes('public_channel') && !channel.is_private) return true;
          if (types.includes('private_channel') && channel.is_private) return true;
          return false;
        });
      }

      // Format response
      const channelList = filteredChannels.map((channel) => ({
        id: channel.id,
        name: channel.name,
        is_private: channel.is_private || false,
        is_archived: channel.is_archived || false,
        is_member: channel.is_member || false,
        topic: channel.topic?.value || '',
        purpose: channel.purpose?.value || '',
        num_members: channel.num_members || 0,
      }));

      const result = {
        success: true,
        channels: channelList,
        total: channelList.length,
        user: authResult.user,
        retrieved_at: new Date().toISOString(),
        parameters: params || {}
      };

      return JSON.stringify(result, null, 2);
      
    } catch (error) {
      logger.error('Failed to generate workspace channels content', { error });
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        channels: [],
        retrieved_at: new Date().toISOString()
      };
      return JSON.stringify(errorResult, null, 2);
    }
  }

  /**
   * Create workspace users resource
   */
  static createWorkspaceUsersResource(): SlackMCPResource {
    return {
      uri: 'slack://workspace/users',
      name: 'Workspace Users',
      description: 'List of all users in the workspace',
      mimeType: 'application/json',
      requiresAuth: true,
      cacheable: true,
      generator: {
        type: 'cached',
        refreshInterval: 600000 // 10 minutes
      }
    };
  }

  /**
   * Generate workspace users content
   */
  static async generateWorkspaceUsersContent(params?: Record<string, string>): Promise<string> {
    try {
      // Authenticate with Slack
      const auth = new SlackAuth();
      const authResult = await auth.authenticate();

      if (!authResult.success) {
        throw new Error(authResult.error || 'Authentication failed');
      }

      // Create API client
      const client = new SlackClient(authResult.tokens!);

      // Get users
      const users = await client.getUsers();

      // Apply filters from query parameters
      let filteredUsers = users;
      
      if (params?.include_deleted !== 'true') {
        filteredUsers = filteredUsers.filter(user => !user.deleted);
      }

      // Format response
      const userList = filteredUsers.map((user) => ({
        id: user.id,
        name: user.name,
        real_name: user.real_name || '',
        display_name: user.display_name || '',
        email: user.email || '',
        is_bot: user.is_bot || false,
        deleted: user.deleted || false,
      }));

      const result = {
        success: true,
        users: userList,
        total: userList.length,
        user: authResult.user,
        retrieved_at: new Date().toISOString(),
        parameters: params || {}
      };

      return JSON.stringify(result, null, 2);
      
    } catch (error) {
      logger.error('Failed to generate workspace users content', { error });
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        users: [],
        retrieved_at: new Date().toISOString()
      };
      return JSON.stringify(errorResult, null, 2);
    }
  }

  /**
   * Create channel history resource (with dynamic URI support)
   */
  static createChannelHistoryResource(channelId: string): SlackMCPResource {
    return {
      uri: `slack://channels/${channelId}/history`,
      name: `Channel History - ${channelId}`,
      description: `Recent messages from channel ${channelId}`,
      mimeType: 'application/json',
      requiresAuth: true,
      cacheable: true,
      generator: {
        type: 'cached',
        refreshInterval: 60000 // 1 minute
      }
    };
  }

  /**
   * Generate channel history content
   */
  static async generateChannelHistoryContent(channelId: string, params?: Record<string, string>): Promise<string> {
    try {
      // Authenticate with Slack
      const auth = new SlackAuth();
      const authResult = await auth.authenticate();

      if (!authResult.success) {
        throw new Error(authResult.error || 'Authentication failed');
      }

      // Create API client
      const client = new SlackClient(authResult.tokens!);

      // Get conversation history
      const limit = params?.limit ? parseInt(params.limit) : 20;
      const messages = await client.getConversationHistory(channelId, limit);

      // Format response
      const messageList = messages.map((message) => ({
        ts: message.ts,
        user: message.user || 'system',
        text: message.text,
        type: message.type,
        thread_ts: message.thread_ts,
        reply_count: message.reply_count || 0,
      }));

      const result = {
        success: true,
        messages: messageList,
        total: messageList.length,
        channel: channelId,
        user: authResult.user,
        retrieved_at: new Date().toISOString(),
        parameters: { limit, ...params }
      };

      return JSON.stringify(result, null, 2);
      
    } catch (error) {
      logger.error(`Failed to generate channel history content for ${channelId}`, { error });
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        messages: [],
        channel: channelId,
        retrieved_at: new Date().toISOString()
      };
      return JSON.stringify(errorResult, null, 2);
    }
  }

  /**
   * Extract channel ID from dynamic URI
   */
  static extractChannelIdFromUri(uri: string): string | null {
    const match = uri.match(/^slack:\/\/channels\/([^\/]+)\/history$/);
    return match ? match[1] : null;
  }

  /**
   * Extract query parameters from URI
   */
  static extractParamsFromUri(uri: string): Record<string, string> {
    const params: Record<string, string> = {};
    const urlObj = new URL(uri.replace('slack://', 'http://'));
    
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return params;
  }
}