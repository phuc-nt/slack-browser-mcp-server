# Sprint 4.2: Slack Data Tools
> **Phase 4 - Tool-Only Architecture: Slack Integration**  
> **Duration**: Aug 10-11, 2025 (2 days) | **Target**: Convert Slack resources to advanced query tools

## 📋 Sprint Overview

**Sprint 4.2 Goal**: Convert 3 core Slack resources thành advanced query tools với enhanced filtering, pagination, và real-time capabilities.

### 🎯 Sprint Objectives

1. **Slack Resource Migration**: Convert 3 Slack resources → 3 advanced tools
2. **Enhanced Filtering**: Add sophisticated parameter support
3. **Pagination Support**: Implement cursor-based pagination
4. **Real-time Capabilities**: Add live data refresh options
5. **Performance Optimization**: Implement intelligent caching strategies

---

## 📊 Migration Mapping

### Resource → Tool Conversion

| Current Resource | New Tool | Enhanced Capabilities |
|------------------|----------|----------------------|
| `slack://workspace/channels` | `get_channels` | Type filtering, pagination, archived channels, member counts |
| `slack://workspace/users` | `get_users` | Status filtering, presence info, pagination, detailed profiles |
| `slack://channels/{id}/history` | `get_channel_history` | Advanced pagination, message filtering, thread detection |

---

## 🛠️ Implementation Plan

### Day 1: Channels & Users Tools (8 hours)

#### Morning (4 hours): Get Channels Tool
- **Hour 1-2**: Design enhanced channel query capabilities
- **Hour 3-4**: Implement get_channels tool với full feature set

**Enhanced Get Channels Tool:**
```typescript
// src/tools/slack/get-channels.ts
export class GetChannelsTool extends BaseQueryTool {
  protected cacheEnabled = true;
  protected cacheTTL = 300; // 5 minutes for channel list
  
  getDefinition(): SlackTool {
    return {
      name: 'get_channels',
      description: 'Get comprehensive list of accessible Slack channels với advanced filtering',
      category: 'slack',
      requiresAuth: true,
      tags: ['channels', 'workspace', 'listing'],
      inputSchema: {
        type: 'object',
        properties: {
          // Basic filters
          type: {
            type: 'string',
            enum: ['public', 'private', 'mpim', 'im', 'all'],
            description: 'Channel types to include',
            default: 'all'
          },
          
          // Pagination
          limit: {
            type: 'number',
            minimum: 1,
            maximum: 1000,
            description: 'Maximum number of channels to return',
            default: 100
          },
          cursor: {
            type: 'string',
            description: 'Pagination cursor for next page'
          },
          
          // Advanced filtering
          include_archived: {
            type: 'boolean',
            description: 'Include archived channels',
            default: false
          },
          member_only: {
            type: 'boolean', 
            description: 'Only channels user is member of',
            default: false
          },
          name_pattern: {
            type: 'string',
            description: 'Filter channels by name pattern (regex supported)'
          },
          
          // Data enrichment
          include_member_count: {
            type: 'boolean',
            description: 'Include member count for each channel',
            default: false
          },
          include_purpose: {
            type: 'boolean',
            description: 'Include channel purpose/topic',
            default: true
          },
          include_latest_message: {
            type: 'boolean',
            description: 'Include latest message timestamp',
            default: false
          },
          
          // Sorting
          sort_by: {
            type: 'string',
            enum: ['name', 'created', 'member_count', 'activity'],
            description: 'Sort channels by field',
            default: 'name'
          },
          sort_order: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'asc'
          }
        }
      }
    };
  }
  
  async executeQuery(args: GetChannelsArgs): Promise<ChannelsResponse> {
    const client = await this.initializeSlackClient();
    
    // Build Slack API request parameters
    const apiParams = this.buildApiParams(args);
    
    // Fetch channels from Slack API
    const response = await client.getConversations(apiParams);
    if (!response.ok) {
      throw new Error(`Failed to fetch channels: ${response.error}`);
    }
    
    let channels = response.channels || [];
    
    // Apply client-side filters
    channels = await this.applyFilters(channels, args);
    
    // Enrich data if requested
    if (args.include_member_count || args.include_latest_message) {
      channels = await this.enrichChannelData(channels, args);
    }
    
    // Sort results
    channels = this.sortChannels(channels, args);
    
    return {
      channels: channels,
      total_count: channels.length,
      has_more: !!response.response_metadata?.next_cursor,
      next_cursor: response.response_metadata?.next_cursor,
      filters_applied: this.getAppliedFilters(args),
      metadata: {
        api_calls: await this.getApiCallCount(),
        cache_source: this.getCacheSource(),
        enriched_fields: this.getEnrichedFields(args)
      }
    };
  }
  
  private buildApiParams(args: GetChannelsArgs): ConversationsListParams {
    const types = this.mapChannelTypes(args.type);
    
    return {
      types: types.join(','),
      limit: Math.min(args.limit, 1000),
      cursor: args.cursor,
      exclude_archived: !args.include_archived
    };
  }
  
  private mapChannelTypes(type: string): string[] {
    const typeMap = {
      'public': ['public_channel'],
      'private': ['private_channel'],
      'mpim': ['mpim'],
      'im': ['im'],
      'all': ['public_channel', 'private_channel', 'mpim', 'im']
    };
    return typeMap[type] || typeMap['all'];
  }
  
  private async applyFilters(
    channels: SlackChannel[], 
    args: GetChannelsArgs
  ): Promise<SlackChannel[]> {
    let filtered = channels;
    
    // Name pattern filter
    if (args.name_pattern) {
      const pattern = new RegExp(args.name_pattern, 'i');
      filtered = filtered.filter(channel => 
        pattern.test(channel.name || '')
      );
    }
    
    // Member only filter
    if (args.member_only) {
      filtered = filtered.filter(channel => channel.is_member === true);
    }
    
    return filtered;
  }
  
  private async enrichChannelData(
    channels: SlackChannel[], 
    args: GetChannelsArgs
  ): Promise<EnrichedChannel[]> {
    const enriched: EnrichedChannel[] = [];
    const client = await this.initializeSlackClient();
    
    for (const channel of channels) {
      const enrichedChannel: EnrichedChannel = { ...channel };
      
      // Add member count
      if (args.include_member_count) {
        try {
          const info = await client.getConversationInfo(channel.id);
          enrichedChannel.member_count = info.channel?.num_members || 0;
        } catch (error) {
          logger.warn(`Failed to get member count for ${channel.id}`, { error });
          enrichedChannel.member_count = null;
        }
      }
      
      // Add latest message timestamp
      if (args.include_latest_message) {
        try {
          const history = await client.getConversationHistory(channel.id, { limit: 1 });
          if (history.messages && history.messages.length > 0) {
            enrichedChannel.latest_message_ts = history.messages[0].ts;
          }
        } catch (error) {
          logger.warn(`Failed to get latest message for ${channel.id}`, { error });
          enrichedChannel.latest_message_ts = null;
        }
      }
      
      enriched.push(enrichedChannel);
    }
    
    return enriched;
  }
}
```

#### Afternoon (4 hours): Get Users Tool
- **Hour 5-6**: Design user query capabilities
- **Hour 7-8**: Implement get_users tool với presence information

**Enhanced Get Users Tool:**
```typescript
// src/tools/slack/get-users.ts
export class GetUsersTool extends BaseQueryTool {
  protected cacheEnabled = true;
  protected cacheTTL = 600; // 10 minutes for user list
  
  getDefinition(): SlackTool {
    return {
      name: 'get_users',
      description: 'Get comprehensive list of workspace users với status và profile information',
      category: 'slack', 
      requiresAuth: true,
      tags: ['users', 'workspace', 'profiles', 'presence'],
      inputSchema: {
        type: 'object',
        properties: {
          // Basic filtering
          active_only: {
            type: 'boolean',
            description: 'Only return active (non-deleted) users',
            default: true
          },
          include_bots: {
            type: 'boolean',
            description: 'Include bot users',
            default: false
          },
          
          // Pagination
          limit: {
            type: 'number',
            minimum: 1,
            maximum: 1000,
            default: 100
          },
          cursor: {
            type: 'string',
            description: 'Pagination cursor'
          },
          
          // Advanced filtering
          name_pattern: {
            type: 'string',
            description: 'Filter users by name/email pattern'
          },
          team_id: {
            type: 'string',
            description: 'Filter by specific team ID'
          },
          
          // Data enrichment
          include_presence: {
            type: 'boolean',
            description: 'Include real-time presence status',
            default: false
          },
          include_profile: {
            type: 'boolean',
            description: 'Include detailed profile information',
            default: true
          },
          include_timezone: {
            type: 'boolean',
            description: 'Include timezone information',
            default: false
          },
          
          // Sorting
          sort_by: {
            type: 'string',
            enum: ['name', 'real_name', 'status', 'created'],
            default: 'name'
          }
        }
      }
    };
  }
  
  async executeQuery(args: GetUsersArgs): Promise<UsersResponse> {
    const client = await this.initializeSlackClient();
    
    // Fetch users from Slack API
    const response = await client.getUsers({
      limit: args.limit,
      cursor: args.cursor,
      include_locale: args.include_timezone
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.error}`);
    }
    
    let users = response.members || [];
    
    // Apply filters
    users = this.applyUserFilters(users, args);
    
    // Enrich with presence if requested
    if (args.include_presence) {
      users = await this.enrichWithPresence(users);
    }
    
    // Sort users
    users = this.sortUsers(users, args);
    
    return {
      users: users,
      total_count: users.length,
      has_more: !!response.response_metadata?.next_cursor,
      next_cursor: response.response_metadata?.next_cursor,
      active_count: users.filter(u => !u.deleted).length,
      bot_count: users.filter(u => u.is_bot).length,
      metadata: {
        filters_applied: this.getUserFiltersApplied(args),
        enrichment: {
          presence_included: args.include_presence,
          profile_included: args.include_profile,
          timezone_included: args.include_timezone
        }
      }
    };
  }
  
  private async enrichWithPresence(users: SlackUser[]): Promise<EnrichedUser[]> {
    const client = await this.initializeSlackClient();
    const enriched: EnrichedUser[] = [];
    
    // Batch presence requests (Slack API allows multiple user IDs)
    const activeUsers = users.filter(u => !u.deleted && !u.is_bot);
    const userIds = activeUsers.map(u => u.id);
    
    try {
      const presenceData = await this.batchGetPresence(userIds);
      
      for (const user of users) {
        const enrichedUser: EnrichedUser = { 
          ...user,
          presence: presenceData[user.id] || null
        };
        enriched.push(enrichedUser);
      }
    } catch (error) {
      logger.warn('Failed to enrich with presence data', { error });
      return users.map(u => ({ ...u, presence: null }));
    }
    
    return enriched;
  }
}
```

### Day 2: Channel History Tool (8 hours)

#### Morning (4 hours): Basic History Implementation
- **Hour 1-2**: Design advanced message retrieval capabilities
- **Hour 3-4**: Implement core get_channel_history functionality

#### Afternoon (4 hours): Advanced Features
- **Hour 5-6**: Add message filtering và thread detection
- **Hour 7-8**: Implement pagination và performance optimization

**Advanced Channel History Tool:**
```typescript
// src/tools/slack/get-channel-history.ts
export class GetChannelHistoryTool extends BaseQueryTool {
  protected cacheEnabled = true;
  protected cacheTTL = 120; // 2 minutes for message history
  
  getDefinition(): SlackTool {
    return {
      name: 'get_channel_history',
      description: 'Get channel message history với advanced filtering và thread detection',
      category: 'slack',
      requiresAuth: true,
      tags: ['messages', 'history', 'channels', 'threads'],
      inputSchema: {
        type: 'object',
        properties: {
          // Required parameters
          channel_id: {
            type: 'string',
            pattern: '^[CDG][A-Z0-9]+$',
            description: 'Channel ID to fetch history from'
          },
          
          // Pagination & limits
          limit: {
            type: 'number',
            minimum: 1,
            maximum: 1000,
            default: 100,
            description: 'Number of messages to return'
          },
          cursor: {
            type: 'string',
            description: 'Pagination cursor for next batch'
          },
          
          // Time-based filtering
          oldest: {
            type: 'string',
            description: 'Start of time range (timestamp or ISO date)'
          },
          latest: {
            type: 'string', 
            description: 'End of time range (timestamp or ISO date)'
          },
          
          // Content filtering
          user_filter: {
            type: 'string',
            description: 'Only messages from specific user ID'
          },
          message_pattern: {
            type: 'string',
            description: 'Filter messages by text pattern (regex)'
          },
          has_attachments: {
            type: 'boolean',
            description: 'Only messages with attachments'
          },
          has_reactions: {
            type: 'boolean',
            description: 'Only messages with reactions'
          },
          
          // Thread handling
          include_threads: {
            type: 'boolean',
            description: 'Include thread replies in results',
            default: false
          },
          thread_ts: {
            type: 'string',
            description: 'Get replies for specific thread only'
          },
          
          // Data enrichment
          include_user_details: {
            type: 'boolean',
            description: 'Include full user profiles for message authors',
            default: false
          },
          include_reaction_details: {
            type: 'boolean', 
            description: 'Include detailed reaction information',
            default: false
          },
          
          // Response format
          format: {
            type: 'string',
            enum: ['full', 'compact', 'minimal'],
            default: 'full',
            description: 'Response detail level'
          }
        },
        required: ['channel_id']
      }
    };
  }
  
  async executeQuery(args: GetChannelHistoryArgs): Promise<ChannelHistoryResponse> {
    const client = await this.initializeSlackClient();
    
    // Validate channel access
    await this.validateChannelAccess(args.channel_id);
    
    let messages: SlackMessage[];
    
    if (args.thread_ts) {
      // Get specific thread replies
      messages = await this.getThreadReplies(args);
    } else {
      // Get channel history
      messages = await this.getChannelMessages(args);
    }
    
    // Apply content filters
    messages = this.applyMessageFilters(messages, args);
    
    // Enrich data if requested
    if (args.include_user_details || args.include_reaction_details) {
      messages = await this.enrichMessageData(messages, args);
    }
    
    // Handle thread detection và inclusion
    const result = await this.processThreads(messages, args);
    
    return {
      channel_id: args.channel_id,
      messages: result.messages,
      threads: result.threads,
      total_count: result.messages.length,
      has_more: result.has_more,
      next_cursor: result.next_cursor,
      time_range: {
        oldest: this.formatTimestamp(args.oldest),
        latest: this.formatTimestamp(args.latest)
      },
      filters_applied: this.getMessageFiltersApplied(args),
      metadata: {
        format: args.format,
        enrichment_level: this.getEnrichmentLevel(args),
        thread_handling: args.include_threads ? 'included' : 'excluded'
      }
    };
  }
  
  private async getChannelMessages(args: GetChannelHistoryArgs): Promise<SlackMessage[]> {
    const client = await this.initializeSlackClient();
    
    const apiParams = {
      channel: args.channel_id,
      limit: args.limit,
      cursor: args.cursor,
      oldest: this.parseTimestamp(args.oldest),
      latest: this.parseTimestamp(args.latest)
    };
    
    const response = await client.getConversationHistory(args.channel_id, apiParams);
    
    if (!response.ok) {
      throw new Error(`Failed to get channel history: ${response.error}`);
    }
    
    return response.messages || [];
  }
  
  private async processThreads(
    messages: SlackMessage[], 
    args: GetChannelHistoryArgs
  ): Promise<ProcessedMessages> {
    const threads: ThreadInfo[] = [];
    const processedMessages = [...messages];
    
    // Identify thread parent messages
    const threadParents = messages.filter(msg => 
      msg.reply_count && msg.reply_count > 0
    );
    
    if (args.include_threads && threadParents.length > 0) {
      // Fetch replies for each thread
      for (const parent of threadParents) {
        try {
          const replies = await this.getThreadReplies({
            ...args,
            thread_ts: parent.ts
          });
          
          threads.push({
            parent_message: parent,
            replies: replies,
            reply_count: parent.reply_count || 0,
            thread_ts: parent.ts
          });
          
          // Add replies to main message list if requested
          processedMessages.push(...replies);
          
        } catch (error) {
          logger.warn(`Failed to fetch thread replies for ${parent.ts}`, { error });
        }
      }
    }
    
    return {
      messages: this.formatMessages(processedMessages, args.format),
      threads: threads,
      has_more: messages.length >= args.limit,
      next_cursor: messages.length > 0 ? messages[messages.length - 1].ts : null
    };
  }
}
```

---

## 🧪 Testing Strategy

### Integration Testing
```typescript
// tests/integration/slack-tools.test.ts
describe('Slack Data Tools Integration', () => {
  let toolRegistry: ToolRegistry;
  
  beforeEach(async () => {
    toolRegistry = new ToolRegistry();
    await toolRegistry.initialize();
  });
  
  describe('get_channels', () => {
    it('should fetch channels with basic parameters', async () => {
      const result = await toolRegistry.executeTool('get_channels', {
        type: 'public',
        limit: 10
      }, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.data.data.channels).toBeInstanceOf(Array);
      expect(result.data.data.channels.length).toBeLessThanOrEqual(10);
    });
    
    it('should apply name pattern filtering', async () => {
      const result = await toolRegistry.executeTool('get_channels', {
        name_pattern: 'general',
        limit: 50
      }, mockContext);
      
      expect(result.success).toBe(true);
      result.data.data.channels.forEach(channel => {
        expect(channel.name).toMatch(/general/i);
      });
    });
    
    it('should include member counts when requested', async () => {
      const result = await toolRegistry.executeTool('get_channels', {
        include_member_count: true,
        limit: 5
      }, mockContext);
      
      expect(result.success).toBe(true);
      result.data.data.channels.forEach(channel => {
        expect(typeof channel.member_count).toBe('number');
      });
    });
  });
  
  describe('get_users', () => {
    it('should fetch active users by default', async () => {
      const result = await toolRegistry.executeTool('get_users', {
        limit: 20
      }, mockContext);
      
      expect(result.success).toBe(true);
      result.data.data.users.forEach(user => {
        expect(user.deleted).toBeFalsy();
      });
    });
    
    it('should include presence when requested', async () => {
      const result = await toolRegistry.executeTool('get_users', {
        include_presence: true,
        limit: 10
      }, mockContext);
      
      expect(result.success).toBe(true);
      result.data.data.users.forEach(user => {
        expect(user).toHaveProperty('presence');
      });
    });
  });
  
  describe('get_channel_history', () => {
    const testChannelId = 'C07UMQ2PR1V';
    
    it('should fetch channel messages', async () => {
      const result = await toolRegistry.executeTool('get_channel_history', {
        channel_id: testChannelId,
        limit: 10
      }, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.data.data.messages).toBeInstanceOf(Array);
      expect(result.data.data.channel_id).toBe(testChannelId);
    });
    
    it('should handle thread inclusion', async () => {
      const result = await toolRegistry.executeTool('get_channel_history', {
        channel_id: testChannelId,
        include_threads: true,
        limit: 5
      }, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.data.data).toHaveProperty('threads');
    });
    
    it('should apply message filters', async () => {
      const result = await toolRegistry.executeTool('get_channel_history', {
        channel_id: testChannelId,
        has_reactions: true,
        limit: 10
      }, mockContext);
      
      expect(result.success).toBe(true);
      result.data.data.messages.forEach(message => {
        expect(message.reactions).toBeDefined();
        expect(message.reactions.length).toBeGreaterThan(0);
      });
    });
  });
});
```

### Performance Testing
```typescript
// tests/performance/slack-tools-bench.test.ts
describe('Slack Tools Performance', () => {
  let benchmarks: SlackToolsBenchmarks;
  
  beforeEach(() => {
    benchmarks = new SlackToolsBenchmarks();
  });
  
  it('should meet response time targets', async () => {
    const results = await benchmarks.runSlackToolsBenchmarks();
    
    expect(results.get_channels.avg_response_time).toBeLessThan(1000);
    expect(results.get_users.avg_response_time).toBeLessThan(1500);
    expect(results.get_channel_history.avg_response_time).toBeLessThan(2000);
  });
  
  it('should achieve good cache performance', async () => {
    const results = await benchmarks.runCachingBenchmarks();
    
    expect(results.get_channels.cache_hit_ratio).toBeGreaterThan(0.6);
    expect(results.get_users.cache_hit_ratio).toBeGreaterThan(0.7);
  });
});
```

---

## 📊 Success Criteria

### Functional Requirements
- ✅ 3 Slack resources converted to advanced tools
- ✅ Enhanced filtering capabilities operational
- ✅ Pagination support implemented
- ✅ Data enrichment features working
- ✅ Thread detection và handling functional

### Performance Requirements
- ✅ get_channels: <1s response time, >60% cache hit ratio
- ✅ get_users: <1.5s response time, >70% cache hit ratio  
- ✅ get_channel_history: <2s response time, >50% cache hit ratio
- ✅ Memory usage <50MB for typical operations

### Quality Requirements
- ✅ Comprehensive parameter validation
- ✅ Error handling for all Slack API scenarios
- ✅ Complete test coverage for new features
- ✅ Performance benchmarks documented

---

## 🚨 Risk Management

### Technical Risks
1. **Slack API Rate Limits**: Enhanced features increase API calls
   - **Mitigation**: Implement intelligent batching, respect rate limits
   
2. **Data Enrichment Overhead**: Additional API calls for enriched data
   - **Mitigation**: Make enrichment optional, use efficient batching

### Performance Risks  
1. **Memory Usage**: Caching large datasets
   - **Mitigation**: Implement size limits, LRU eviction
   
2. **Response Times**: Complex filtering may slow responses
   - **Mitigation**: Optimize filtering algorithms, use indices

---

## 📈 Performance Targets

### Response Time Targets
```typescript
interface SlackToolsPerformance {
  get_channels: {
    response_time_ms: 800,
    cache_hit_ratio: 65,
    api_calls_per_request: 1.2
  };
  get_users: {
    response_time_ms: 1200,
    cache_hit_ratio: 75,
    api_calls_per_request: 1.5
  };
  get_channel_history: {
    response_time_ms: 1800,
    cache_hit_ratio: 55,
    api_calls_per_request: 2.0
  };
}
```

### Resource Usage Limits
- Memory per tool execution: <20MB
- Concurrent executions: Support 50+ parallel calls
- Cache memory limit: <100MB total
- API rate limit compliance: <80% of Slack limits

---

**🎯 Sprint 4.2 Goal**: Convert Slack resources to powerful, feature-rich query tools với advanced capabilities và optimal performance.

_📅 Created: 2025-08-08 | Target: 2025-08-11 | Status: PLANNED_