import { BaseSlackTool } from './base.js';
import { logger } from '../utils/logger.js';

// Import core production tools only
import { PostMessageTool, UpdateMessageTool, DeleteMessageTool } from './messaging.js';
import { PostMessageBlocksTool, UpdateMessageBlocksTool } from './block-kit-messaging.js';
import {
  GetThreadRepliesTool,
  ListWorkspaceChannelsTool,
  ListWorkspaceUsersTool,
} from './data-tool-implementations.js';
import { SearchMessagesTool, SearchFilesTool } from './enhanced-search-tools.js';
import { CollectThreadsByTimeRangeTool } from './time-range-thread-collection.js';
import { ReactToMessageTool } from './reactions.js';
import { GetUserProfileTool } from './user-profile.js';
import { DataTools } from './data-tools.js';

/**
 * Production Tool Factory - Sprint 7.4 Enhancement
 *
 * Registers 12 core production tools (added Block Kit support):
 * - 6 Messaging tools (4 basic + 2 Block Kit)
 * - 4 Data retrieval tools
 * - 2 Enhanced search tools
 * - 1 Thread collection tool (enhanced time-range with keyword support)
 *
 * Sprint 7.4: Added Block Kit messaging tools for interactive content.
 */
export class ProductionToolFactory {
  private toolInstances: Map<string, BaseSlackTool> = new Map();

  constructor() {
    this.registerProductionTools();
  }

  /**
   * Register the 12 core production tools (Sprint 7.4)
   */
  private registerProductionTools(): void {
    try {
      // Messaging Tools (6) - Sprint 7.4: Added Block Kit tools
      this.registerTool(new PostMessageTool());
      this.registerTool(new UpdateMessageTool());
      this.registerTool(new DeleteMessageTool());
      this.registerTool(new ReactToMessageTool());
      this.registerTool(new PostMessageBlocksTool());
      this.registerTool(new UpdateMessageBlocksTool());

      logger.info('Registered messaging tools', {
        tools: ['post_message', 'update_message', 'delete_message', 'react_to_message', 'post_message_blocks', 'update_message_blocks'],
      });

      // Data Retrieval Tools (4) - Sprint 7.2
      this.registerTool(new GetThreadRepliesTool(DataTools.createGetThreadRepliesTool()));
      this.registerTool(new ListWorkspaceChannelsTool(DataTools.createListWorkspaceChannelsTool()));
      this.registerTool(new ListWorkspaceUsersTool(DataTools.createListWorkspaceUsersTool()));
      this.registerTool(new GetUserProfileTool());

      logger.info('Registered data retrieval tools', {
        tools: [
          'get_thread_replies',
          'list_workspace_channels',
          'list_workspace_users',
          'get_user_profile',
        ],
      });

      // Enhanced Search Tools (2) - Phase 6
      this.registerTool(new SearchMessagesTool());
      this.registerTool(new SearchFilesTool());

      logger.info('Registered enhanced search tools', {
        tools: ['search_messages', 'search_files'],
      });

      // Thread Collection Tools (1) - Sprint 7.3 Enhanced with keyword support
      this.registerTool(new CollectThreadsByTimeRangeTool());

      logger.info('Registered thread collection tools', {
        tools: ['collect_threads_by_timerange'],
      });

      // System Tools removed in Sprint 7.2 for streamlined architecture

      logger.info('Production tool factory initialized', {
        totalTools: this.toolInstances.size,
        architecture: 'Sprint 7.4 - Block Kit Enhancement',
        tools: Array.from(this.toolInstances.keys()).sort(),
      });
    } catch (error) {
      logger.error('Failed to register production tools', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Register a single tool instance
   */
  private registerTool(tool: BaseSlackTool): void {
    const definition = tool.getDefinition();
    this.toolInstances.set(definition.name, tool);
  }

  /**
   * Get all registered tools
   */
  getTools(): BaseSlackTool[] {
    return Array.from(this.toolInstances.values());
  }

  /**
   * Get tool by name
   */
  getTool(name: string): BaseSlackTool | undefined {
    return this.toolInstances.get(name);
  }

  /**
   * Get tool statistics
   */
  getStats() {
    return {
      instances: this.toolInstances.size,
      categories: {
        messaging: 6,
        data: 4,
        search: 2,
        collection: 1,
      },
      toolNames: Array.from(this.toolInstances.keys()).sort(),
    };
  }

  /**
   * Validate that exactly 12 tools are registered (Sprint 7.4 - Block Kit tools, consolidated keyword support)
   */
  validateConfiguration(): boolean {
    const expectedTools = [
      // Messaging (6) - Sprint 7.4: Added Block Kit tools
      'post_message',
      'update_message',
      'delete_message',
      'react_to_message',
      'post_message_blocks',
      'update_message_blocks',
      // Data (4) - Phase 6.3
      'get_thread_replies',
      'list_workspace_channels',
      'list_workspace_users',
      'get_user_profile',
      // Enhanced Search (2) - Phase 6
      'search_messages',
      'search_files',
      // Thread Collection (1) - Sprint 7.3 Enhanced with keyword support
      'collect_threads_by_timerange',
    ];

    const actualTools = Array.from(this.toolInstances.keys()).sort();
    const expectedSorted = expectedTools.sort();

    if (actualTools.length !== expectedSorted.length) {
      logger.error('Tool count mismatch', {
        expected: expectedSorted.length,
        actual: actualTools.length,
        missing: expectedSorted.filter((t) => !actualTools.includes(t)),
        extra: actualTools.filter((t) => !expectedSorted.includes(t)),
      });
      return false;
    }

    const isValid = JSON.stringify(actualTools) === JSON.stringify(expectedSorted);

    if (!isValid) {
      logger.error('Tool configuration mismatch', {
        expected: expectedSorted,
        actual: actualTools,
      });
    } else {
      logger.info('Production tool configuration validated', {
        toolCount: actualTools.length,
        tools: actualTools,
      });
    }

    return isValid;
  }
}
