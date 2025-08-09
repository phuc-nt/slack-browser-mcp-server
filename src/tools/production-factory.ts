import { BaseSlackTool } from './base.js';
import { logger } from '../utils/logger.js';

// Import core production tools only
import { PostMessageTool, UpdateMessageTool, DeleteMessageTool } from './messaging.js';
import { GetThreadRepliesTool, ListWorkspaceChannelsTool, ListWorkspaceUsersTool } from './data-tool-implementations.js';
import { SearchMessagesTool, SearchFilesTool } from './enhanced-search-tools.js';
import { ReactToMessageTool } from './reactions.js';
import { ServerInfoTool } from './server-info.js';
import { DataTools } from './data-tools.js';

/**
 * Production Tool Factory - Phase 6 Enhanced Search Architecture
 * 
 * Registers exactly 10 core production tools:
 * - 4 Messaging tools
 * - 3 Data retrieval tools  
 * - 2 Enhanced search tools
 * - 1 System tool
 * 
 * Phase 6 enhancements: Advanced search with comprehensive query operators and file search.
 */
export class ProductionToolFactory {
  private toolInstances: Map<string, BaseSlackTool> = new Map();

  constructor() {
    this.registerProductionTools();
  }

  /**
   * Register the 10 core production tools (Phase 6)
   */
  private registerProductionTools(): void {
    try {
      // Messaging Tools (4)
      this.registerTool(new PostMessageTool());
      this.registerTool(new UpdateMessageTool());
      this.registerTool(new DeleteMessageTool());
      this.registerTool(new ReactToMessageTool());

      logger.info('Registered messaging tools', {
        tools: ['post_message', 'update_message', 'delete_message', 'react_to_message']
      });

      // Data Retrieval Tools (3)
      this.registerTool(new GetThreadRepliesTool(DataTools.createGetThreadRepliesTool()));
      this.registerTool(new ListWorkspaceChannelsTool(DataTools.createListWorkspaceChannelsTool()));
      this.registerTool(new ListWorkspaceUsersTool(DataTools.createListWorkspaceUsersTool()));

      logger.info('Registered data retrieval tools', {
        tools: ['get_thread_replies', 'list_workspace_channels', 'list_workspace_users']
      });

      // Enhanced Search Tools (2) - Phase 6
      this.registerTool(new SearchMessagesTool());
      this.registerTool(new SearchFilesTool());

      logger.info('Registered enhanced search tools', {
        tools: ['search_messages', 'search_files']
      });

      // System Tools (1)
      this.registerTool(new ServerInfoTool());

      logger.info('Registered system tools', {
        tools: ['server_info']
      });

      logger.info('Production tool factory initialized', {
        totalTools: this.toolInstances.size,
        architecture: 'Phase 6 - Enhanced Search Integration',
        tools: Array.from(this.toolInstances.keys()).sort()
      });

    } catch (error) {
      logger.error('Failed to register production tools', {
        error: error instanceof Error ? error.message : 'Unknown error'
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
        system: 1
      },
      toolNames: Array.from(this.toolInstances.keys()).sort()
    };
  }

  /**
   * Validate that exactly 10 tools are registered (Phase 6)
   */
  validateConfiguration(): boolean {
    const expectedTools = [
      // Messaging (4)
      'post_message', 'update_message', 'delete_message', 'react_to_message',
      // Data (3) 
      'get_thread_replies', 'list_workspace_channels', 'list_workspace_users',
      // Enhanced Search (2) - Phase 6
      'search_messages', 'search_files',
      // System (1)
      'server_info'
    ];

    const actualTools = Array.from(this.toolInstances.keys()).sort();
    const expectedSorted = expectedTools.sort();

    if (actualTools.length !== expectedSorted.length) {
      logger.error('Tool count mismatch', {
        expected: expectedSorted.length,
        actual: actualTools.length,
        missing: expectedSorted.filter(t => !actualTools.includes(t)),
        extra: actualTools.filter(t => !expectedSorted.includes(t))
      });
      return false;
    }

    const isValid = JSON.stringify(actualTools) === JSON.stringify(expectedSorted);
    
    if (!isValid) {
      logger.error('Tool configuration mismatch', {
        expected: expectedSorted,
        actual: actualTools
      });
    } else {
      logger.info('Production tool configuration validated', {
        toolCount: actualTools.length,
        tools: actualTools
      });
    }

    return isValid;
  }
}