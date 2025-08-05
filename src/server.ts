import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { logger } from './utils/logger.js';
import { ToolRegistry } from './tools/index.js';

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
          tools: {},
        },
      }
    );

    this.toolRegistry = new ToolRegistry();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.info('Received list tools request');
      const tools = this.toolRegistry.getTools();
      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      logger.info(`Received tool call request: ${name}`, { args });

      try {
        const result = await this.toolRegistry.executeTool(name, args || {});
        return {
          content: result.content,
          isError: result.isError || false,
        };
      } catch (error) {
        logger.error(`Tool execution failed: ${name}`, { error });
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });

    logger.info('MCP server handlers configured');
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    logger.info('Starting Slack MCP Server with stdio transport');
    
    await this.server.connect(transport);
    logger.info('Slack MCP Server connected and ready');
  }

  async stop(): Promise<void> {
    logger.info('Stopping Slack MCP Server');
    await this.server.close();
  }
}