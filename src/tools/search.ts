import { SlackTool, ToolCategory } from '../types/tools.js';

/**
 * Placeholder: Search tools will be implemented here
 * - search_messages
 * - search_files
 * - search_all
 * - search_by_url
 */

export class SearchPlaceholder {
  static getPlaceholderTools(): SlackTool[] {
    return [
      {
        name: 'search_messages_v2',
        description: 'Advanced message search with filters and context',
        category: ToolCategory.SEARCH,
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query or Slack message URL',
              minLength: 1
            },
            in_channel: {
              type: 'string',
              description: 'Limit search to specific channel'
            },
            from_user: {
              type: 'string', 
              description: 'Search messages from specific user'
            },
            mentions_user: {
              type: 'string',
              description: 'Search messages mentioning specific user'
            },
            date_range: {
              type: 'object',
              properties: {
                after: {
                  type: 'string',
                  description: 'Search after date (YYYY-MM-DD or relative like "7d")'
                },
                before: {
                  type: 'string',
                  description: 'Search before date (YYYY-MM-DD or relative like "1d")'
                }
              }
            },
            has_attachments: {
              type: 'boolean',
              description: 'Filter messages with attachments'
            },
            has_reactions: {
              type: 'boolean',
              description: 'Filter messages with reactions'
            },
            in_thread: {
              type: 'boolean',
              description: 'Only search within threads'
            },
            sort_by: {
              type: 'string',
              enum: ['timestamp', 'score'],
              default: 'timestamp',
              description: 'Sort results by relevance or time'
            },
            sort_direction: {
              type: 'string',
              enum: ['asc', 'desc'],
              default: 'desc'
            },
            limit: {
              type: 'number',
              default: 20,
              minimum: 1,
              maximum: 100
            },
            include_context: {
              type: 'boolean',
              default: false,
              description: 'Include surrounding messages for context'
            }
          },
          required: ['query']
        },
        tags: ['search', 'messages', 'slack-api'],
        requiresAuth: true,
        rateLimit: {
          maxCalls: 30,
          windowMs: 60000
        }
      },

      {
        name: 'search_files',
        description: 'Search for files and attachments in the workspace',
        category: ToolCategory.SEARCH,
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for file names or content'
            },
            file_types: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Filter by file types (e.g., ["pdf", "docx", "image"])'
            },
            uploaded_by: {
              type: 'string',
              description: 'Filter by user who uploaded the file'
            },
            in_channel: {
              type: 'string',
              description: 'Filter by channel where file was shared'
            },
            date_range: {
              type: 'object',
              properties: {
                after: { type: 'string' },
                before: { type: 'string' }
              }
            },
            size_range: {
              type: 'object',
              properties: {
                min_bytes: { type: 'number' },
                max_bytes: { type: 'number' }
              }
            },
            limit: {
              type: 'number',
              default: 20,
              minimum: 1,
              maximum: 100
            }
          }
        },
        tags: ['search', 'files', 'slack-api'],
        requiresAuth: true,
        rateLimit: {
          maxCalls: 20,
          windowMs: 60000
        }
      },

      {
        name: 'search_workspace',
        description: 'Global search across messages, files, and channels',
        category: ToolCategory.SEARCH,
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Global search query',
              minLength: 1
            },
            scopes: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['messages', 'files', 'channels', 'users']
              },
              default: ['messages', 'files'],
              description: 'Scopes to search within'
            },
            limit_per_scope: {
              type: 'number',
              default: 10,
              minimum: 1,
              maximum: 50
            },
            include_archived: {
              type: 'boolean',
              default: false,
              description: 'Include archived channels/users'
            }
          },
          required: ['query']
        },
        tags: ['search', 'global', 'slack-api'],
        requiresAuth: true,
        rateLimit: {
          maxCalls: 15,
          windowMs: 60000
        }
      },

      {
        name: 'parse_slack_url',
        description: 'Parse and extract information from Slack URLs',
        category: ToolCategory.SEARCH,
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'Slack URL to parse (message, channel, or user link)',
              pattern: '^https://[\\w-]+\\.slack\\.com/'
            },
            fetch_content: {
              type: 'boolean',
              default: true,
              description: 'Whether to fetch the actual content'
            },
            include_context: {
              type: 'boolean',
              default: false,
              description: 'Include surrounding context for messages'
            }
          },
          required: ['url']
        },
        tags: ['search', 'url', 'parse'],
        requiresAuth: true,
        rateLimit: {
          maxCalls: 50,
          windowMs: 60000
        }
      }
    ];
  }
}