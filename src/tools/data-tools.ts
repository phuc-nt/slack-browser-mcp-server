import { SlackTool, ToolCategory } from '../types/tools.js';

/**
 * Simple data retrieval tools based on documented working Slack API endpoints
 * These tools replace removed resources and broken tools with reliable API-based implementations
 */
export class DataTools {
  /**
   * Get thread replies using conversations.replies endpoint
   * This replaces the broken navigate_thread_replies tool
   */
  static createGetThreadRepliesTool(): SlackTool {
    return {
      name: 'get_thread_replies',
      description: 'Get all replies from a specific thread using the working conversations.replies API',
      category: ToolCategory.CONVERSATIONS,
      inputSchema: {
        type: 'object',
        properties: {
          channel: {
            type: 'string',
            description: 'Channel ID containing the thread (e.g., C099184U2TU)'
          },
          ts: {
            type: 'string',
            description: 'Thread timestamp in format "1754661651.179039"'
          },
          inclusive: {
            type: 'boolean',
            description: 'Include the parent message in results',
            default: true
          },
          limit: {
            type: 'number',
            description: 'Maximum number of messages to return',
            default: 28,
            minimum: 1,
            maximum: 1000
          },
          oldest: {
            type: 'string',
            description: 'Only messages after this timestamp'
          }
        },
        required: ['channel', 'ts']
      },
      requiresAuth: true,
      rateLimit: { maxCalls: 50, windowMs: 60000 }
    };
  }

  /**
   * Search messages within a specific channel using search.inline
   */
  static createSearchChannelMessagesTool(): SlackTool {
    return {
      name: 'search_channel_messages',
      description: 'Search for messages within a specific channel using inline search',
      category: ToolCategory.SEARCH,
      inputSchema: {
        type: 'object',
        properties: {
          channel: {
            type: 'string',
            description: 'Channel ID to search within (e.g., C099184U2TU)'
          },
          query: {
            type: 'string',
            description: 'Search query term'
          },
          count: {
            type: 'number',
            description: 'Number of results to return',
            default: 3,
            minimum: 1,
            maximum: 20
          },
          page: {
            type: 'number',
            description: 'Page number for pagination',
            default: 1,
            minimum: 1
          },
          thread_replies: {
            type: 'boolean',
            description: 'Include thread replies in search results',
            default: true
          },
          extract_len: {
            type: 'number',
            description: 'Length of text extract around matches',
            default: 110,
            minimum: 50,
            maximum: 500
          }
        },
        required: ['channel', 'query']
      },
      requiresAuth: true,
      rateLimit: { maxCalls: 20, windowMs: 60000 }
    };
  }

  /**
   * Advanced message search using search.modules.messages
   */
  static createSearchMessagesTool(): SlackTool {
    return {
      name: 'search_messages',
      description: 'Advanced message search with filters using search.modules.messages API',
      category: ToolCategory.SEARCH,
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query with optional Slack search operators (e.g., "in:#channel before:2025-08-09 test")'
          },
          count: {
            type: 'number',
            description: 'Number of results per page',
            default: 20,
            minimum: 1,
            maximum: 100
          },
          page: {
            type: 'number',
            description: 'Page number for pagination',
            default: 1,
            minimum: 1
          },
          sort: {
            type: 'string',
            enum: ['score', 'timestamp'],
            description: 'Sort results by relevance score or timestamp',
            default: 'score'
          },
          sort_dir: {
            type: 'string',
            enum: ['desc', 'asc'],
            description: 'Sort direction',
            default: 'desc'
          },
          max_extract_len: {
            type: 'number',
            description: 'Maximum length of text extracts',
            default: 200,
            minimum: 50,
            maximum: 500
          },
          include_highlights: {
            type: 'boolean',
            description: 'Include search term highlighting in results',
            default: true
          },
          search_exclude_bots: {
            type: 'boolean',
            description: 'Exclude messages from bots',
            default: false
          }
        },
        required: ['query']
      },
      requiresAuth: true,
      rateLimit: { maxCalls: 20, windowMs: 60000 }
    };
  }

  /**
   * Get workspace channels list (replaces channel resource)
   */
  static createListWorkspaceChannelsTool(): SlackTool {
    return {
      name: 'list_workspace_channels',
      description: 'List all accessible channels in the Slack workspace',
      category: ToolCategory.CHANNELS,
      inputSchema: {
        type: 'object',
        properties: {
          include_private: {
            type: 'boolean',
            description: 'Include private channels in results',
            default: false
          },
          include_archived: {
            type: 'boolean',
            description: 'Include archived channels in results', 
            default: false
          },
          limit: {
            type: 'number',
            description: 'Maximum number of channels to return',
            default: 100,
            minimum: 1,
            maximum: 1000
          },
          cursor: {
            type: 'string',
            description: 'Pagination cursor for large workspaces'
          }
        }
      },
      requiresAuth: true,
      rateLimit: { maxCalls: 10, windowMs: 60000 }
    };
  }

  /**
   * Get workspace users list (replaces user resource)
   */
  static createListWorkspaceUsersTool(): SlackTool {
    return {
      name: 'list_workspace_users',
      description: 'List all users in the Slack workspace',
      category: ToolCategory.USERS,
      inputSchema: {
        type: 'object',
        properties: {
          include_bots: {
            type: 'boolean',
            description: 'Include bot users in results',
            default: false
          },
          include_deleted: {
            type: 'boolean',
            description: 'Include deleted users in results',
            default: false
          },
          limit: {
            type: 'number',
            description: 'Maximum number of users to return',
            default: 100,
            minimum: 1,
            maximum: 1000
          },
          cursor: {
            type: 'string',
            description: 'Pagination cursor for large workspaces'
          }
        }
      },
      requiresAuth: true,
      rateLimit: { maxCalls: 10, windowMs: 60000 }
    };
  }
}