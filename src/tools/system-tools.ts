import { SlackTool, ToolCategory } from '../types/tools.js';

/**
 * System tools for getting server information, status, and metrics
 * These tools replace the system resources in the tool-only architecture
 */
export class SystemTools {
  /**
   * Get server status and health information
   */
  static createGetServerStatusTool(): SlackTool {
    return {
      name: 'get_server_status',
      description: 'Get current MCP server status, health metrics, and system information',
      category: ToolCategory.SYSTEM,
      inputSchema: {
        type: 'object',
        properties: {
          include_memory: {
            type: 'boolean',
            description: 'Include detailed memory usage information',
            default: true
          },
          include_system: {
            type: 'boolean', 
            description: 'Include system process information',
            default: true
          },
          include_environment: {
            type: 'boolean',
            description: 'Include environment variables (sanitized)',
            default: false
          }
        },
        additionalProperties: false
      },
      requiresAuth: false,
      rateLimit: { maxCalls: 30, windowMs: 60000 }
    };
  }

  /**
   * Get basic server information and capabilities
   */
  static createGetServerInfoTool(): SlackTool {
    return {
      name: 'get_server_info',
      description: 'Get basic server information, capabilities, and current phase status',
      category: ToolCategory.SYSTEM,
      inputSchema: {
        type: 'object',
        properties: {
          include_capabilities: {
            type: 'boolean',
            description: 'Include detailed capability information',
            default: true
          },
          include_phase_info: {
            type: 'boolean',
            description: 'Include current phase and development status',
            default: true
          }
        },
        additionalProperties: false
      },
      requiresAuth: false,
      rateLimit: { maxCalls: 30, windowMs: 60000 }
    };
  }

  /**
   * List all available tools and their capabilities
   */
  static createListAvailableToolsTool(): SlackTool {
    return {
      name: 'list_available_tools',
      description: 'List all registered MCP tools with their descriptions and capabilities',
      category: ToolCategory.SYSTEM,
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['all', 'system', 'messaging', 'thread', 'search', 'workflow', 'data'],
            description: 'Filter tools by category',
            default: 'all'
          },
          detailed: {
            type: 'boolean',
            description: 'Include detailed tool information and schemas',
            default: false
          },
          count_only: {
            type: 'boolean',
            description: 'Return only tool counts by category',
            default: false
          }
        },
        additionalProperties: false
      },
      requiresAuth: false,
      rateLimit: { maxCalls: 30, windowMs: 60000 }
    };
  }

  /**
   * Get performance metrics and statistics
   */
  static createGetPerformanceMetricsTool(): SlackTool {
    return {
      name: 'get_performance_metrics',
      description: 'Get current performance metrics, statistics, and system health indicators',
      category: ToolCategory.SYSTEM,
      inputSchema: {
        type: 'object',
        properties: {
          include_memory: {
            type: 'boolean',
            description: 'Include detailed memory metrics',
            default: true
          },
          include_timing: {
            type: 'boolean',
            description: 'Include response time metrics',
            default: true
          },
          include_counters: {
            type: 'boolean',
            description: 'Include execution counters and rates',
            default: true
          },
          reset_counters: {
            type: 'boolean',
            description: 'Reset performance counters after reading',
            default: false
          }
        },
        additionalProperties: false
      },
      requiresAuth: false,
      rateLimit: { maxCalls: 30, windowMs: 60000 }
    };
  }

  /**
   * Get Slack workspace information
   */
  static createGetWorkspaceInfoTool(): SlackTool {
    return {
      name: 'get_workspace_info',
      description: 'Get information about the connected Slack workspace and authentication status',
      category: ToolCategory.SYSTEM,
      inputSchema: {
        type: 'object',
        properties: {
          include_auth_status: {
            type: 'boolean',
            description: 'Include authentication status and token validity',
            default: true
          },
          include_team_info: {
            type: 'boolean',
            description: 'Include basic team/workspace information',
            default: true
          },
          check_connection: {
            type: 'boolean',
            description: 'Test connection to Slack API',
            default: false
          }
        },
        additionalProperties: false
      },
      requiresAuth: false,
      rateLimit: { maxCalls: 30, windowMs: 60000 }
    };
  }

  /**
   * Helper method to format uptime in human readable format
   */
  private static formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);

    return parts.join(' ');
  }
}