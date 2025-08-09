import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  McpError,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { logger } from './utils/logger.js';
import { ToolRegistry } from './tools/index.js';
// ResourceRegistry removed - tool-only architecture
import { createDevelopmentMiddleware } from './middleware/index.js';

export class SlackMCPServer {
  private server: Server;
  private toolRegistry: ToolRegistry;

  constructor() {
    this.server = new Server(
      {
        name: 'slack-browser-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {}
          // resources removed - tool-only architecture
        },
      }
    );

    // Initialize registries with middleware
    const middleware = createDevelopmentMiddleware();
    this.toolRegistry = new ToolRegistry({
      middleware,
      enableMetrics: true,
      enableTracing: true
    });
    
    // ResourceRegistry removed - tool-only architecture
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Tools handlers
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.info('Received list tools request');
      const tools = this.toolRegistry.getTools();
      logger.debug('Returning tools', { count: tools.length, tools: tools.map(t => t.name) });
      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      logger.info(`Received tool call request: ${name}`, { args });

      try {
        const result = await this.toolRegistry.executeTool(name, args || {});
        return {
          content: result.content || [{
            type: 'text',
            text: result.success ? JSON.stringify(result.data, null, 2) : (result.error || 'Unknown error')
          }],
          isError: result.isError || !result.success,
        };
      } catch (error) {
        logger.error(`Tool execution failed: ${name}`, { error });
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });

    // No resource handlers - tool-only architecture
    logger.info('MCP server handlers configured (tool-only architecture)');
  }

  async run(): Promise<void> {
    // Initialize tool registry
    logger.info('Initializing tool registry...');
    await this.toolRegistry.initialize();
    
    // Connect to transport
    const transport = new StdioServerTransport();
    logger.info('Starting Slack MCP Server with stdio transport');
    
    await this.server.connect(transport);
    logger.info('Slack MCP Server connected and ready');
    
    // Log initialization stats
    const stats = this.toolRegistry.getStats();
    logger.info('Server initialization completed', {
      tools: stats.instances,
      middleware: stats.middlewareCount,
      architecture: 'tool-only'
    });

    // Keep the server running indefinitely
    // The server will exit when the stdio connection is closed by the client
    return new Promise<void>((resolve) => {
      // This promise never resolves, keeping the process alive
      // The process will exit when SIGINT/SIGTERM is received or connection closes
    });
  }

  async stop(): Promise<void> {
    logger.info('Stopping Slack MCP Server');
    await this.server.close();
  }
}