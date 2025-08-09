/**
 * Sprint 4.2: Simple Data Tools Implementation
 * Implementation classes for API-based data retrieval tools
 */

import { BaseSlackTool } from './base.js';
import { SlackAuth } from '../slack/auth.js';
import { SlackClient } from '../slack/client.js';
import { logger } from '../utils/logger.js';
import { 
  ToolContext, 
  ToolExecutionResult,
  SlackTool 
} from '../types/tools.js';

/**
 * GetThreadRepliesTool - Get thread replies using conversations.replies API
 * Replaces the broken navigate_thread_replies tool
 */
export class GetThreadRepliesTool extends BaseSlackTool {
  constructor(definition: SlackTool) {
    super(definition);
  }

  async executeImpl(args: any, context: ToolContext): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    logger.info('Executing get_thread_replies', { 
      channel: args.channel,
      ts: args.ts,
      limit: args.limit || 28
    });

    try {
      // Initialize Slack client
      const auth = new SlackAuth();
      const tokens = auth.extractTokensFromEnvironment();
      if (!tokens) {
        return this.createErrorResult(
          'Slack authentication required. Please set SLACK_XOXC_TOKEN and SLACK_XOXD_TOKEN environment variables.',
          'AUTH_REQUIRED',
          { executionTime: Date.now() - startTime, apiCalls: 0, cacheHits: 0 }
        );
      }

      const client = new SlackClient(tokens);
      
      // Call conversations.replies API
      const response = await client.getConversationReplies(args.channel, args.ts, {
        inclusive: args.inclusive !== false,
        limit: args.limit || 28,
        oldest: args.oldest
      });

      if (!response.ok || !response.messages) {
        return this.createErrorResult(
          `Failed to get thread replies: ${response.error}`,
          'API_ERROR',
          { executionTime: Date.now() - startTime, apiCalls: 1, cacheHits: 0 }
        );
      }

      logger.info('Thread replies retrieved successfully', {
        channel: args.channel,
        thread_ts: args.ts,
        reply_count: response.messages.length
      });

      return this.createSuccessResult({
        channel: args.channel,
        thread_ts: args.ts,
        messages: response.messages,
        reply_count: response.messages.length,
        has_more: response.response_metadata?.next_cursor ? true : false,
        metadata: {
          api_endpoint: 'conversations.replies',
          inclusive: args.inclusive !== false,
          limit_requested: args.limit || 28
        }
      }, {
        executionTime: Date.now() - startTime,
        apiCalls: 1,
        cacheHits: 0
      });
    } catch (error) {
      logger.error('Error in get_thread_replies execution', { 
        error,
        channel: args.channel,
        ts: args.ts
      });

      return this.createErrorResult(
        `Thread replies retrieval failed: ${error}`,
        'EXECUTION_ERROR',
        { executionTime: Date.now() - startTime, apiCalls: 0, cacheHits: 0 }
      );
    }
  }
}

/**
 * SearchChannelMessagesTool - Search messages within channel using search.inline
 */
export class SearchChannelMessagesTool extends BaseSlackTool {
  constructor(definition: SlackTool) {
    super(definition);
  }

  async executeImpl(args: any, context: ToolContext): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    logger.info('Executing search_channel_messages', { 
      channel: args.channel,
      query: args.query,
      count: args.count || 3
    });

    try {
      // Initialize Slack client
      const auth = new SlackAuth();
      const tokens = auth.extractTokensFromEnvironment();
      if (!tokens) {
        return this.createErrorResult(
          'Slack authentication required for search operations.',
          'AUTH_REQUIRED',
          { executionTime: Date.now() - startTime, apiCalls: 0, cacheHits: 0 }
        );
      }

      const client = new SlackClient(tokens);
      
      // Call search.inline API 
      const searchParams = {
        channel: args.channel,
        query: args.query,
        count: args.count || 3,
        page: args.page || 1,
        thread_replies: args.thread_replies !== false,
        extract_len: args.extract_len || 110
      };

      const response = await client.searchInline(searchParams);

      if (!response.ok) {
        return this.createErrorResult(
          `Channel search failed: ${response.error}`,
          'SEARCH_ERROR',
          { executionTime: Date.now() - startTime, apiCalls: 1, cacheHits: 0 }
        );
      }

      logger.info('Channel search completed successfully', {
        channel: args.channel,
        query: args.query,
        results_found: response.pagination?.total_count || 0
      });

      return this.createSuccessResult({
        channel: args.channel,
        query: args.query,
        pagination: response.pagination,
        items: response.items || [],
        metadata: {
          api_endpoint: 'search.inline',
          search_parameters: searchParams
        }
      }, {
        executionTime: Date.now() - startTime,
        apiCalls: 1,
        cacheHits: 0
      });
    } catch (error) {
      logger.error('Error in search_channel_messages execution', { 
        error,
        channel: args.channel,
        query: args.query
      });

      return this.createErrorResult(
        `Channel search failed: ${error}`,
        'EXECUTION_ERROR',
        { executionTime: Date.now() - startTime, apiCalls: 0, cacheHits: 0 }
      );
    }
  }
}

/**
 * SearchMessagesTool - Advanced message search using search.modules.messages
 */
export class SearchMessagesTool extends BaseSlackTool {
  constructor(definition: SlackTool) {
    super(definition);
  }

  async executeImpl(args: any, context: ToolContext): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    logger.info('Executing search_messages', { 
      query: args.query,
      count: args.count || 20
    });

    try {
      // Initialize Slack client
      const auth = new SlackAuth();
      const tokens = auth.extractTokensFromEnvironment();
      if (!tokens) {
        return this.createErrorResult(
          'Slack authentication required for advanced search.',
          'AUTH_REQUIRED',
          { executionTime: Date.now() - startTime, apiCalls: 0, cacheHits: 0 }
        );
      }

      const client = new SlackClient(tokens);
      
      // Call search.modules.messages API
      const searchParams = {
        module: 'messages',
        query: args.query,
        count: args.count || 20,
        page: args.page || 1,
        sort: args.sort || 'score',
        sort_dir: args.sort_dir || 'desc',
        extracts: 1,
        highlight: args.include_highlights !== false ? 1 : 0,
        max_extract_len: args.max_extract_len || 200,
        search_exclude_bots: args.search_exclude_bots ? 1 : 0
      };

      const response = await client.searchMessages(searchParams);

      if (!response.ok) {
        return this.createErrorResult(
          `Advanced message search failed: ${response.error}`,
          'SEARCH_ERROR',
          { executionTime: Date.now() - startTime, apiCalls: 1, cacheHits: 0 }
        );
      }

      logger.info('Advanced message search completed', {
        query: args.query,
        results_found: response.pagination?.total_count || 0,
        module: 'messages'
      });

      return this.createSuccessResult({
        query: args.query,
        module: 'messages',
        pagination: response.pagination,
        items: response.items || [],
        filters: response.filters,
        filter_suggestions: response.filter_suggestions,
        metadata: {
          api_endpoint: 'search.modules.messages',
          search_parameters: searchParams
        }
      }, {
        executionTime: Date.now() - startTime,
        apiCalls: 1,
        cacheHits: 0
      });
    } catch (error) {
      logger.error('Error in search_messages execution', { 
        error,
        query: args.query
      });

      return this.createErrorResult(
        `Advanced search failed: ${error}`,
        'EXECUTION_ERROR',
        { executionTime: Date.now() - startTime, apiCalls: 0, cacheHits: 0 }
      );
    }
  }
}

/**
 * ListWorkspaceChannelsTool - List all workspace channels
 */
export class ListWorkspaceChannelsTool extends BaseSlackTool {
  constructor(definition: SlackTool) {
    super(definition);
  }

  async executeImpl(args: any, context: ToolContext): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    logger.info('Executing list_workspace_channels', { 
      include_private: args.include_private || false,
      include_archived: args.include_archived || false,
      limit: args.limit || 100
    });

    try {
      // Initialize Slack client
      const auth = new SlackAuth();
      const tokens = auth.extractTokensFromEnvironment();
      if (!tokens) {
        return this.createErrorResult(
          'Slack authentication required for workspace access.',
          'AUTH_REQUIRED',
          { executionTime: Date.now() - startTime, apiCalls: 0, cacheHits: 0 }
        );
      }

      const client = new SlackClient(tokens);
      
      // Get channels list with options to get full response
      const response = await client.getChannels({
        exclude_archived: !args.include_archived,
        types: args.include_private ? 'public_channel,private_channel' : 'public_channel',
        limit: args.limit || 100,
        cursor: args.cursor
      });

      // Handle the union type - when options are passed, we get the full response object
      if (Array.isArray(response)) {
        // This shouldn't happen when we pass options, but handle it just in case
        return this.createErrorResult(
          'Unexpected response format from channels API',
          'API_ERROR',
          { executionTime: Date.now() - startTime, apiCalls: 1, cacheHits: 0 }
        );
      }

      if (!response.ok || !response.channels) {
        return this.createErrorResult(
          `Failed to retrieve channels: ${response.error}`,
          'API_ERROR',
          { executionTime: Date.now() - startTime, apiCalls: 1, cacheHits: 0 }
        );
      }

      logger.info('Workspace channels retrieved', {
        channel_count: response.channels.length,
        include_private: args.include_private || false,
        include_archived: args.include_archived || false
      });

      return this.createSuccessResult({
        channels: response.channels,
        channel_count: response.channels.length,
        response_metadata: response.response_metadata,
        filters: {
          include_private: args.include_private || false,
          include_archived: args.include_archived || false,
          limit: args.limit || 100
        }
      }, {
        executionTime: Date.now() - startTime,
        apiCalls: 1,
        cacheHits: 0
      });
    } catch (error) {
      logger.error('Error in list_workspace_channels execution', { 
        error,
        include_private: args.include_private,
        include_archived: args.include_archived
      });

      return this.createErrorResult(
        `Channel listing failed: ${error}`,
        'EXECUTION_ERROR',
        { executionTime: Date.now() - startTime, apiCalls: 0, cacheHits: 0 }
      );
    }
  }
}

/**
 * ListWorkspaceUsersTool - List all workspace users
 */
export class ListWorkspaceUsersTool extends BaseSlackTool {
  constructor(definition: SlackTool) {
    super(definition);
  }

  async executeImpl(args: any, context: ToolContext): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    logger.info('Executing list_workspace_users', { 
      include_bots: args.include_bots || false,
      include_deleted: args.include_deleted || false,
      limit: args.limit || 100
    });

    try {
      // Initialize Slack client
      const auth = new SlackAuth();
      const tokens = auth.extractTokensFromEnvironment();
      if (!tokens) {
        return this.createErrorResult(
          'Slack authentication required for workspace access.',
          'AUTH_REQUIRED',
          { executionTime: Date.now() - startTime, apiCalls: 0, cacheHits: 0 }
        );
      }

      const client = new SlackClient(tokens);
      
      // Get users list with options to get full response
      const response = await client.getUsers({
        include_locale: true,
        limit: args.limit || 100,
        cursor: args.cursor
      });

      // Handle the union type - when options are passed, we get the full response object
      if (Array.isArray(response)) {
        // This shouldn't happen when we pass options, but handle it just in case
        return this.createErrorResult(
          'Unexpected response format from users API',
          'API_ERROR',
          { executionTime: Date.now() - startTime, apiCalls: 1, cacheHits: 0 }
        );
      }

      if (!response.ok || !response.members) {
        return this.createErrorResult(
          `Failed to retrieve users: ${response.error}`,
          'API_ERROR',
          { executionTime: Date.now() - startTime, apiCalls: 1, cacheHits: 0 }
        );
      }

      // Filter users based on parameters
      let filteredUsers = response.members;
      
      if (!args.include_deleted) {
        filteredUsers = filteredUsers.filter((user: any) => !user.deleted);
      }
      
      if (!args.include_bots) {
        filteredUsers = filteredUsers.filter((user: any) => !user.is_bot);
      }

      logger.info('Workspace users retrieved', {
        total_users: response.members.length,
        filtered_users: filteredUsers.length,
        include_bots: args.include_bots || false,
        include_deleted: args.include_deleted || false
      });

      return this.createSuccessResult({
        members: filteredUsers,
        user_count: filteredUsers.length,
        total_count: response.members.length,
        response_metadata: response.response_metadata,
        filters: {
          include_bots: args.include_bots || false,
          include_deleted: args.include_deleted || false,
          limit: args.limit || 100
        }
      }, {
        executionTime: Date.now() - startTime,
        apiCalls: 1,
        cacheHits: 0
      });
    } catch (error) {
      logger.error('Error in list_workspace_users execution', { 
        error,
        include_bots: args.include_bots,
        include_deleted: args.include_deleted
      });

      return this.createErrorResult(
        `User listing failed: ${error}`,
        'EXECUTION_ERROR',
        { executionTime: Date.now() - startTime, apiCalls: 0, cacheHits: 0 }
      );
    }
  }
}