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
import { ResourceRegistry } from './resources/index.js';
import { createDevelopmentMiddleware } from './middleware/index.js';

export class SlackMCPServer {
  private server: Server;
  private toolRegistry: ToolRegistry;
  private resourceRegistry: ResourceRegistry;

  constructor() {
    this.server = new Server(
      {
        name: 'slack-browser-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {}
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
    
    this.resourceRegistry = new ResourceRegistry();
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

    // Resource handlers
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      logger.info('Received list resources request');
      const resources = this.resourceRegistry.getResources();
      logger.debug('Returning resources', { count: resources.length });
      return { resources };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      console.log('[DEBUG SERVER] ===== READ RESOURCE REQUEST =====');
      console.log('[DEBUG SERVER] URI:', uri);
      logger.info(`Received read resource request: ${uri}`);

      try {
        // FIRST: Check if this is a dynamic resource before doing getResource()
        const baseUri = uri.split('?')[0];
        const isDynamicResource = baseUri.startsWith('slack://channels/') && baseUri.endsWith('/history');
        
        console.log('[DEBUG SERVER] URI:', uri);
        console.log('[DEBUG SERVER] BaseURI:', baseUri);
        console.log('[DEBUG SERVER] isDynamicResource:', isDynamicResource);
        
        let mimeType = 'application/json'; // default
        
        if (isDynamicResource) {
          console.log('[DEBUG SERVER] Processing as dynamic resource');
          // Skip getResource() for dynamic resources, go straight to generation
        } else {
          // Try to get exact resource match for static resources
          const resource = this.resourceRegistry.getResource(uri);
          console.log('[DEBUG SERVER] getResource result:', resource ? 'FOUND' : 'NOT_FOUND');
          
          if (resource) {
            mimeType = resource.mimeType;
            console.log('[DEBUG SERVER] Using static resource');
          } else {
            console.log('[DEBUG SERVER] Static resource not found, throwing error');
            throw new McpError(ErrorCode.InvalidRequest, `Resource not found: ${uri}`);
          }
        }

        const content = await this.resourceRegistry.generateResourceContent(uri);
        return {
          contents: [{
            uri,
            mimeType,
            text: content
          }]
        };
      } catch (error) {
        logger.error(`Resource read failed: ${uri}`, { error });
        throw new McpError(
          ErrorCode.InternalError,
          `Resource read failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });

    logger.info('MCP server handlers configured');
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
      resources: this.resourceRegistry.getResources().length
    });
  }

  async stop(): Promise<void> {
    logger.info('Stopping Slack MCP Server');
    await this.server.close();
  }
}