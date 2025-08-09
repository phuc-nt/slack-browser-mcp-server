import { BaseSlackTool } from './base.js';
import { logger } from '../utils/logger.js';

// Import core production tools only
import { PostMessageTool, UpdateMessageTool, DeleteMessageTool } from './messaging.js';
import { GetThreadRepliesTool, ListWorkspaceChannelsTool, ListWorkspaceUsersTool } from './data-tool-implementations.js';
import { SearchChannelMessagesTool } from './data-tool-implementations.js';
import { ReactToMessageTool } from './reactions.js';
import { ServerInfoTool } from './server-info.js';
import { DataTools } from './data-tools.js';

/**
 * Production Tool Factory - Phase 5 Streamlined Architecture
 * 
 * Registers exactly 9 core production tools:
 * - 4 Messaging tools
 * - 3 Data retrieval tools  
 * - 1 Search tool
 * - 1 System tool
 * 
 * All broken, duplicate, and unnecessary tools removed.
 */
export class ProductionToolFactory {
  private toolInstances: Map<string, BaseSlackTool> = new Map();

  constructor() {
    this.registerProductionTools();
  }

  /**
   * Register the 9 core production tools
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

      // Search Tools (1)
      this.registerTool(new SearchChannelMessagesTool(DataTools.createSearchChannelMessagesTool()));

      logger.info('Registered search tools', {
        tools: ['search_channel_messages']
      });

      // System Tools (1)
      this.registerTool(new ServerInfoTool());

      logger.info('Registered system tools', {
        tools: ['server_info']
      });

      logger.info('Production tool factory initialized', {
        totalTools: this.toolInstances.size,
        architecture: 'Phase 5 - Streamlined Production',
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
        search: 1,
        system: 1
      },
      toolNames: Array.from(this.toolInstances.keys()).sort()
    };
  }

  /**
   * Validate that exactly 9 tools are registered
   */
  validateConfiguration(): boolean {
    const expectedTools = [
      // Messaging (4)
      'post_message', 'update_message', 'delete_message', 'react_to_message',
      // Data (3) 
      'get_thread_replies', 'list_workspace_channels', 'list_workspace_users',
      // Search (1)
      'search_channel_messages',
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