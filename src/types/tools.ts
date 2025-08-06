// JSON Schema type definition
export interface JSONSchema {
  type?: string;
  properties?: Record<string, any>;
  required?: string[];
  items?: JSONSchema;
  [key: string]: any;
}

/**
 * Base interface for all Slack tools
 */
export interface SlackTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  category: ToolCategory | string;
  tags?: string[];
  requiresAuth?: boolean;
  action?: 'GET' | 'POST' | 'PUT' | 'DELETE';  // MCP action type for tools
  rateLimit?: {
    maxCalls?: number;      // Legacy format
    windowMs?: number;      // Legacy format
    rpm?: number;          // Requests per minute (new format)
    burst?: number;        // Burst limit (new format)
  };
}

/**
 * Tool categories for organization
 */
export enum ToolCategory {
  CONVERSATIONS = 'conversations',
  CHANNELS = 'channels', 
  SEARCH = 'search',
  USERS = 'users',
  FILES = 'files',
  SYSTEM = 'system',
  MESSAGING = 'messaging'  // Added for Sprint 2.3 messaging tools
}

/**
 * Tool execution context
 */
export interface ToolContext {
  toolName: string;
  startTime: number;
  traceId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  errorCode?: string;
  content?: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
  metadata?: {
    executionTime: number;
    apiCalls: number;
    cacheHits: number;
  };
}

/**
 * Tool validation result
 */
export interface ToolValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Tool handler interface
 */
export interface ToolHandler {
  execute(args: any, context: ToolContext): Promise<ToolExecutionResult>;
  validate?(args: any): Promise<ToolValidationResult>;
  cleanup?(): Promise<void>;
}

/**
 * Tool factory interface
 */
export interface ToolFactory {
  createTool(definition: SlackTool): ToolHandler;
  validateDefinition(definition: SlackTool): ToolValidationResult;
}

/**
 * Tool middleware interface
 */
export interface ToolMiddleware {
  name: string;
  priority: number;
  before?(context: ToolContext, args: any): Promise<void>;
  after?(context: ToolContext, result: ToolExecutionResult): Promise<void>;
  onError?(context: ToolContext, error: Error): Promise<void>;
}

/**
 * Tool registry configuration
 */
export interface ToolRegistryConfig {
  enableMetrics: boolean;
  enableTracing: boolean;
  defaultTimeout: number;
  maxConcurrentExecutions: number;
  middleware: ToolMiddleware[];
}

/**
 * Tool performance metrics
 */
export interface ToolMetrics {
  toolName: string;
  executionCount: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  errorCount: number;
  lastExecuted: Date;
  cacheHitRate: number;
}