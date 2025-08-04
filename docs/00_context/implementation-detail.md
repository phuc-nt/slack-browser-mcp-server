Tôi sẽ giúp bạn tạo một Slack MCP Server phiên bản riêng bằng TypeScript/Node.js với stealth mode authentication. Dưới đây là implementation đầy đủ:

## 1. Project Structure

```
slack-mcp-server/
├── src/
│   ├── index.ts              # Entry point
│   ├── server.ts             # MCP Server implementation
│   ├── slack/
│   │   ├── client.ts         # Slack API client
│   │   ├── types.ts          # Slack types
│   │   └── auth.ts           # Authentication handler
│   ├── tools/
│   │   ├── index.ts          # Tools registry
│   │   ├── conversations.ts  # Message tools
│   │   ├── channels.ts       # Channel tools
│   │   └── search.ts         # Search tools
│   ├── cache/
│   │   ├── manager.ts        # Cache manager
│   │   └── types.ts          # Cache types
│   ├── transport/
│   │   ├── stdio.ts          # Stdio transport
│   │   └── sse.ts            # SSE transport
│   └── utils/
│       ├── logger.ts         # Logging utility
│       └── config.ts         # Configuration
├── package.json
├── tsconfig.json
└── README.md
```

## 2. Package Configuration

**package.json**:
```json
{
  "name": "slack-mcp-server",
  "version": "1.0.0",
  "description": "Slack MCP Server with Browser Token Authentication",
  "main": "dist/index.js",
  "bin": {
    "slack-mcp-server": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "test": "jest",
    "lint": "eslint src --ext .ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "axios": "^1.6.0",
    "dotenv": "^16.3.0",
    "express": "^4.18.0",
    "ws": "^8.14.0",
    "node-cache": "^5.1.0",
    "winston": "^3.11.0",
    "commander": "^11.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/express": "^4.17.0",
    "@types/ws": "^8.5.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0"
  },
  "keywords": [
    "slack",
    "mcp",
    "ai",
    "claude",
    "typescript"
  ],
  "license": "MIT"
}
```

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

## 3. Core Implementation

**src/utils/config.ts**:
```typescript
import dotenv from 'dotenv';

dotenv.config();

export interface SlackMCPConfig {
  // Authentication
  xoxcToken: string;
  xoxdToken: string;
  
  // Server
  port: number;
  host: string;
  transport: 'stdio' | 'sse';
  
  // Features
  addMessageTool: string | boolean;
  addMessageMark: boolean;
  addMessageUnfurling: string | boolean;
  
  // Cache
  usersCachePath: string;
  channelsCachePath: string;
  
  // Proxy & Security
  proxy?: string;
  userAgent?: string;
  customTLS: boolean;
  
  // Logging
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export const config: SlackMCPConfig = {
  // Authentication (required)
  xoxcToken: process.env.SLACK_MCP_XOXC_TOKEN || '',
  xoxdToken: process.env.SLACK_MCP_XOXD_TOKEN || '',
  
  // Server config
  port: parseInt(process.env.SLACK_MCP_PORT || '13080'),
  host: process.env.SLACK_MCP_HOST || '127.0.0.1',
  transport: (process.env.SLACK_MCP_TRANSPORT as 'stdio' | 'sse') || 'stdio',
  
  // Features
  addMessageTool: process.env.SLACK_MCP_ADD_MESSAGE_TOOL || false,
  addMessageMark: process.env.SLACK_MCP_ADD_MESSAGE_MARK === 'true',
  addMessageUnfurling: process.env.SLACK_MCP_ADD_MESSAGE_UNFURLING || false,
  
  // Cache
  usersCachePath: process.env.SLACK_MCP_USERS_CACHE || '.users_cache.json',
  channelsCachePath: process.env.SLACK_MCP_CHANNELS_CACHE || '.channels_cache_v2.json',
  
  // Proxy & Security
  proxy: process.env.SLACK_MCP_PROXY,
  userAgent: process.env.SLACK_MCP_USER_AGENT,
  customTLS: process.env.SLACK_MCP_CUSTOM_TLS === 'true',
  
  // Logging
  logLevel: (process.env.SLACK_MCP_LOG_LEVEL as any) || 'info'
};

export function validateConfig(): void {
  if (!config.xoxcToken || !config.xoxdToken) {
    throw new Error(
      'Missing required authentication tokens. Please set SLACK_MCP_XOXC_TOKEN and SLACK_MCP_XOXD_TOKEN'
    );
  }
  
  if (!config.xoxcToken.startsWith('xoxc-')) {
    throw new Error('SLACK_MCP_XOXC_TOKEN must start with "xoxc-"');
  }
  
  if (!config.xoxdToken.startsWith('xoxd-')) {
    throw new Error('SLACK_MCP_XOXD_TOKEN must start with "xoxd-"');
  }
}
```

**src/utils/logger.ts**:
```typescript
import winston from 'winston';
import { config } from './config.js';

export const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'slack-mcp-server' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});
```

**src/slack/types.ts**:
```typescript
export interface SlackUser {
  id: string;
  name: string;
  real_name?: string;
  display_name?: string;
  email?: string;
  is_bot?: boolean;
  deleted?: boolean;
}

export interface SlackChannel {
  id: string;
  name: string;
  is_channel?: boolean;
  is_group?: boolean;
  is_im?: boolean;
  is_mpim?: boolean;
  is_private?: boolean;
  is_archived?: boolean;
  topic?: {
    value: string;
  };
  purpose?: {
    value: string;
  };
  num_members?: number;
}

export interface SlackMessage {
  type: string;
  ts: string;
  user?: string;
  text: string;
  thread_ts?: string;
  reply_count?: number;
  replies?: SlackMessage[];
  reactions?: Array<{
    name: string;
    count: number;
    users: string[];
  }>;
  files?: any[];
  attachments?: any[];
}

export interface SlackResponse<T = any> {
  ok: boolean;
  error?: string;
  data?: T;
  response_metadata?: {
    next_cursor?: string;
  };
}

export interface ConversationHistoryResponse extends SlackResponse {
  messages: SlackMessage[];
  has_more: boolean;
  response_metadata?: {
    next_cursor?: string;
  };
}

export interface ConversationsListResponse extends SlackResponse {
  channels: SlackChannel[];
  response_metadata?: {
    next_cursor?: string;
  };
}

export interface UsersListResponse extends SlackResponse {
  members: SlackUser[];
  response_metadata?: {
    next_cursor?: string;
  };
}

export interface SearchResponse extends SlackResponse {
  messages: {
    matches: SlackMessage[];
    total: number;
  };
}
```

**src/slack/auth.ts**:
```typescript
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

export class SlackAuth {
  private xoxcToken: string;
  private xoxdToken: string;

  constructor() {
    this.xoxcToken = config.xoxcToken;
    this.xoxdToken = config.xoxdToken;
  }

  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.xoxcToken}`,
      'Cookie': `d=${this.xoxdToken}`,
      'Content-Type': 'application/json; charset=utf-8',
      'User-Agent': config.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    };

    logger.debug('Generated auth headers', { 
      hasAuth: !!headers.Authorization,
      hasCookie: !!headers.Cookie 
    });

    return headers;
  }

  validateTokens(): boolean {
    return this.xoxcToken.startsWith('xoxc-') && this.xoxdToken.startsWith('xoxd-');
  }
}
```

**src/slack/client.ts**:
```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { SlackAuth } from './auth.js';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import {
  SlackResponse,
  ConversationHistoryResponse,
  ConversationsListResponse,
  UsersListResponse,
  SearchResponse,
  SlackMessage,
  SlackChannel,
  SlackUser
} from './types.js';

export class SlackClient {
  private auth: SlackAuth;
  private httpClient: AxiosInstance;
  private baseURL = 'https://slack.com/api';

  constructor() {
    this.auth = new SlackAuth();
    this.setupHttpClient();
  }

  private setupHttpClient(): void {
    const axiosConfig: AxiosRequestConfig = {
      baseURL: this.baseURL,
      timeout: 30000,
      headers: this.auth.getAuthHeaders()
    };

    if (config.proxy) {
      const proxyUrl = new URL(config.proxy);
      axiosConfig.proxy = {
        host: proxyUrl.hostname,
        port: parseInt(proxyUrl.port),
        protocol: proxyUrl.protocol.replace(':', '')
      };
    }

    this.httpClient = axios.create(axiosConfig);

    // Request interceptor
    this.httpClient.interceptors.request.use(
      (config) => {
        logger.debug(`Making request to ${config.url}`, {
          method: config.method,
          params: config.params
        });
        return config;
      },
      (error) => {
        logger.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.httpClient.interceptors.response.use(
      (response) => {
        logger.debug(`Response from ${response.config.url}`, {
          status: response.status,
          ok: response.data?.ok
        });
        return response;
      },
      (error) => {
        logger.error('Response error:', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  async conversationsHistory(params: {
    channel: string;
    cursor?: string;
    limit?: number;
    oldest?: string;
    latest?: string;
    include_all_metadata?: boolean;
  }): Promise<ConversationHistoryResponse> {
    try {
      const response = await this.httpClient.get('/conversations.history', { params });
      return response.data;
    } catch (error) {
      logger.error('Error fetching conversation history:', error);
      throw new Error(`Failed to fetch conversation history: ${error}`);
    }
  }

  async conversationsReplies(params: {
    channel: string;
    ts: string;
    cursor?: string;
    limit?: number;
  }): Promise<ConversationHistoryResponse> {
    try {
      const response = await this.httpClient.get('/conversations.replies', { params });
      return response.data;
    } catch (error) {
      logger.error('Error fetching conversation replies:', error);
      throw new Error(`Failed to fetch conversation replies: ${error}`);
    }
  }

  async conversationsList(params: {
    cursor?: string;
    limit?: number;
    types?: string;
    exclude_archived?: boolean;
  } = {}): Promise<ConversationsListResponse> {
    try {
      const response = await this.httpClient.get('/conversations.list', { params });
      return response.data;
    } catch (error) {
      logger.error('Error fetching conversations list:', error);
      throw new Error(`Failed to fetch conversations list: ${error}`);
    }
  }

  async usersList(params: {
    cursor?: string;
    limit?: number;
  } = {}): Promise<UsersListResponse> {
    try {
      const response = await this.httpClient.get('/users.list', { params });
      return response.data;
    } catch (error) {
      logger.error('Error fetching users list:', error);
      throw new Error(`Failed to fetch users list: ${error}`);
    }
  }

  async searchMessages(params: {
    query: string;
    count?: number;
    page?: number;
    sort?: 'score' | 'timestamp';
    sort_dir?: 'asc' | 'desc';
  }): Promise<SearchResponse> {
    try {
      const response = await this.httpClient.get('/search.messages', { params });
      return response.data;
    } catch (error) {
      logger.error('Error searching messages:', error);
      throw new Error(`Failed to search messages: ${error}`);
    }
  }

  async postMessage(params: {
    channel: string;
    text: string;
    thread_ts?: string;
    as_user?: boolean;
  }): Promise<SlackResponse> {
    if (!this.isMessagePostingEnabled()) {
      throw new Error('Message posting is disabled');
    }

    try {
      const response = await this.httpClient.post('/chat.postMessage', params);
      return response.data;
    } catch (error) {
      logger.error('Error posting message:', error);
      throw new Error(`Failed to post message: ${error}`);
    }
  }

  async authTest(): Promise<SlackResponse> {
    try {
      const response = await this.httpClient.get('/auth.test');
      return response.data;
    } catch (error) {
      logger.error('Auth test failed:', error);
      throw new Error(`Auth test failed: ${error}`);
    }
  }

  private isMessagePostingEnabled(): boolean {
    return config.addMessageTool !== false && config.addMessageTool !== '';
  }

  // Utility methods
  resolveChannelId(channelIdentifier: string, channelsCache: Map<string, SlackChannel>): string {
    // If it's already an ID (starts with C, D, G)
    if (/^[CDG][A-Z0-9]+$/.test(channelIdentifier)) {
      return channelIdentifier;
    }

    // If it starts with # or @, remove the prefix and search by name
    const cleanName = channelIdentifier.replace(/^[#@]/, '');
    
    for (const [id, channel] of channelsCache) {
      if (channel.name === cleanName) {
        return id;
      }
    }

    throw new Error(`Channel not found: ${channelIdentifier}`);
  }

  enrichMessagesWithUserData(
    messages: SlackMessage[], 
    usersCache: Map<string, SlackUser>
  ): SlackMessage[] {
    return messages.map(message => {
      if (message.user) {
        const user = usersCache.get(message.user);
        if (user) {
          (message as any).user_profile = {
            real_name: user.real_name,
            display_name: user.display_name,
            name: user.name
          };
        }
      }
      return message;
    });
  }
}
```

**src/cache/types.ts**:
```typescript
import { SlackUser, SlackChannel } from '../slack/types.js';

export interface CacheData {
  users: Record<string, SlackUser>;
  channels: Record<string, SlackChannel>;
  lastUpdated: number;
}

export interface CacheStats {
  usersCount: number;
  channelsCount: number;
  lastUpdated: Date;
  isStale: boolean;
}
```

**src/cache/manager.ts**:
```typescript
import fs from 'fs/promises';
import path from 'path';
import { SlackUser, SlackChannel } from '../slack/types.js';
import { CacheData, CacheStats } from './types.js';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

export class CacheManager {
  private usersCache = new Map<string, SlackUser>();
  private channelsCache = new Map<string, SlackChannel>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  async loadCaches(): Promise<void> {
    await Promise.all([
      this.loadUsersCache(),
      this.loadChannelsCache()
    ]);
  }

  async saveCaches(): Promise<void> {
    await Promise.all([
      this.saveUsersCache(),
      this.saveChannelsCache()
    ]);
  }

  private async loadUsersCache(): Promise<void> {
    try {
      const data = await fs.readFile(config.usersCachePath, 'utf-8');
      const cacheData: Record<string, SlackUser> = JSON.parse(data);
      
      this.usersCache.clear();
      Object.entries(cacheData).forEach(([id, user]) => {
        this.usersCache.set(id, user);
      });
      
      logger.info(`Loaded ${this.usersCache.size} users from cache`);
    } catch (error) {
      logger.warn('Could not load users cache:', error);
    }
  }

  private async loadChannelsCache(): Promise<void> {
    try {
      const data = await fs.readFile(config.channelsCachePath, 'utf-8');
      const cacheData: Record<string, SlackChannel> = JSON.parse(data);
      
      this.channelsCache.clear();
      Object.entries(cacheData).forEach(([id, channel]) => {
        this.channelsCache.set(id, channel);
      });
      
      logger.info(`Loaded ${this.channelsCache.size} channels from cache`);
    } catch (error) {
      logger.warn('Could not load channels cache:', error);
    }
  }

  private async saveUsersCache(): Promise<void> {
    try {
      const cacheData = Object.fromEntries(this.usersCache);
      await fs.writeFile(config.usersCachePath, JSON.stringify(cacheData, null, 2));
      logger.debug('Saved users cache');
    } catch (error) {
      logger.error('Could not save users cache:', error);
    }
  }

  private async saveChannelsCache(): Promise<void> {
    try {
      const cacheData = Object.fromEntries(this.channelsCache);
      await fs.writeFile(config.channelsCachePath, JSON.stringify(cacheData, null, 2));
      logger.debug('Saved channels cache');
    } catch (error) {
      logger.error('Could not save channels cache:', error);
    }
  }

  // User cache methods
  getUser(userId: string): SlackUser | undefined {
    return this.usersCache.get(userId);
  }

  setUser(userId: string, user: SlackUser): void {
    this.usersCache.set(userId, user);
  }

  setUsers(users: SlackUser[]): void {
    users.forEach(user => this.usersCache.set(user.id, user));
  }

  getUsersCache(): Map<string, SlackUser> {
    return this.usersCache;
  }

  // Channel cache methods
  getChannel(channelId: string): SlackChannel | undefined {
    return this.channelsCache.get(channelId);
  }

  setChannel(channelId: string, channel: SlackChannel): void {
    this.channelsCache.set(channelId, channel);
  }

  setChannels(channels: SlackChannel[]): void {
    channels.forEach(channel => this.channelsCache.set(channel.id, channel));
  }

  getChannelsCache(): Map<string, SlackChannel> {
    return this.channelsCache;
  }

  // Utility methods
  findChannelByName(name: string): SlackChannel | undefined {
    const cleanName = name.replace(/^[#@]/, '');
    for (const channel of this.channelsCache.values()) {
      if (channel.name === cleanName) {
        return channel;
      }
    }
    return undefined;
  }

  findUserByName(name: string): SlackUser | undefined {
    const cleanName = name.replace(/^@/, '');
    for (const user of this.usersCache.values()) {
      if (user.name === cleanName || user.display_name === cleanName) {
        return user;
      }
    }
    return undefined;
  }

  getStats(): CacheStats {
    return {
      usersCount: this.usersCache.size,
      channelsCount: this.channelsCache.size,
      lastUpdated: new Date(),
      isStale: false // Implement staleness check if needed
    };
  }

  clear(): void {
    this.usersCache.clear();
    this.channelsCache.clear();
  }
}
```

## 4. MCP Tools Implementation

**src/tools/conversations.ts**:
```typescript
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SlackClient } from '../slack/client.js';
import { CacheManager } from '../cache/manager.js';
import { logger } from '../utils/logger.js';

export class ConversationTools {
  constructor(
    private slackClient: SlackClient,
    private cacheManager: CacheManager
  ) {}

  getTools(): Tool[] {
    return [
      {
        name: 'conversations_history',
        description: 'Get messages from the channel (or DM) by channel_id',
        inputSchema: {
          type: 'object',
          properties: {
            channel_id: {
              type: 'string',
              description: 'ID of the channel in format Cxxxxxxxxxx or its name starting with # or @'
            },
            include_activity_messages: {
              type: 'boolean',
              default: false,
              description: 'If true, include activity messages such as channel_join or channel_leave'
            },
            cursor: {
              type: 'string',
              description: 'Cursor for pagination'
            },
            limit: {
              type: 'string',
              default: '1d',
              description: 'Limit of messages to fetch (e.g. 1d, 1w, 30d, or number like 50)'
            }
          },
          required: ['channel_id']
        }
      },
      {
        name: 'conversations_replies',
        description: 'Get a thread of messages posted to a conversation',
        inputSchema: {
          type: 'object',
          properties: {
            channel_id: {
              type: 'string',
              description: 'ID of the channel'
            },
            thread_ts: {
              type: 'string',
              description: 'Unique identifier of thread parent message'
            },
            include_activity_messages: {
              type: 'boolean',
              default: false
            },
            cursor: {
              type: 'string',
              description: 'Cursor for pagination'
            },
            limit: {
              type: 'string',
              default: '1d'
            }
          },
          required: ['channel_id', 'thread_ts']
        }
      },
      {
        name: 'conversations_add_message',
        description: 'Add a message to a public channel, private channel, or DM',
        inputSchema: {
          type: 'object',
          properties: {
            channel_id: {
              type: 'string',
              description: 'ID of the channel'
            },
            thread_ts: {
              type: 'string',
              description: 'Optional thread timestamp to reply to'
            },
            payload: {
              type: 'string',
              description: 'Message payload'
            },
            content_type: {
              type: 'string',
              default: 'text/markdown',
              enum: ['text/markdown', 'text/plain']
            }
          },
          required: ['channel_id', 'payload']
        }
      }
    ];
  }

  async handleConversationsHistory(args: any): Promise<any> {
    try {
      const { channel_id, include_activity_messages = false, cursor, limit = '1d' } = args;
      
      // Resolve channel ID
      const channelId = this.slackClient.resolveChannelId(
        channel_id, 
        this.cacheManager.getChannelsCache()
      );

      // Parse limit (can be time-based like '1d' or count-based like '50')
      const { limitCount, oldest } = this.parseLimit(limit);

      const response = await this.slackClient.conversationsHistory({
        channel: channelId,
        cursor,
        limit: limitCount,
        oldest
      });

      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch conversation history');
      }

      // Enrich messages with user data
      const enrichedMessages = this.slackClient.enrichMessagesWithUserData(
        response.messages,
        this.cacheManager.getUsersCache()
      );

      // Filter activity messages if requested
      const filteredMessages = include_activity_messages 
        ? enrichedMessages 
        : enrichedMessages.filter(msg => msg.type === 'message' && msg.text);

      return {
        messages: filteredMessages,
        has_more: response.has_more,
        next_cursor: response.response_metadata?.next_cursor
      };
    } catch (error) {
      logger.error('Error in conversations_history:', error);
      throw error;
    }
  }

  async handleConversationsReplies(args: any): Promise<any> {
    try {
      const { channel_id, thread_ts, include_activity_messages = false, cursor, limit = '1d' } = args;
      
      const channelId = this.slackClient.resolveChannelId(
        channel_id, 
        this.cacheManager.getChannelsCache()
      );

      const { limitCount } = this.parseLimit(limit);

      const response = await this.slackClient.conversationsReplies({
        channel: channelId,
        ts: thread_ts,
        cursor,
        limit: limitCount
      });

      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch conversation replies');
      }

      const enrichedMessages = this.slackClient.enrichMessagesWithUserData(
        response.messages,
        this.cacheManager.getUsersCache()
      );

      const filteredMessages = include_activity_messages 
        ? enrichedMessages 
        : enrichedMessages.filter(msg => msg.type === 'message' && msg.text);

      return {
        messages: filteredMessages,
        has_more: response.has_more,
        next_cursor: response.response_metadata?.next_cursor
      };
    } catch (error) {
      logger.error('Error in conversations_replies:', error);
      throw error;
    }
  }

  async handleAddMessage(args: any): Promise<any> {
    try {
      const { channel_id, thread_ts, payload, content_type = 'text/markdown' } = args;
      
      const channelId = this.slackClient.resolveChannelId(
        channel_id, 
        this.cacheManager.getChannelsCache()
      );

      // Process payload based on content type
      let text = payload;
      if (content_type === 'text/markdown') {
        // Convert basic markdown to Slack formatting
        text = this.convertMarkdownToSlack(payload);
      }

      const response = await this.slackClient.postMessage({
        channel: channelId,
        text,
        thread_ts,
        as_user: true
      });

      if (!response.ok) {
        throw new Error(response.error || 'Failed to post message');
      }

      return {
        success: true,
        message: 'Message posted successfully',
        ts: (response as any).ts
      };
    } catch (error) {
      logger.error('Error in conversations_add_message:', error);
      throw error;
    }
  }

  private parseLimit(limit: string): { limitCount?: number; oldest?: string } {
    // If it's a number, use as count
    if (/^\d+$/.test(limit)) {
      return { limitCount: parseInt(limit) };
    }

    // If it's time-based (1d, 7d, 30d, etc.)
    const timeMatch = limit.match(/^(\d+)([dwmy])$/);
    if (timeMatch) {
      const [, amount, unit] = timeMatch;
      const now = Date.now();
      let milliseconds = 0;

      switch (unit) {
        case 'd': milliseconds = parseInt(amount) * 24 * 60 *
        ```typescript
        case 'd': milliseconds = parseInt(amount) * 24 * 60 * 60 * 1000; break;
        case 'w': milliseconds = parseInt(amount) * 7 * 24 * 60 * 60 * 1000; break;
        case 'm': milliseconds = parseInt(amount) * 30 * 24 * 60 * 60 * 1000; break;
        case 'y': milliseconds = parseInt(amount) * 365 * 24 * 60 * 60 * 1000; break;
      }

      const oldest = Math.floor((now - milliseconds) / 1000).toString();
      return { oldest };
    }

    // Default to 1 day
    return { oldest: Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000).toString() };
  }

  private convertMarkdownToSlack(markdown: string): string {
    return markdown
      .replace(/\*\*(.*?)\*\*/g, '*$1*') // Bold
      .replace(/\*(.*?)\*/g, '_$1_')     // Italic
      .replace(/`(.*?)`/g, '`$1`')       // Code (same)
      .replace(/```([\s\S]*?)```/g, '```$1```'); // Code block (same)
  }
}
```

**src/tools/channels.ts**:
```typescript
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SlackClient } from '../slack/client.js';
import { CacheManager } from '../cache/manager.js';
import { logger } from '../utils/logger.js';

export class ChannelTools {
  constructor(
    private slackClient: SlackClient,
    private cacheManager: CacheManager
  ) {}

  getTools(): Tool[] {
    return [
      {
        name: 'channels_list',
        description: 'Get list of channels',
        inputSchema: {
          type: 'object',
          properties: {
            channel_types: {
              type: 'string',
              description: 'Comma-separated channel types: mpim,im,public_channel,private_channel',
              default: 'public_channel,private_channel'
            },
            sort: {
              type: 'string',
              description: 'Sort by popularity (number of members)',
              enum: ['popularity']
            },
            limit: {
              type: 'number',
              default: 100,
              minimum: 1,
              maximum: 1000
            },
            cursor: {
              type: 'string',
              description: 'Cursor for pagination'
            }
          }
        }
      }
    ];
  }

  async handleChannelsList(args: any): Promise<any> {
    try {
      const { 
        channel_types = 'public_channel,private_channel', 
        sort, 
        limit = 100, 
        cursor 
      } = args;

      // Parse channel types
      const types = channel_types.split(',').map((t: string) => t.trim());
      const slackTypes = this.convertToSlackTypes(types);

      const response = await this.slackClient.conversationsList({
        cursor,
        limit,
        types: slackTypes.join(','),
        exclude_archived: true
      });

      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch channels list');
      }

      let channels = response.channels;

      // Filter by requested types
      channels = channels.filter(channel => {
        if (types.includes('public_channel') && channel.is_channel && !channel.is_private) return true;
        if (types.includes('private_channel') && channel.is_private) return true;
        if (types.includes('im') && channel.is_im) return true;
        if (types.includes('mpim') && channel.is_mpim) return true;
        return false;
      });

      // Sort by popularity if requested
      if (sort === 'popularity') {
        channels.sort((a, b) => (b.num_members || 0) - (a.num_members || 0));
      }

      // Update cache
      this.cacheManager.setChannels(channels);

      return {
        channels: channels.map(channel => ({
          id: channel.id,
          name: channel.name,
          topic: channel.topic?.value || '',
          purpose: channel.purpose?.value || '',
          memberCount: channel.num_members || 0,
          is_private: channel.is_private || false,
          is_archived: channel.is_archived || false,
          is_im: channel.is_im || false,
          is_mpim: channel.is_mpim || false
        })),
        next_cursor: response.response_metadata?.next_cursor
      };
    } catch (error) {
      logger.error('Error in channels_list:', error);
      throw error;
    }
  }

  private convertToSlackTypes(types: string[]): string[] {
    const mapping: Record<string, string> = {
      'public_channel': 'public_channel',
      'private_channel': 'private_channel',
      'im': 'im',
      'mpim': 'mpim'
    };

    return types.map(type => mapping[type]).filter(Boolean);
  }
}
```

**src/tools/search.ts**:
```typescript
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SlackClient } from '../slack/client.js';
import { CacheManager } from '../cache/manager.js';
import { logger } from '../utils/logger.js';

export class SearchTools {
  constructor(
    private slackClient: SlackClient,
    private cacheManager: CacheManager
  ) {}

  getTools(): Tool[] {
    return [
      {
        name: 'search_messages',
        description: 'Search messages in channels, threads, and DMs',
        inputSchema: {
          type: 'object',
          properties: {
            search_query: {
              type: 'string',
              description: 'Search query to filter messages or full Slack message URL'
            },
            filter_in_channel: {
              type: 'string',
              description: 'Filter messages in specific channel by ID or name'
            },
            filter_in_im_or_mpim: {
              type: 'string',
              description: 'Filter messages in DM/MPIM by ID or name'
            },
            filter_users_with: {
              type: 'string',
              description: 'Filter messages with specific user by ID or name'
            },
            filter_users_from: {
              type: 'string',
              description: 'Filter messages from specific user by ID or name'
            },
            filter_date_before: {
              type: 'string',
              description: 'Filter messages before date (YYYY-MM-DD, Yesterday, Today)'
            },
            filter_date_after: {
              type: 'string',
              description: 'Filter messages after date (YYYY-MM-DD, Yesterday, Today)'
            },
            filter_date_on: {
              type: 'string',
              description: 'Filter messages on specific date'
            },
            filter_date_during: {
              type: 'string',
              description: 'Filter messages during period (July, Yesterday, Today)'
            },
            filter_threads_only: {
              type: 'boolean',
              default: false,
              description: 'Include only messages from threads'
            },
            cursor: {
              type: 'string',
              description: 'Cursor for pagination'
            },
            limit: {
              type: 'number',
              default: 20,
              minimum: 1,
              maximum: 100
            }
          }
        }
      }
    ];
  }

  async handleSearchMessages(args: any): Promise<any> {
    try {
      const {
        search_query,
        filter_in_channel,
        filter_in_im_or_mpim,
        filter_users_with,
        filter_users_from,
        filter_date_before,
        filter_date_after,
        filter_date_on,
        filter_date_during,
        filter_threads_only = false,
        cursor,
        limit = 20
      } = args;

      // Check if search_query is a Slack message URL
      if (this.isSlackMessageUrl(search_query)) {
        return await this.handleSlackUrlSearch(search_query);
      }

      // Build search query with filters
      let query = search_query || '';

      // Add channel filter
      if (filter_in_channel) {
        const channel = this.resolveChannel(filter_in_channel);
        query += ` in:${channel.name}`;
      }

      // Add user filters
      if (filter_users_from) {
        const user = this.resolveUser(filter_users_from);
        query += ` from:@${user.name}`;
      }

      if (filter_users_with) {
        const user = this.resolveUser(filter_users_with);
        query += ` to:@${user.name}`;
      }

      // Add date filters
      if (filter_date_before) {
        const date = this.parseDate(filter_date_before);
        query += ` before:${date}`;
      }

      if (filter_date_after) {
        const date = this.parseDate(filter_date_after);
        query += ` after:${date}`;
      }

      if (filter_date_on) {
        const date = this.parseDate(filter_date_on);
        query += ` on:${date}`;
      }

      if (filter_date_during) {
        const date = this.parseDate(filter_date_during);
        query += ` during:${date}`;
      }

      if (filter_threads_only) {
        query += ` has:thread`;
      }

      const response = await this.slackClient.searchMessages({
        query: query.trim(),
        count: limit,
        sort: 'timestamp',
        sort_dir: 'desc'
      });

      if (!response.ok) {
        throw new Error(response.error || 'Failed to search messages');
      }

      // Enrich messages with user data
      const enrichedMessages = this.slackClient.enrichMessagesWithUserData(
        response.messages.matches,
        this.cacheManager.getUsersCache()
      );

      return {
        messages: enrichedMessages,
        total: response.messages.total,
        query: query.trim()
      };
    } catch (error) {
      logger.error('Error in search_messages:', error);
      throw error;
    }
  }

  private isSlackMessageUrl(url: string): boolean {
    return /^https:\/\/\w+\.slack\.com\/archives\/[A-Z0-9]+\/p\d+/.test(url);
  }

  private async handleSlackUrlSearch(url: string): Promise<any> {
    // Parse Slack URL to extract channel and timestamp
    const match = url.match(/\/archives\/([A-Z0-9]+)\/p(\d+)/);
    if (!match) {
      throw new Error('Invalid Slack message URL');
    }

    const [, channelId, timestamp] = match;
    const ts = `${timestamp.slice(0, -6)}.${timestamp.slice(-6)}`;

    try {
      // Fetch the specific message
      const response = await this.slackClient.conversationsHistory({
        channel: channelId,
        latest: ts,
        oldest: ts,
        limit: 1
      });

      if (!response.ok || response.messages.length === 0) {
        throw new Error('Message not found');
      }

      const enrichedMessages = this.slackClient.enrichMessagesWithUserData(
        response.messages,
        this.cacheManager.getUsersCache()
      );

      return {
        messages: enrichedMessages,
        total: 1,
        query: url
      };
    } catch (error) {
      logger.error('Error fetching message from URL:', error);
      throw error;
    }
  }

  private resolveChannel(identifier: string) {
    const channel = this.cacheManager.findChannelByName(identifier) || 
                   this.cacheManager.getChannel(identifier);
    if (!channel) {
      throw new Error(`Channel not found: ${identifier}`);
    }
    return channel;
  }

  private resolveUser(identifier: string) {
    const user = this.cacheManager.findUserByName(identifier) || 
                this.cacheManager.getUser(identifier);
    if (!user) {
      throw new Error(`User not found: ${identifier}`);
    }
    return user;
  }

  private parseDate(dateStr: string): string {
    // Handle special cases
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    switch (dateStr.toLowerCase()) {
      case 'today':
        return today.toISOString().split('T')[0];
      case 'yesterday':
        return yesterday.toISOString().split('T')[0];
      default:
        // Try to parse as YYYY-MM-DD or other formats
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          throw new Error(`Invalid date format: ${dateStr}`);
        }
        return date.toISOString().split('T')[0];
    }
  }
}
```

**src/tools/index.ts**:
```typescript
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SlackClient } from '../slack/client.js';
import { CacheManager } from '../cache/manager.js';
import { ConversationTools } from './conversations.js';
import { ChannelTools } from './channels.js';
import { SearchTools } from './search.js';

export class ToolsRegistry {
  private conversationTools: ConversationTools;
  private channelTools: ChannelTools;
  private searchTools: SearchTools;

  constructor(slackClient: SlackClient, cacheManager: CacheManager) {
    this.conversationTools = new ConversationTools(slackClient, cacheManager);
    this.channelTools = new ChannelTools(slackClient, cacheManager);
    this.searchTools = new SearchTools(slackClient, cacheManager);
  }

  getAllTools(): Tool[] {
    return [
      ...this.conversationTools.getTools(),
      ...this.channelTools.getTools(),
      ...this.searchTools.getTools()
    ];
  }

  async handleToolCall(name: string, args: any): Promise<any> {
    switch (name) {
      // Conversation tools
      case 'conversations_history':
        return await this.conversationTools.handleConversationsHistory(args);
      case 'conversations_replies':
        return await this.conversationTools.handleConversationsReplies(args);
      case 'conversations_add_message':
        return await this.conversationTools.handleAddMessage(args);

      // Channel tools
      case 'channels_list':
        return await this.channelTools.handleChannelsList(args);

      // Search tools
      case 'search_messages':
        return await this.searchTools.handleSearchMessages(args);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}
```

## 5. MCP Server Implementation

**src/server.ts**:
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { SlackClient } from './slack/client.js';
import { CacheManager } from './cache/manager.js';
import { ToolsRegistry } from './tools/index.js';
import { config } from './utils/config.js';
import { logger } from './utils/logger.js';

export class SlackMCPServer {
  private server: Server;
  private slackClient: SlackClient;
  private cacheManager: CacheManager;
  private toolsRegistry: ToolsRegistry;

  constructor() {
    this.server = new Server({
      name: 'slack-mcp-server',
      version: '1.0.0',
      description: 'Slack MCP Server with Browser Token Authentication'
    }, {
      capabilities: {
        tools: {},
        resources: {}
      }
    });

    this.slackClient = new SlackClient();
    this.cacheManager = new CacheManager();
    this.toolsRegistry = new ToolsRegistry(this.slackClient, this.cacheManager);

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Tools handlers
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.toolsRegistry.getAllTools()
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        const result = await this.toolsRegistry.handleToolCall(name, args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        logger.error(`Error executing tool ${name}:`, error);
        return {
          content: [
            {
              type: 'text', 
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    });

    // Resources handlers
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'slack://workspace/channels',
            mimeType: 'text/csv',
            name: 'Channels CSV',
            description: 'CSV directory of all channels in the workspace'
          },
          {
            uri: 'slack://workspace/users',
            mimeType: 'text/csv', 
            name: 'Users CSV',
            description: 'CSV directory of all users in the workspace'
          }
        ]
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      try {
        if (uri === 'slack://workspace/channels') {
          return {
            contents: [
              {
                uri,
                mimeType: 'text/csv',
                text: await this.generateChannelsCSV()
              }
            ]
          };
        } else if (uri === 'slack://workspace/users') {
          return {
            contents: [
              {
                uri,
                mimeType: 'text/csv',
                text: await this.generateUsersCSV()
              }
            ]
          };
        } else {
          throw new Error(`Unknown resource: ${uri}`);
        }
      } catch (error) {
        logger.error(`Error reading resource ${uri}:`, error);
        throw error;
      }
    });
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Slack MCP Server...');

    try {
      // Test authentication
      const authResponse = await this.slackClient.authTest();
      if (!authResponse.ok) {
        throw new Error(`Authentication failed: ${authResponse.error}`);
      }
      logger.info('Authentication successful');

      // Load caches
      await this.cacheManager.loadCaches();

      // Update caches if empty
      await this.updateCachesIfNeeded();

      logger.info('Slack MCP Server initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Slack MCP Server:', error);
      throw error;
    }
  }

  async start(): Promise<void> {
    await this.initialize();
    
    // Setup graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await this.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await this.shutdown();
      process.exit(0);
    });

    logger.info('Slack MCP Server is ready to receive requests');
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Slack MCP Server...');
    
    try {
      // Save caches
      await this.cacheManager.saveCaches();
      logger.info('Caches saved successfully');
    } catch (error) {
      logger.error('Error saving caches during shutdown:', error);
    }
  }

  getServer(): Server {
    return this.server;
  }

  private async updateCachesIfNeeded(): Promise<void> {
    const stats = this.cacheManager.getStats();
    
    // Update users cache if empty
    if (stats.usersCount === 0) {
      logger.info('Users cache is empty, fetching users...');
      await this.fetchAndCacheUsers();
    }

    // Update channels cache if empty
    if (stats.channelsCount === 0) {
      logger.info('Channels cache is empty, fetching channels...');
      await this.fetchAndCacheChannels();
    }
  }

  private async fetchAndCacheUsers(): Promise<void> {
    try {
      let cursor: string | undefined;
      let allUsers: any[] = [];

      do {
        const response = await this.slackClient.usersList({ cursor, limit: 200 });
        if (!response.ok) {
          throw new Error(response.error || 'Failed to fetch users');
        }

        allUsers = allUsers.concat(response.members);
        cursor = response.response_metadata?.next_cursor;
      } while (cursor);

      this.cacheManager.setUsers(allUsers);
      await this.cacheManager.saveCaches();
      
      logger.info(`Cached ${allUsers.length} users`);
    } catch (error) {
      logger.error('Error fetching users:', error);
    }
  }

  private async fetchAndCacheChannels(): Promise<void> {
    try {
      let cursor: string | undefined;
      let allChannels: any[] = [];

      do {
        const response = await this.slackClient.conversationsList({ 
          cursor, 
          limit: 200,
          types: 'public_channel,private_channel,im,mpim'
        });
        if (!response.ok) {
          throw new Error(response.error || 'Failed to fetch channels');
        }

        allChannels = allChannels.concat(response.channels);
        cursor = response.response_metadata?.next_cursor;
      } while (cursor);

      this.cacheManager.setChannels(allChannels);
      await this.cacheManager.saveCaches();
      
      logger.info(`Cached ${allChannels.length} channels`);
    } catch (error) {
      logger.error('Error fetching channels:', error);
    }
  }

  private async generateChannelsCSV(): Promise<string> {
    const channels = Array.from(this.cacheManager.getChannelsCache().values());
    
    const csvLines = [
      'id,name,topic,purpose,memberCount'
    ];

    for (const channel of channels) {
      const line = [
        channel.id,
        channel.name || '',
        (channel.topic?.value || '').replace(/,/g, ';'),
        (channel.purpose?.value || '').replace(/,/g, ';'),
        channel.num_members || 0
      ].join(',');
      csvLines.push(line);
    }

    return csvLines.join('\n');
  }

  private async generateUsersCSV(): Promise<string> {
    const users = Array.from(this.cacheManager.getUsersCache().values());
    
    const csvLines = [
      'userID,userName,realName'
    ];

    for (const user of users) {
      const line = [
        user.id,
        user.name || '',
        (user.real_name || '').replace(/,/g, ';')
      ].join(',');
      csvLines.push(line);
    }

    return csvLines.join('\n');
  }
}
```

## 6. Transport Layer

**src/transport/stdio.ts**:
```typescript
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SlackMCPServer } from '../server.js';
import { logger } from '../utils/logger.js';

export async function startStdioTransport(): Promise<void> {
  logger.info('Starting Stdio transport...');
  
  const mcpServer = new SlackMCPServer();
  await mcpServer.start();
  
  const transport = new StdioServerTransport();
  await mcpServer.getServer().connect(transport);
  
  logger.info('Stdio transport started successfully');
}
```

**src/transport/sse.ts**:
```typescript
import express from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { SlackMCPServer } from '../server.js';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

export async function startSSETransport(): Promise<void> {
  logger.info('Starting SSE transport...');
  
  const app = express();
  const mcpServer = new SlackMCPServer();
  await mcpServer.start();

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // SSE endpoint
  app.get('/sse', async (req, res) => {
    logger.info('New SSE connection');
    
    const transport = new SSEServerTransport('/sse', res);
    await mcpServer.getServer().connect(transport);
  });

  const server = app.listen(config.port, config.host, () => {
    logger.info(`SSE transport started on ${config.host}:${config.port}`);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Shutting down SSE server...');
    server.close(() => {
      process.exit(0);
    });
  });
}
```

## 7. Main Entry Point

**src/index.ts**:
```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import { config, validateConfig } from './utils/config.js';
import { logger } from './utils/logger.js';
import { startStdioTransport } from './transport/stdio.js';
import { startSSETransport } from './transport/sse.js';

const program = new Command();

program
  .name('slack-mcp-server')
  .description('Slack MCP Server with Browser Token Authentication')
  .version('1.0.0');

program
  .option('-t, --transport <type>', 'Transport type (stdio|sse)', 'stdio')
  .option('-p, --port <port>', 'Port for SSE transport', '13080')
  .option('-h, --host <host>', 'Host for SSE transport', '127.0.0.1')
  .action(async (options) => {
    try {
      // Override config with CLI options
      if (options.transport) config.transport = options.transport;
      if (options.port) config.port = parseInt(options.port);
      if (options.host) config.host = options.host;

      // Validate configuration
      validateConfig();

      logger.info('Starting Slack MCP Server', {
        transport: config.transport,
        port: config.port,
        host: config.host
      });

      // Start appropriate transport
      if (config.transport === 'sse') {
        await startSSETransport();
      } else {
        await startStdioTransport();
      }
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  });

program.parse();
```

## 8. Configuration Files

**src/.env.example**:
```bash
# Authentication (required - browser tokens only)
SLACK_MCP_XOXC_TOKEN=xoxc-your-token-here
SLACK_MCP_XOXD_TOKEN=xoxd-your-cookie-here

# Server configuration
SLACK_MCP_PORT=13080
SLACK_MCP_HOST=127.0.0.1
SLACK_MCP_TRANSPORT=stdio

# Features
SLACK_MCP_ADD_MESSAGE_TOOL=false
SLACK_MCP_ADD_MESSAGE_MARK=false
SLACK_MCP_ADD_MESSAGE_UNFURLING=false

# Cache
SLACK_MCP_USERS_CACHE=.users_cache.json
SLACK_MCP_CHANNELS_CACHE=.channels_cache_v2.json

# Proxy & Security (optional)
# SLACK_MCP_PROXY=http://proxy:8080
# SLACK_MCP_USER_AGENT=Custom-Agent
# SLACK_MCP_CUSTOM_TLS=false

# Logging
SLACK_MCP_LOG_LEVEL=info
```

## 9. Build & Usage Instructions

**Build the project**:
```bash
npm install
npm run build
```

**Run locally**:
```bash
# Copy environment template
cp src/.env.example .env

# Edit .env with your tokens
nano .env

# Run with stdio transport
npm start -- --transport stdio

# Run with SSE transport  
npm start -- --transport sse --port 13080
```

**Integration with Claude Desktop**:
```json
{
  "mcpServers": {
    "slack": {
      "command": "node",
      "args": ["/path/to/your/project/dist/index.js", "--transport", "stdio"],
      "env": {
        "SLACK_MCP_XOXC_TOKEN": "xoxc-your-token",
        "SLACK_MCP_XOXD_TOKEN": "xoxd-your-token"
      }
    }
  }
}
```

Đây là implementation đầy đủ của Slack MCP Server bằng TypeScript/Node.js với stealth mode authentication. Server này cung cấp tất cả các tính năng chính như fetch messages, search, list channels, và resources, đồng thời sử dụng browser tokens để bypass các hạn chế của Slack workspace.