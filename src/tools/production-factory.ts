import { BaseSlackTool } from './base.js';
import { logger } from '../utils/logger.js';

// Import core production tools only
import { PostMessageTool, UpdateMessageTool, DeleteMessageTool } from './messaging.js';
import {
  GetThreadRepliesTool,
  ListWorkspaceChannelsTool,
  ListWorkspaceUsersTool,
} from './data-tool-implementations.js';
import { SearchMessagesTool, SearchFilesTool } from './enhanced-search-tools.js';
import { CollectThreadsByTimeRangeTool, CollectThreadsByKeywordTool } from './time-range-thread-collection.js';
import { ReactToMessageTool } from './reactions.js';
import { GetUserProfileTool } from './user-profile.js';
import { DataTools } from './data-tools.js';

/**
 * Production Tool Factory - Sprint 7.3 Enhancement
 *
 * Registers 12 core production tools (added keyword search):
 * - 4 Messaging tools
 * - 3 Data retrieval tools
 * - 2 Enhanced search tools
 * - 2 Thread collection tools (time-range + keyword-based)
 *
 * Sprint 7.3: Added keyword-based thread collection for enhanced discovery.
 */
export class ProductionToolFactory {
  private toolInstances: Map<string, BaseSlackTool> = new Map();

  constructor() {
    this.registerProductionTools();
  }

  /**
   * Register the 12 core production tools (Sprint 7.3)
   */
  private registerProductionTools(): void {
    try {
      // Messaging Tools (4)
      this.registerTool(new PostMessageTool());
      this.registerTool(new UpdateMessageTool());
      this.registerTool(new DeleteMessageTool());
      this.registerTool(new ReactToMessageTool());

      logger.info('Registered messaging tools', {
        tools: ['post_message', 'update_message', 'delete_message', 'react_to_message'],
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

      // Thread Collection Tools (2) - Sprint 7.3 Enhanced
      this.registerTool(new CollectThreadsByTimeRangeTool());
      this.registerTool(new CollectThreadsByKeywordTool());

      logger.info('Registered thread collection tools', {
        tools: ['collect_threads_by_timerange', 'collect_threads_by_keyword'],
      });

      // System Tools removed in Sprint 7.2 for streamlined architecture

      logger.info('Production tool factory initialized', {
        totalTools: this.toolInstances.size,
        architecture: 'Sprint 7.3 - Keyword Search Enhancement',
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
        messaging: 4,
        data: 3,
        search: 2,
        collection: 2,
      },
      toolNames: Array.from(this.toolInstances.keys()).sort(),
    };
  }

  /**
   * Validate that exactly 12 tools are registered (Sprint 7.3 - added keyword search)
   */
  validateConfiguration(): boolean {
    const expectedTools = [
      // Messaging (4)
      'post_message',
      'update_message',
      'delete_message',
      'react_to_message',
      // Data (4) - Phase 6.3
      'get_thread_replies',
      'list_workspace_channels',
      'list_workspace_users',
      'get_user_profile',
      // Enhanced Search (2) - Phase 6
      'search_messages',
      'search_files',
      // Thread Collection (2) - Sprint 7.3 Enhanced
      'collect_threads_by_timerange',
      'collect_threads_by_keyword',
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
