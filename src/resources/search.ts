/**
 * Slack Search Resources - MCP-compliant read-only search operations
 * These resources provide advanced search functionality as parameterized URIs
 */

import { SlackAuth } from '../slack/auth.js';
import { SlackClient } from '../slack/client.js';
import { logger } from '../utils/logger.js';
import { SlackMCPResource } from '../types/mcp.js';

/**
 * Search parameters interface
 */
export interface SearchParams {
  query?: string;
  sort?: 'timestamp' | 'relevance';
  limit?: string;
  channel?: string;
  user?: string;
  after?: string;
  before?: string;
}

/**
 * Advanced search resources factory
 */
export class SearchResources {
  
  /**
   * Create workspace global search resource
   */
  static createWorkspaceSearchResource(): SlackMCPResource {
    return {
      uri: 'slack://workspace/search',
      name: 'Workspace Global Search',
      description: 'Search across messages, files, and channels. Parameters: query (required), sort, limit',
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
   * Generate workspace search content
   */
  static async generateWorkspaceSearchContent(params: SearchParams): Promise<string> {
    try {
      if (!params.query || params.query.trim().length === 0) {
        return JSON.stringify({
          success: false,
          error: 'Query parameter is required for search',
          example_usage: 'slack://workspace/search?query=project%20update&sort=timestamp&limit=20'
        }, null, 2);
      }

      // Authenticate with Slack
      const auth = new SlackAuth();
      const authResult = await auth.authenticate();
      
      if (!authResult.success || !authResult.tokens) {
        throw new Error(authResult.error || 'Authentication failed');
      }

      // Create API client
      const client = new SlackClient(authResult.tokens);

      // Parse search parameters
      const searchQuery = decodeURIComponent(params.query.trim());
      const sortBy: 'timestamp' | 'relevance' = params.sort || 'timestamp';
      const limit = parseInt(params.limit || '20');

      // For now, we'll simulate search by searching through recent messages
      // In a full implementation, this would use Slack's search API
      const searchResults: any[] = [];
      
      // Search in recent messages (simplified implementation)
      // This is a placeholder - real implementation would use search.messages API
      const result = {
        success: true,
        query: searchQuery,
        sort: sortBy,
        limit,
        results: searchResults,
        total: searchResults.length,
        search_metadata: {
          query: searchQuery,
          sort_by: sortBy,
          search_time: new Date().toISOString(),
          parameters: params
        },
        note: 'This is a simplified search implementation. Full search API integration pending.',
        user: authResult.user,
        retrieved_at: new Date().toISOString()
      };

      return JSON.stringify(result, null, 2);

    } catch (error) {
      logger.error('Failed to generate workspace search content', { error, params });
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        query: params.query || '',
        retrieved_at: new Date().toISOString()
      };
      return JSON.stringify(errorResult, null, 2);
    }
  }

  /**
   * Create message search resource
   */
  static createMessageSearchResource(): SlackMCPResource {
    return {
      uri: 'slack://search/messages',
      name: 'Message Search',
      description: 'Search messages with advanced filters. Parameters: query (required), channel, user, limit, after, before',
      mimeType: 'application/json',
      requiresAuth: true,
      cacheable: true,
      generator: {
        type: 'cached',
        refreshInterval: 30000 // 30 seconds
      }
    };
  }

  /**
   * Generate message search content
   */
  static async generateMessageSearchContent(params: SearchParams): Promise<string> {
    try {
      if (!params.query || params.query.trim().length === 0) {
        return JSON.stringify({
          success: false,
          error: 'Query parameter is required for message search',
          example_usage: 'slack://search/messages?query=project&channel=C1234567890&limit=10'
        }, null, 2);
      }

      // Authenticate with Slack
      const auth = new SlackAuth();
      const authResult = await auth.authenticate();
      
      if (!authResult.success) {
        throw new Error(authResult.error || 'Authentication failed');
      }

      const searchQuery = decodeURIComponent(params.query.trim());
      const limit = parseInt(params.limit || '20');

      // Placeholder for message search implementation
      const messages: any[] = [];

      const result = {
        success: true,
        search_type: 'messages',
        query: searchQuery,
        filters: {
          channel: params.channel || null,
          user: params.user || null,
          after: params.after || null,
          before: params.before || null
        },
        messages,
        total: messages.length,
        limit,
        search_metadata: {
          query: searchQuery,
          search_time: new Date().toISOString(),
          parameters: params
        },
        note: 'Message search implementation pending full Slack search API integration',
        user: authResult.user,
        retrieved_at: new Date().toISOString()
      };

      return JSON.stringify(result, null, 2);

    } catch (error) {
      logger.error('Failed to generate message search content', { error, params });
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        search_type: 'messages',
        query: params.query || '',
        retrieved_at: new Date().toISOString()
      };
      return JSON.stringify(errorResult, null, 2);
    }
  }

  /**
   * Create user search resource
   */
  static createUserSearchResource(): SlackMCPResource {
    return {
      uri: 'slack://search/users',
      name: 'User Search',
      description: 'Search users by name or email. Parameters: query (required), limit',
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
   * Generate user search content
   */
  static async generateUserSearchContent(params: SearchParams): Promise<string> {
    try {
      if (!params.query || params.query.trim().length === 0) {
        return JSON.stringify({
          success: false,
          error: 'Query parameter is required for user search',
          example_usage: 'slack://search/users?query=john&limit=10'
        }, null, 2);
      }

      // Authenticate with Slack
      const auth = new SlackAuth();
      const authResult = await auth.authenticate();
      
      if (!authResult.success || !authResult.tokens) {
        throw new Error(authResult.error || 'Authentication failed');
      }

      // Create API client
      const client = new SlackClient(authResult.tokens);

      // Get all users first
      const allUsers = await client.getUsers();
      
      const searchQuery = decodeURIComponent(params.query.trim()).toLowerCase();
      const limit = parseInt(params.limit || '20');

      // Filter users based on search query
      const filteredUsers = allUsers.filter(user => {
        if (user.deleted && !params.user?.includes('include_deleted')) {
          return false;
        }
        
        return (
          user.name?.toLowerCase().includes(searchQuery) ||
          user.real_name?.toLowerCase().includes(searchQuery) ||
          user.display_name?.toLowerCase().includes(searchQuery) ||
          user.email?.toLowerCase().includes(searchQuery)
        );
      }).slice(0, limit);

      // Format user results
      const users = filteredUsers.map(user => ({
        id: user.id,
        name: user.name,
        real_name: user.real_name || '',
        display_name: user.display_name || '',
        email: user.email || '',
        is_bot: user.is_bot || false,
        deleted: user.deleted || false,
        profile_image: (user as any).profile?.image_72 || ''
      }));

      const result = {
        success: true,
        search_type: 'users',
        query: searchQuery,
        users,
        total_found: filteredUsers.length,
        total_users: allUsers.length,
        limit,
        search_metadata: {
          query: searchQuery,
          search_time: new Date().toISOString(),
          parameters: params
        },
        user: authResult.user,
        retrieved_at: new Date().toISOString()
      };

      return JSON.stringify(result, null, 2);

    } catch (error) {
      logger.error('Failed to generate user search content', { error, params });
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        search_type: 'users',
        query: params.query || '',
        retrieved_at: new Date().toISOString()
      };
      return JSON.stringify(errorResult, null, 2);
    }
  }

  /**
   * Create channel search resource  
   */
  static createChannelSearchResource(): SlackMCPResource {
    return {
      uri: 'slack://search/channels',
      name: 'Channel Search',
      description: 'Search channels by name or purpose. Parameters: query (required), type, limit',
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
   * Generate channel search content
   */
  static async generateChannelSearchContent(params: SearchParams): Promise<string> {
    try {
      if (!params.query || params.query.trim().length === 0) {
        return JSON.stringify({
          success: false,
          error: 'Query parameter is required for channel search',
          example_usage: 'slack://search/channels?query=general&type=public&limit=10'
        }, null, 2);
      }

      // Authenticate with Slack
      const auth = new SlackAuth();
      const authResult = await auth.authenticate();
      
      if (!authResult.success || !authResult.tokens) {
        throw new Error(authResult.error || 'Authentication failed');
      }

      // Create API client
      const client = new SlackClient(authResult.tokens);

      // Get all channels
      const allChannels = await client.getChannels();
      
      const searchQuery = decodeURIComponent(params.query.trim()).toLowerCase();
      const limit = parseInt(params.limit || '20');
      const channelType = params.channel; // 'public', 'private', etc.

      // Filter channels based on search query
      const filteredChannels = allChannels.filter(channel => {
        // Filter by type if specified
        if (channelType === 'public' && channel.is_private) return false;
        if (channelType === 'private' && !channel.is_private) return false;
        
        // Filter by query
        return (
          channel.name?.toLowerCase().includes(searchQuery) ||
          channel.purpose?.value?.toLowerCase().includes(searchQuery) ||
          channel.topic?.value?.toLowerCase().includes(searchQuery)
        );
      }).slice(0, limit);

      // Format channel results
      const channels = filteredChannels.map(channel => ({
        id: channel.id,
        name: channel.name,
        is_private: channel.is_private || false,
        is_archived: channel.is_archived || false,
        is_member: channel.is_member || false,
        topic: channel.topic?.value || '',
        purpose: channel.purpose?.value || '',
        num_members: channel.num_members || 0
      }));

      const result = {
        success: true,
        search_type: 'channels',
        query: searchQuery,
        channels,
        total_found: filteredChannels.length,
        total_channels: allChannels.length,
        limit,
        filters: {
          type: channelType || 'all'
        },
        search_metadata: {
          query: searchQuery,
          search_time: new Date().toISOString(),
          parameters: params
        },
        user: authResult.user,
        retrieved_at: new Date().toISOString()
      };

      return JSON.stringify(result, null, 2);

    } catch (error) {
      logger.error('Failed to generate channel search content', { error, params });
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        search_type: 'channels',
        query: params.query || '',
        retrieved_at: new Date().toISOString()
      };
      return JSON.stringify(errorResult, null, 2);
    }
  }

  /**
   * Extract search parameters from URI
   */
  static extractSearchParamsFromUri(uri: string): SearchParams {
    const params: SearchParams = {};
    
    try {
      const urlObj = new URL(uri.replace('slack://', 'http://'));
      urlObj.searchParams.forEach((value, key) => {
        params[key as keyof SearchParams] = value;
      });
    } catch (error) {
      logger.warn('Failed to parse search parameters', { uri, error });
    }
    
    return params;
  }
}