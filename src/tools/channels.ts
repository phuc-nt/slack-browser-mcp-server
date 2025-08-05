import { SlackTool, ToolCategory } from '../types/tools.js';

/**
 * Placeholder: Channels tools will be implemented here
 * - channels_list
 * - channels_info
 * - channels_join
 * - channels_leave
 * - channels_members
 */

export class ChannelsPlaceholder {
  static getPlaceholderTools(): SlackTool[] {
    return [
      {
        name: 'channels_list_v2',
        description: 'List all channels in the workspace with enhanced filtering',
        category: ToolCategory.CHANNELS,
        inputSchema: {
          type: 'object',
          properties: {
            types: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['public_channel', 'private_channel', 'mpim', 'im']
              },
              default: ['public_channel', 'private_channel'],
              description: 'Types of channels to include'
            },
            exclude_archived: {
              type: 'boolean',
              default: true,
              description: 'Exclude archived channels'
            },
            limit: {
              type: 'number',
              default: 100,
              minimum: 1,
              maximum: 1000
            },
            cursor: {
              type: 'string',
              description: 'Pagination cursor'
            },
            sort_by: {
              type: 'string',
              enum: ['name', 'created', 'members'],
              default: 'name',
              description: 'Sort channels by field'
            }
          }
        },
        tags: ['channels', 'list', 'slack-api'],
        requiresAuth: true,
        rateLimit: {
          maxCalls: 20,
          windowMs: 60000
        }
      },

      {
        name: 'channels_info_v2',
        description: 'Get detailed information about a specific channel',
        category: ToolCategory.CHANNELS,
        inputSchema: {
          type: 'object',
          properties: {
            channel_id: {
              type: 'string',
              description: 'Channel ID or name (with # prefix)'
            },
            include_locale: {
              type: 'boolean',
              default: false,
              description: 'Include locale information'
            }
          },
          required: ['channel_id']
        },
        tags: ['channels', 'info', 'slack-api'],
        requiresAuth: true,
        rateLimit: {
          maxCalls: 100,
          windowMs: 60000
        }
      },

      {
        name: 'channels_members',
        description: 'List members of a channel',
        category: ToolCategory.CHANNELS,
        inputSchema: {
          type: 'object',
          properties: {
            channel_id: {
              type: 'string',
              description: 'Channel ID or name (with # prefix)'
            },
            limit: {
              type: 'number',
              default: 100,
              minimum: 1,
              maximum: 1000
            },
            cursor: {
              type: 'string',
              description: 'Pagination cursor'
            }
          },
          required: ['channel_id']
        },
        tags: ['channels', 'members', 'slack-api'],
        requiresAuth: true,
        rateLimit: {
          maxCalls: 50,
          windowMs: 60000
        }
      },

      {
        name: 'channels_search',
        description: 'Search for channels by name or description',
        category: ToolCategory.CHANNELS,
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for channel names or descriptions',
              minLength: 1
            },
            types: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['public_channel', 'private_channel']
              },
              default: ['public_channel'],
              description: 'Types of channels to search'
            },
            limit: {
              type: 'number',
              default: 20,
              minimum: 1,
              maximum: 100
            }
          },
          required: ['query']
        },
        tags: ['channels', 'search', 'slack-api'],
        requiresAuth: true,
        rateLimit: {
          maxCalls: 30,
          windowMs: 60000
        }
      }
    ];
  }
}