import { BaseSlackTool } from './base.js';
import { SlackTool, ToolContext, ToolExecutionResult } from '../types/tools.js';
import { logger } from '../utils/logger.js';

interface ServerInfoArgs {
  include_tools?: boolean;      // List available tools (default: true)
  include_performance?: boolean; // Basic performance metrics (default: false)
}

/**
 * Server Info Tool
 * 
 * Consolidates system information tools (get_server_status, get_server_info, 
 * list_available_tools, get_performance_metrics, get_workspace_info) into 
 * single working server information tool.
 * 
 * Replaces 5 broken system tools with unified server info interface.
 */
export class ServerInfoTool extends BaseSlackTool {
  constructor() {
    const definition: SlackTool = {
      name: 'server_info',
      description: 'Get MCP server status, tool list, and basic performance metrics',
      category: 'system',
      action: 'GET',
      requiresAuth: false,
      rateLimit: {
        rpm: 60,
        burst: 10
      },
      inputSchema: {
        type: 'object',
        properties: {
          include_tools: {
            type: 'boolean',
            default: true,
            description: 'Include list of available tools in response'
          },
          include_performance: {
            type: 'boolean', 
            default: false,
            description: 'Include basic performance metrics in response'
          }
        },
        required: []
      }
    };

    super(definition);
  }

  protected async executeImpl(args: ServerInfoArgs = {}, context: ToolContext): Promise<ToolExecutionResult> {
    try {
      const { include_tools = true, include_performance = false } = args;
      
      const info: any = {
        server: {
          name: 'slack-browser-mcp-server',
          version: '1.0.0',
          architecture: 'tool-only',
          status: 'operational',
          phase: 'Phase 5 - Production Ready'
        },
        timestamp: new Date().toISOString()
      };
      
      if (include_tools) {
        info.tools = {
          total_count: 9,
          categories: {
            messaging: 4,
            data: 3, 
            search: 1,
            system: 1
          },
          tool_list: [
            // Messaging tools (4)
            'post_message', 
            'update_message', 
            'delete_message', 
            'react_to_message',
            
            // Data retrieval tools (3)
            'get_thread_replies', 
            'list_workspace_channels', 
            'list_workspace_users',
            
            // Search tools (1)
            'search_channel_messages',
            
            // System tools (1)
            'server_info'
          ]
        };
      }
      
      if (include_performance) {
        const memoryUsage = process.memoryUsage();
        info.performance = {
          uptime_seconds: Math.floor(process.uptime()),
          memory_usage: {
            rss_mb: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100,
            heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
            heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
            external_mb: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100
          },
          targets: {
            response_time: '<100ms',
            success_rate: '100%',
            memory_usage: '<50MB'
          }
        };
      }

      logger.info('Server info requested', {
        includeTools: include_tools,
        includePerformance: include_performance
      });
      
      return this.createSuccessResult(info, {
        apiCalls: 0,
        cacheHits: 0,
        executionTime: Date.now()
      });

    } catch (error: any) {
      logger.error('Failed to get server info', {
        error: error.message || 'Unknown error'
      });

      return this.createErrorResult(
        `Failed to get server info: ${error.message || 'Unknown error'}`,
        'EXECUTION_ERROR',
        { apiCalls: 0, cacheHits: 0 }
      );
    }
  }
}