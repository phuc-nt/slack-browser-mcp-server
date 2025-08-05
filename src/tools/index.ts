import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../utils/logger.js';

export interface ToolExecutionResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

export interface ToolHandler {
  (args: Record<string, unknown>): Promise<ToolExecutionResult>;
}

export class ToolRegistry {
  private tools: Map<string, { definition: Tool; handler: ToolHandler }> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  private registerDefaultTools(): void {
    // Ping tool for connectivity testing
    this.registerTool(
      {
        name: 'ping',
        description: 'Simple connectivity test tool',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      this.pingHandler.bind(this)
    );

    // Echo tool for parameter validation testing
    this.registerTool(
      {
        name: 'echo',
        description: 'Echo back the provided message',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Message to echo back',
            },
          },
          required: ['message'],
        },
      },
      this.echoHandler.bind(this)
    );

    logger.info(`Registered ${this.tools.size} default tools`);
  }

  registerTool(definition: Tool, handler: ToolHandler): void {
    this.tools.set(definition.name, { definition, handler });
    logger.debug(`Registered tool: ${definition.name}`);
  }

  getTools(): Tool[] {
    return Array.from(this.tools.values()).map(({ definition }) => definition);
  }

  async executeTool(name: string, args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    logger.debug(`Executing tool: ${name}`, { args });
    return await tool.handler(args);
  }

  private async pingHandler(_args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const timestamp = new Date().toISOString();
    return {
      content: [
        {
          type: 'text',
          text: `Pong! Server is running. Timestamp: ${timestamp}`,
        },
      ],
    };
  }

  private async echoHandler(args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const message = args.message as string;
    if (!message) {
      throw new Error('Message parameter is required');
    }

    return {
      content: [
        {
          type: 'text',
          text: `Echo: ${message}`,
        },
      ],
    };
  }
}