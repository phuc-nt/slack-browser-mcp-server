import { JSONSchema } from './tools.js';

/**
 * Enhanced MCP Tool definition with Slack-specific extensions
 */
export interface SlackMCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  
  // Slack-specific extensions
  slackApiEndpoint?: string;
  requiresWorkspaceAuth: boolean;
  cacheable: boolean;
  cacheConfig?: {
    ttl: number;
    key: string;
  };
  
  // Performance and security
  timeout?: number;
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
  };
  
  // Documentation
  examples?: Array<{
    name: string;
    description: string;
    input: any;
    expectedOutput: any;
  }>;
}

/**
 * MCP Resource with Slack workspace context
 */
export interface SlackMCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  
  // Slack-specific
  workspaceId?: string;
  requiresAuth: boolean;
  cacheable: boolean;
  
  // Dynamic resource generation
  generator?: {
    type: 'static' | 'dynamic' | 'cached';
    refreshInterval?: number;
  };
}

/**
 * Tool execution metrics for MCP
 */
export interface MCPToolMetrics {
  toolName: string;
  requestId: string;
  startTime: number;
  endTime: number;
  success: boolean;
  error?: string;
  
  // Performance metrics
  executionTime: number;
  apiCalls: number;
  cacheHits: number;
  
  // Context
  userAgent?: string;
  clientVersion?: string;
}

/**
 * Resource access metrics
 */
export interface MCPResourceMetrics {
  resourceUri: string;
  requestId: string;
  accessTime: number;
  success: boolean;
  bytesTransferred: number;
  cacheHit: boolean;
}

/**
 * Server capability extensions
 */
export interface SlackMCPCapabilities {
  tools: {
    listChanged?: boolean;
    dynamicRegistration?: boolean;
  };
  resources: {
    subscribe?: boolean;
    listChanged?: boolean;
  };
  
  // Slack-specific capabilities
  slack: {
    workspaceInfo: boolean;
    realtimeEvents: boolean;
    fileAccess: boolean;
    adminFeatures: boolean;
  };
}

/**
 * Enhanced error information for MCP responses
 */
export interface SlackMCPError {
  code: string;
  message: string;
  details?: {
    slackError?: string;
    apiEndpoint?: string;
    retryAfter?: number;
    suggestions?: string[];
  };
}