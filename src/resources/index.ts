import { Resource } from '@modelcontextprotocol/sdk/types.js';
import { SlackMCPResource } from '../types/mcp.js';
import { logger } from '../utils/logger.js';
import { SlackResources } from './slack.js';

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

    // Register Slack workspace resources (MCP-compliant replacements for tools)
    this.registerSlackResources();

    // Register Slack search resources (Sprint 2.3) - async
    this.registerSlackSearchResources().catch(error => {
      logger.warn('Failed to register search resources during construction', { error });
    });

    // Register Thread resources (Sprint 3.1) - async
    this.registerThreadResources().catch(error => {
      logger.warn('Failed to register thread resources during construction', { error });
    });

    logger.info('Built-in resources registered', {
      count: this.resources.size,
      resources: Array.from(this.resources.keys())
    });
  }

  /**
   * Register Slack workspace resources
   */
  private registerSlackResources(): void {
    // Workspace channels resource (replaces list_channels tool)
    this.registerResource(
      SlackResources.createWorkspaceChannelsResource(),
      this.generateSlackWorkspaceChannels.bind(this)
    );

    // Workspace users resource (replaces list_users tool)
    this.registerResource(
      SlackResources.createWorkspaceUsersResource(),
      this.generateSlackWorkspaceUsers.bind(this)
    );

    // Dynamic resource template for channel history (documentation purpose)
    this.registerResource({
      uri: 'slack://channels/{channelId}/history',
      name: 'Channel History Template',
      description: 'Get messages from a specific channel. Replace {channelId} with actual channel ID. Supports parameters: limit, oldest, latest',
      mimeType: 'application/json',
      requiresAuth: true,
      cacheable: false,
      generator: {
        type: 'dynamic'
      }
    }, this.generateChannelHistoryTemplate.bind(this));

    logger.info('Slack workspace resources registered', {
      resources: [
        'slack://workspace/channels', 
        'slack://workspace/users',
        'slack://channels/{channelId}/history'
      ]
    });
  }

  /**
   * Register Slack search resources
   */
  private async registerSlackSearchResources(): Promise<void> {
    try {
      // Import search resources
      const { SearchResources } = await import('./search.js');
      
      // Workspace global search resource
      this.registerResource(
        SearchResources.createWorkspaceSearchResource(),
        this.generateSlackWorkspaceSearch.bind(this)
      );

      // Message search resource
      this.registerResource(
        SearchResources.createMessageSearchResource(), 
        this.generateSlackMessageSearch.bind(this)
      );

      // User search resource
      this.registerResource(
        SearchResources.createUserSearchResource(),
        this.generateSlackUserSearch.bind(this)
      );

      // Channel search resource
      this.registerResource(
        SearchResources.createChannelSearchResource(),
        this.generateSlackChannelSearch.bind(this)
      );

      logger.info('Slack search resources registered', {
        resources: [
          'slack://workspace/search',
          'slack://search/messages', 
          'slack://search/users',
          'slack://search/channels'
        ]
      });
    } catch (error) {
      logger.warn('Failed to register search resources', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Register Thread resources (Sprint 3.1)
   */
  private async registerThreadResources(): Promise<void> {
    try {
      // Import thread resources
      const { ThreadResources } = await import('./threads.js');
      
      // Workspace thread search resource
      this.registerResource(
        ThreadResources.createWorkspaceThreadsResource(),
        this.generateWorkspaceThreads.bind(this)
      );

      // Advanced thread search resource
      this.registerResource(
        ThreadResources.createThreadSearchResource(),
        this.generateAdvancedThreadSearch.bind(this)
      );

      // Note: Dynamic thread resources (channel threads, thread details, thread replies)
      // are handled in generateResourceContent() method via URI routing

      logger.info('Thread resources registered', {
        resources: [
          'slack://workspace/threads',
          'slack://search/threads',
          'slack://channels/{channelId}/threads (dynamic)',
          'slack://threads/{thread_ts}/details (dynamic)',
          'slack://threads/{thread_ts}/replies (dynamic)'
        ]
      });
    } catch (error) {
      logger.warn('Failed to register thread resources', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
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
   * Generate resource content (with dynamic URI support)
   */
  async generateResourceContent(uri: string): Promise<string> {
    // FIRST: Check for exact match for static resources (including templates)
    const generator = this.generators.get(uri);
    
    if (generator) {
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

    // FIRST-B: Check for parameterized static resources (search resources và thread resources)
    const baseUri = uri.split('?')[0];
    const baseGenerator = this.generators.get(baseUri);
    
    if (baseGenerator) {
      try {
        logger.debug('Generating parameterized resource content', { uri, baseUri });
        
        // Special handling cho search và thread resources với parameters
        if (baseUri === 'slack://workspace/threads' || baseUri === 'slack://search/threads') {
          const content = await this.generateThreadResourcesWithParams(baseUri, uri);
          return content;
        } else if (baseUri.startsWith('slack://workspace/search') || baseUri.startsWith('slack://search/')) {
          const content = await this.generateSearchResourcesWithParams(baseUri, uri);
          return content;
        }
        
        // Default behavior for other static resources
        const content = await baseGenerator();
        logger.debug('Parameterized resource content generated successfully', { 
          uri, 
          contentLength: content.length 
        });
        return content;
      } catch (error) {
        logger.error('Failed to generate parameterized resource content', {
          uri,
          baseUri,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    }

    // SECOND: Check if this is a dynamic resource (actual channel IDs)
    const isDynamicResource = baseUri.startsWith('slack://channels/') && 
                             baseUri.endsWith('/history') && 
                             !baseUri.includes('{channelId}'); // Exclude template URI
    
    if (isDynamicResource) {
      const channelId = SlackResources.extractChannelIdFromUri(baseUri);
      if (channelId) {
        const params = SlackResources.extractParamsFromUri(uri);
        return await SlackResources.generateChannelHistoryContent(channelId, params);
      }
    }

    // THIRD: Check if this is a search resource with parameters
    const isSearchResource = baseUri.startsWith('slack://workspace/search') ||
                             baseUri.startsWith('slack://search/');
    
    if (isSearchResource) {
      const { SearchResources } = await import('./search.js');
      const searchParams = SearchResources.extractSearchParamsFromUri(uri);
      
      if (baseUri === 'slack://workspace/search') {
        return await SearchResources.generateWorkspaceSearchContent(searchParams);
      } else if (baseUri === 'slack://search/messages') {
        return await SearchResources.generateMessageSearchContent(searchParams);
      } else if (baseUri === 'slack://search/users') {
        return await SearchResources.generateUserSearchContent(searchParams);
      } else if (baseUri === 'slack://search/channels') {
        return await SearchResources.generateChannelSearchContent(searchParams);
      }
    }

    // FOURTH: Check for thread resources (Sprint 3.1)
    const isThreadResource = baseUri.startsWith('slack://threads/') || 
                             (baseUri.startsWith('slack://channels/') && baseUri.includes('/threads'));

    if (isThreadResource) {
      const { ThreadResources } = await import('./threads.js');
      const threadParams = ThreadResources.extractThreadParamsFromUri(uri);
      
      // Thread details: slack://threads/{thread_ts}/details
      if (baseUri.includes('/details')) {
        const threadTs = ThreadResources.extractThreadTsFromUri(baseUri);
        const channelId = ThreadResources.extractChannelFromThreadUri(uri) || undefined;
        if (threadTs) {
          return await ThreadResources.generateThreadDetailsContent(threadTs, channelId, threadParams);
        }
      }
      
      // Thread replies: slack://threads/{thread_ts}/replies
      else if (baseUri.includes('/replies')) {
        const threadTs = ThreadResources.extractThreadTsFromUri(baseUri);
        const channelId = ThreadResources.extractChannelFromThreadUri(uri) || undefined;
        if (threadTs && channelId) {
          return await ThreadResources.generateThreadRepliesContent(threadTs, channelId, threadParams);
        }
      }
      
      // Channel threads: slack://channels/{channelId}/threads
      else if (baseUri.includes('/threads') && !baseUri.includes('{channelId}')) {
        const channelMatch = baseUri.match(/^slack:\/\/channels\/([^\/]+)\/threads$/);
        if (channelMatch) {
          const channelId = channelMatch[1];
          return await ThreadResources.generateChannelThreadsContent(channelId, threadParams);
        }
      }
    }

    // If we reach here, no static or dynamic resource found
    throw new Error(`No generator found for resource: ${uri}`);
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

  /**
   * Generate Slack workspace channels content
   */
  private async generateSlackWorkspaceChannels(): Promise<string> {
    // Extract query parameters if any (for future URL-based filtering)
    const params: Record<string, string> = {};
    return await SlackResources.generateWorkspaceChannelsContent(params);
  }

  /**
   * Generate Slack workspace users content
   */
  private async generateSlackWorkspaceUsers(): Promise<string> {
    // Extract query parameters if any (for future URL-based filtering)
    const params: Record<string, string> = {};
    return await SlackResources.generateWorkspaceUsersContent(params);
  }

  /**
   * Generate channel history template documentation
   */
  private async generateChannelHistoryTemplate(): Promise<string> {
    const template = {
      template: 'slack://channels/{channelId}/history',
      description: 'Dynamic resource for getting channel message history',
      usage: {
        uri_pattern: 'slack://channels/CHANNEL_ID/history',
        example: 'slack://channels/C07UMQ2PR1V/history',
        parameters: {
          limit: {
            type: 'number',
            description: 'Number of messages to retrieve (1-1000)',
            default: 20,
            example: 'slack://channels/C07UMQ2PR1V/history?limit=50'
          },
          oldest: {
            type: 'string',
            description: 'Oldest message timestamp to include',
            example: 'slack://channels/C07UMQ2PR1V/history?oldest=1640995200.123456'
          },
          latest: {
            type: 'string', 
            description: 'Latest message timestamp to include',
            example: 'slack://channels/C07UMQ2PR1V/history?latest=1640995200.123456'
          }
        }
      },
      notes: [
        'Replace {channelId} with actual Slack channel ID (starts with C)',
        'Parameters can be combined: ?limit=10&oldest=1640995200.123456',
        'This template shows available parameters - use actual channel IDs for real data'
      ]
    };

    return JSON.stringify(template, null, 2);
  }

  /**
   * Generate Slack workspace search content
   */
  private async generateSlackWorkspaceSearch(): Promise<string> {
    // This method will be called with URI parameters - extract them from the current context
    // For now, return a placeholder indicating search functionality
    const { SearchResources } = await import('./search.js');
    
    // In a real implementation, we would get URI from context
    // For now, return example usage
    return SearchResources.generateWorkspaceSearchContent({
      query: undefined // Will be populated from URI parameters
    });
  }

  /**
   * Generate Slack message search content  
   */
  private async generateSlackMessageSearch(): Promise<string> {
    const { SearchResources } = await import('./search.js');
    
    return SearchResources.generateMessageSearchContent({
      query: undefined // Will be populated from URI parameters
    });
  }

  /**
   * Generate Slack user search content
   */
  private async generateSlackUserSearch(): Promise<string> {
    const { SearchResources } = await import('./search.js');
    
    return SearchResources.generateUserSearchContent({
      query: undefined // Will be populated from URI parameters  
    });
  }

  /**
   * Generate Slack channel search content
   */
  private async generateSlackChannelSearch(): Promise<string> {
    const { SearchResources } = await import('./search.js');
    
    return SearchResources.generateChannelSearchContent({
      query: undefined // Will be populated from URI parameters
    });
  }

  /**
   * Generate workspace threads content (Sprint 3.1)
   */
  private async generateWorkspaceThreads(): Promise<string> {
    const { ThreadResources } = await import('./threads.js');
    
    // Return usage example when called without parameters
    return ThreadResources.generateWorkspaceThreadsContent({
      query: undefined // Will be populated from URI parameters
    });
  }

  /**
   * Generate advanced thread search content (Sprint 3.1)
   */
  private async generateAdvancedThreadSearch(): Promise<string> {
    const { ThreadResources } = await import('./threads.js');
    
    // Return usage example when called without parameters  
    return ThreadResources.generateThreadSearchContent({
      query: undefined // Will be populated from URI parameters
    });
  }

  /**
   * Generate thread resources với parameters từ URI
   */
  private async generateThreadResourcesWithParams(baseUri: string, fullUri: string): Promise<string> {
    const { ThreadResources } = await import('./threads.js');
    const params = ThreadResources.extractThreadParamsFromUri(fullUri);

    if (baseUri === 'slack://workspace/threads') {
      return ThreadResources.generateWorkspaceThreadsContent(params);
    } else if (baseUri === 'slack://search/threads') {
      return ThreadResources.generateThreadSearchContent(params);
    }

    throw new Error(`Unknown thread resource: ${baseUri}`);
  }

  /**
   * Generate search resources với parameters từ URI
   */
  private async generateSearchResourcesWithParams(baseUri: string, fullUri: string): Promise<string> {
    const { SearchResources } = await import('./search.js');
    const params = SearchResources.extractSearchParamsFromUri(fullUri);

    if (baseUri === 'slack://workspace/search') {
      return SearchResources.generateWorkspaceSearchContent(params);
    } else if (baseUri === 'slack://search/messages') {
      return SearchResources.generateMessageSearchContent(params);
    } else if (baseUri === 'slack://search/users') {
      return SearchResources.generateUserSearchContent(params);
    } else if (baseUri === 'slack://search/channels') {
      return SearchResources.generateChannelSearchContent(params);
    }

    throw new Error(`Unknown search resource: ${baseUri}`);
  }
}