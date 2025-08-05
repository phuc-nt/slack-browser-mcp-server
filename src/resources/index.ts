import { Resource } from '@modelcontextprotocol/sdk/types.js';
import { SlackMCPResource } from '../types/mcp.js';
import { logger } from '../utils/logger.js';

/**
 * Resource registry for MCP resources
 */
export class ResourceRegistry {
  private resources: Map<string, SlackMCPResource> = new Map();
  private generators: Map<string, () => Promise<string>> = new Map();

  constructor() {
    this.registerBuiltInResources();
  }

  /**
   * Register built-in resources
   */
  private registerBuiltInResources(): void {
    // System status resource
    this.registerResource({
      uri: 'slack://system/status',
      name: 'System Status',
      description: 'Current status of the MCP server and its components',
      mimeType: 'application/json',
      requiresAuth: false,
      cacheable: false,
      generator: {
        type: 'dynamic',
        refreshInterval: 30000 // 30 seconds
      }
    }, this.generateSystemStatus.bind(this));

    // Server info resource
    this.registerResource({
      uri: 'slack://system/info',
      name: 'Server Information',
      description: 'Basic information about the MCP server',
      mimeType: 'application/json',
      requiresAuth: false,
      cacheable: true,
      generator: {
        type: 'static'
      }
    }, this.generateServerInfo.bind(this));

    // Tool registry resource
    this.registerResource({
      uri: 'slack://tools/registry',
      name: 'Tool Registry',
      description: 'Information about registered tools and their capabilities',
      mimeType: 'application/json',
      requiresAuth: false,
      cacheable: true,
      generator: {
        type: 'cached',
        refreshInterval: 300000 // 5 minutes
      }
    }, this.generateToolRegistry.bind(this));

    // Performance metrics resource
    this.registerResource({
      uri: 'slack://system/metrics',
      name: 'Performance Metrics',
      description: 'Performance metrics and statistics',
      mimeType: 'application/json',
      requiresAuth: false,
      cacheable: false,
      generator: {
        type: 'dynamic'
      }
    }, this.generateMetrics.bind(this));

    // Workspace info placeholder (for future Slack integration)
    this.registerResource({
      uri: 'slack://workspace/info',
      name: 'Workspace Information',
      description: 'Basic information about the connected Slack workspace',
      mimeType: 'application/json',
      requiresAuth: true,
      cacheable: true,
      generator: {
        type: 'cached',
        refreshInterval: 3600000 // 1 hour
      }
    }, this.generateWorkspaceInfo.bind(this));

    logger.info('Built-in resources registered', {
      count: this.resources.size,
      resources: Array.from(this.resources.keys())
    });
  }

  /**
   * Register a resource with its generator
   */
  registerResource(resource: SlackMCPResource, generator: () => Promise<string>): void {
    this.resources.set(resource.uri, resource);
    this.generators.set(resource.uri, generator);
    
    logger.debug('Resource registered', {
      uri: resource.uri,
      name: resource.name,
      mimeType: resource.mimeType,
      requiresAuth: resource.requiresAuth
    });
  }

  /**
   * Get all available resources
   */
  getResources(): Resource[] {
    return Array.from(this.resources.values()).map(resource => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType
    }));
  }

  /**
   * Get resource by URI
   */
  getResource(uri: string): SlackMCPResource | undefined {
    return this.resources.get(uri);
  }

  /**
   * Generate resource content
   */
  async generateResourceContent(uri: string): Promise<string> {
    const generator = this.generators.get(uri);
    if (!generator) {
      throw new Error(`No generator found for resource: ${uri}`);
    }

    try {
      logger.debug('Generating resource content', { uri });
      const content = await generator();
      logger.debug('Resource content generated successfully', { 
        uri, 
        contentLength: content.length 
      });
      return content;
    } catch (error) {
      logger.error('Failed to generate resource content', {
        uri,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Generate system status resource
   */
  private async generateSystemStatus(): Promise<string> {
    const status = {
      server: 'Slack MCP Server',
      version: '1.0.0',
      status: 'operational',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'production',
        logLevel: process.env.LOG_LEVEL || 'info'
      }
    };

    return JSON.stringify(status, null, 2);
  }

  /**
   * Generate server info resource
   */
  private async generateServerInfo(): Promise<string> {
    const info = {
      name: 'Slack MCP Server',
      version: '1.0.0',
      description: 'AI Assistants meets Slack - Tích hợp Claude với Slack workspace mà không cần permissions',
      protocol: 'Model Context Protocol (MCP)',
      transport: ['stdio', 'sse'],
      capabilities: {
        tools: true,
        resources: true,
        slack: {
          workspaceInfo: false, // Will be true in Phase 2
          realtimeEvents: false,
          fileAccess: false,
          adminFeatures: false
        }
      },
      phase: {
        current: 'Phase 1: Foundation',
        status: 'Sprint 1.2 - Tool Architecture & Advanced Dev Environment',
        features: [
          'MCP server core infrastructure',
          'Tool registry system',
          'Resource system foundation',
          'Development tooling'
        ]
      }
    };

    return JSON.stringify(info, null, 2);
  }

  /**
   * Generate tool registry resource
   */
  private async generateToolRegistry(): Promise<string> {
    // This will be populated by the actual tool registry when integrated
    const registry = {
      totalTools: 2,
      categories: {
        system: ['ping', 'echo'],
        conversations: [],
        channels: [],
        search: [],
        users: [],
        files: []
      },
      toolDetails: [
        {
          name: 'ping',
          description: 'Test tool connectivity and response time',
          category: 'system',
          requiresAuth: false,
          rateLimit: null
        },
        {
          name: 'echo',
          description: 'Echo back the input for testing',
          category: 'system',
          requiresAuth: false,
          rateLimit: null
        }
      ],
      placeholders: {
        conversations: 3,
        channels: 4,
        search: 4
      },
      note: 'Placeholder tools will be implemented in Phase 2: Slack Integration'
    };

    return JSON.stringify(registry, null, 2);
  }

  /**
   * Generate metrics resource
   */
  private async generateMetrics(): Promise<string> {
    const metrics = {
      timestamp: new Date().toISOString(),
      server: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      },
      tools: {
        totalExecutions: 0,
        successRate: 100,
        averageExecutionTime: 0,
        errors: []
      },
      resources: {
        totalRequests: 0,
        cacheHitRate: 0,
        averageGenerationTime: 0
      },
      note: 'Metrics will be populated as tools are executed'
    };

    return JSON.stringify(metrics, null, 2);
  }

  /**
   * Generate workspace info resource (placeholder for Phase 2)
   */
  private async generateWorkspaceInfo(): Promise<string> {
    const info = {
      status: 'not_connected',
      message: 'Workspace integration will be available in Phase 2: Slack Integration',
      phase2Features: [
        'Workspace metadata',
        'Channel listings',
        'User directory',
        'Team information',
        'Authentication status'
      ],
      authentication: {
        required: true,
        method: 'browser_tokens',
        tokens: ['xoxc', 'xoxd']
      }
    };

    return JSON.stringify(info, null, 2);
  }
}