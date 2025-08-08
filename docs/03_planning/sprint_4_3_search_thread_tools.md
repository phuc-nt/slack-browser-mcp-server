# Sprint 4.3: Search & Thread Query Tools
> **Phase 4 - Tool-Only Architecture: Advanced Queries**  
> **Duration**: Aug 12-13, 2025 (2 days) | **Target**: Convert search/thread resources to advanced query tools

## 📋 Sprint Overview

**Sprint 4.3 Goal**: Convert 7 search và thread resources thành powerful query tools với advanced search capabilities, thread analysis, và real-time performance optimization.

### 🎯 Sprint Objectives

1. **Search Tool Migration**: Convert 4 search resources → 4 advanced search tools
2. **Thread Tool Migration**: Convert 3 thread resources → 3 thread query tools  
3. **Advanced Search Features**: Implement complex query parsing và relevance ranking
4. **Thread Analytics**: Add thread performance metrics và insights
5. **Query Optimization**: Implement search indexing và caching strategies

---

## 📊 Migration Mapping

### Search Resources → Tools Conversion

| Current Resource | New Tool | Enhanced Capabilities |
|------------------|----------|----------------------|
| `slack://workspace/search` | `search_workspace` | Multi-type search, relevance ranking, filters |
| `slack://search/messages` | `search_messages` | Advanced message search, context, highlighting |
| `slack://search/users` | `search_users` | Fuzzy matching, profile search, status filters |
| `slack://search/channels` | `search_channels` | Name/purpose search, member filters, activity data |

### Thread Resources → Tools Conversion

| Current Resource | New Tool | Enhanced Capabilities |
|------------------|----------|----------------------|
| `slack://workspace/threads` | `get_workspace_threads` | Thread discovery, activity tracking, filters |
| `slack://search/threads` | `search_threads` | Complex thread search, reply analysis, metrics |
| Thread details/replies | `get_thread_details` | Complete thread data, participant analysis, timeline |

---

## 🛠️ Implementation Plan

### Day 1: Search Tools Implementation (8 hours)

#### Morning (4 hours): Workspace & Message Search
- **Hour 1-2**: Implement search_workspace tool với multi-type capabilities
- **Hour 3-4**: Implement search_messages tool với advanced filtering

**Workspace Search Tool:**
```typescript
// src/tools/search/search-workspace.ts
export class SearchWorkspaceTool extends BaseQueryTool {
  protected cacheEnabled = true;
  protected cacheTTL = 180; // 3 minutes for search results
  
  getDefinition(): SlackTool {
    return {
      name: 'search_workspace',
      description: 'Search across entire workspace with multi-type results và relevance ranking',
      category: 'search',
      requiresAuth: true,
      tags: ['search', 'workspace', 'global', 'multi-type'],
      inputSchema: {
        type: 'object',
        properties: {
          // Required search parameters
          query: {
            type: 'string',
            minLength: 1,
            maxLength: 500,
            description: 'Search query string'
          },
          
          // Result type filtering
          types: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['messages', 'files', 'channels', 'users']
            },
            description: 'Types of results to include',
            default: ['messages', 'files', 'channels', 'users']
          },
          
          // Pagination
          limit: {
            type: 'number',
            minimum: 1,
            maximum: 100,
            default: 20,
            description: 'Maximum results per type'
          },
          page: {
            type: 'number',
            minimum: 1,
            default: 1,
            description: 'Page number for pagination'
          },
          
          // Advanced filtering
          in_channels: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limit search to specific channels'
          },
          from_users: {
            type: 'array', 
            items: { type: 'string' },
            description: 'Limit search to specific users'
          },
          date_range: {
            type: 'object',
            properties: {
              after: { type: 'string', description: 'Search after this date' },
              before: { type: 'string', description: 'Search before this date' }
            },
            description: 'Date range filter'
          },
          
          // Search options
          sort_by: {
            type: 'string',
            enum: ['relevance', 'timestamp', 'score'],
            default: 'relevance',
            description: 'Sort order for results'
          },
          highlight: {
            type: 'boolean',
            default: true,
            description: 'Highlight search terms in results'
          },
          include_context: {
            type: 'boolean',
            default: false,
            description: 'Include surrounding context for message results'
          }
        },
        required: ['query']
      }
    };
  }
  
  async executeQuery(args: SearchWorkspaceArgs): Promise<WorkspaceSearchResponse> {
    const client = await this.initializeSlackClient();
    const startTime = Date.now();
    
    // Build search parameters
    const searchParams = this.buildSearchParams(args);
    
    // Execute searches for each requested type
    const results: WorkspaceSearchResults = {
      query: args.query,
      total_results: 0,
      search_time_ms: 0,
      results_by_type: {}
    };
    
    // Execute searches in parallel
    const searchPromises = args.types.map(type => 
      this.executeTypeSearch(type, searchParams)
    );
    
    const searchResults = await Promise.allSettled(searchPromises);
    
    // Process results
    for (let i = 0; i < args.types.length; i++) {
      const type = args.types[i];
      const result = searchResults[i];
      
      if (result.status === 'fulfilled' && result.value) {
        results.results_by_type[type] = result.value;
        results.total_results += result.value.count || 0;
      } else {
        logger.warn(`Search failed for type ${type}`, {
          error: result.status === 'rejected' ? result.reason : 'Unknown error'
        });
        results.results_by_type[type] = { count: 0, items: [] };
      }
    }
    
    // Calculate relevance scores
    if (args.sort_by === 'relevance' || args.sort_by === 'score') {
      results = this.calculateRelevanceScores(results, args.query);
    }
    
    // Add highlighting if requested
    if (args.highlight) {
      results = this.addHighlighting(results, args.query);
    }
    
    results.search_time_ms = Date.now() - startTime;
    
    return {
      ...results,
      pagination: {
        page: args.page,
        limit: args.limit,
        has_more: this.hasMoreResults(results, args),
        total_pages: this.calculateTotalPages(results, args)
      },
      metadata: {
        search_params: searchParams,
        cache_source: this.getCacheSource(),
        performance: {
          search_time_ms: results.search_time_ms,
          api_calls: args.types.length
        }
      }
    };
  }
  
  private async executeTypeSearch(type: string, params: SearchParams): Promise<TypeSearchResult> {
    const client = await this.initializeSlackClient();
    
    switch (type) {
      case 'messages':
        return this.searchMessages(client, params);
      case 'files':
        return this.searchFiles(client, params);
      case 'channels':
        return this.searchChannels(client, params);
      case 'users':
        return this.searchUsers(client, params);
      default:
        throw new Error(`Unsupported search type: ${type}`);
    }
  }
  
  private calculateRelevanceScores(results: WorkspaceSearchResults, query: string): WorkspaceSearchResults {
    const queryTerms = query.toLowerCase().split(/\s+/);
    
    // Calculate relevance scores for each result type
    for (const [type, typeResults] of Object.entries(results.results_by_type)) {
      if (typeResults.items) {
        typeResults.items.forEach((item: any) => {
          item.relevance_score = this.calculateItemRelevance(item, queryTerms, type);
        });
        
        // Sort by relevance score
        typeResults.items.sort((a: any, b: any) => 
          (b.relevance_score || 0) - (a.relevance_score || 0)
        );
      }
    }
    
    return results;
  }
  
  private calculateItemRelevance(item: any, queryTerms: string[], type: string): number {
    let score = 0;
    const text = this.getSearchableText(item, type).toLowerCase();
    
    // Exact phrase match (highest score)
    if (text.includes(queryTerms.join(' '))) {
      score += 100;
    }
    
    // Individual term matches
    queryTerms.forEach(term => {
      if (text.includes(term)) {
        score += 10;
      }
      
      // Bonus for title/name matches
      if (item.name && item.name.toLowerCase().includes(term)) {
        score += 20;
      }
      
      // Bonus for exact word matches
      if (text.match(new RegExp(`\\b${term}\\b`, 'i'))) {
        score += 5;
      }
    });
    
    // Type-specific scoring
    switch (type) {
      case 'channels':
        if (item.is_member) score += 15;
        if (!item.is_archived) score += 10;
        break;
      case 'users':
        if (!item.deleted) score += 10;
        if (item.is_bot === false) score += 5;
        break;
      case 'messages':
        if (item.reply_count > 0) score += 5;
        if (item.reactions && item.reactions.length > 0) score += 3;
        break;
    }
    
    return score;
  }
}
```

**Advanced Message Search Tool:**
```typescript
// src/tools/search/search-messages.ts
export class SearchMessagesTool extends BaseQueryTool {
  protected cacheEnabled = true;
  protected cacheTTL = 120; // 2 minutes for message search
  
  getDefinition(): SlackTool {
    return {
      name: 'search_messages',
      description: 'Advanced message search với context, highlighting, và thread detection',
      category: 'search',
      requiresAuth: true,
      tags: ['search', 'messages', 'content', 'threads'],
      inputSchema: {
        type: 'object',
        properties: {
          // Required search query
          query: {
            type: 'string',
            minLength: 1,
            maxLength: 500,
            description: 'Message search query'
          },
          
          // Channel filtering
          channel: {
            type: 'string',
            pattern: '^[CDG][A-Z0-9]+$',
            description: 'Search within specific channel'
          },
          channels: {
            type: 'array',
            items: { type: 'string', pattern: '^[CDG][A-Z0-9]+$' },
            description: 'Search within multiple channels'
          },
          
          // User filtering
          from_user: {
            type: 'string',
            pattern: '^U[A-Z0-9]+$',
            description: 'Messages from specific user'
          },
          exclude_users: {
            type: 'array',
            items: { type: 'string', pattern: '^U[A-Z0-9]+$' },
            description: 'Exclude messages from these users'
          },
          
          // Content filtering
          has_attachments: {
            type: 'boolean',
            description: 'Only messages with attachments'
          },
          has_reactions: {
            type: 'boolean',
            description: 'Only messages with reactions'
          },
          is_thread_parent: {
            type: 'boolean',
            description: 'Only messages that started threads'
          },
          in_thread: {
            type: 'boolean',
            description: 'Include/exclude thread replies'
          },
          
          // Date filtering
          after: {
            type: 'string',
            description: 'Messages after this timestamp/date'
          },
          before: {
            type: 'string',
            description: 'Messages before this timestamp/date'
          },
          on_date: {
            type: 'string',
            description: 'Messages on specific date (YYYY-MM-DD)'
          },
          
          // Search options
          limit: {
            type: 'number',
            minimum: 1,
            maximum: 1000,
            default: 100,
            description: 'Maximum number of results'
          },
          sort_by: {
            type: 'string',
            enum: ['relevance', 'timestamp', 'score'],
            default: 'relevance'
          },
          sort_order: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'desc'
          },
          
          // Response format
          include_context: {
            type: 'boolean',
            default: false,
            description: 'Include surrounding messages for context'
          },
          context_size: {
            type: 'number',
            minimum: 1,
            maximum: 10,
            default: 2,
            description: 'Number of context messages before/after'
          },
          include_thread_replies: {
            type: 'boolean',
            default: false,
            description: 'Include thread replies in results'
          },
          highlight_terms: {
            type: 'boolean',
            default: true,
            description: 'Highlight search terms in message text'
          }
        },
        required: ['query']
      }
    };
  }
  
  async executeQuery(args: SearchMessagesArgs): Promise<MessageSearchResponse> {
    const client = await this.initializeSlackClient();
    const startTime = Date.now();
    
    // Build search query
    const searchQuery = this.buildMessageSearchQuery(args);
    
    // Execute search
    const response = await client.searchMessages(searchQuery);
    if (!response.ok) {
      throw new Error(`Message search failed: ${response.error}`);
    }
    
    let messages = response.messages?.matches || [];
    
    // Apply additional client-side filters
    messages = this.applyMessageFilters(messages, args);
    
    // Sort results
    messages = this.sortMessages(messages, args);
    
    // Add context if requested
    if (args.include_context) {
      messages = await this.addMessageContext(messages, args);
    }
    
    // Add thread replies if requested
    if (args.include_thread_replies) {
      messages = await this.addThreadReplies(messages, args);
    }
    
    // Add highlighting
    if (args.highlight_terms) {
      messages = this.addMessageHighlighting(messages, args.query);
    }
    
    // Calculate search metrics
    const searchMetrics = this.calculateSearchMetrics(messages, args.query);
    
    return {
      query: args.query,
      messages: messages,
      total_count: messages.length,
      search_time_ms: Date.now() - startTime,
      filters_applied: this.getAppliedFilters(args),
      search_metrics: searchMetrics,
      metadata: {
        search_query: searchQuery,
        sort_by: args.sort_by,
        sort_order: args.sort_order,
        context_included: args.include_context,
        thread_replies_included: args.include_thread_replies,
        highlighting_enabled: args.highlight_terms
      }
    };
  }
  
  private buildMessageSearchQuery(args: SearchMessagesArgs): string {
    let query = args.query;
    
    // Add channel filters
    if (args.channel) {
      query += ` in:#${args.channel}`;
    }
    if (args.channels && args.channels.length > 0) {
      const channelFilter = args.channels.map(c => `in:#${c}`).join(' OR ');
      query += ` (${channelFilter})`;
    }
    
    // Add user filters
    if (args.from_user) {
      query += ` from:@${args.from_user}`;
    }
    if (args.exclude_users && args.exclude_users.length > 0) {
      args.exclude_users.forEach(user => {
        query += ` -from:@${user}`;
      });
    }
    
    // Add content filters
    if (args.has_attachments) {
      query += ' has:attachment';
    }
    if (args.has_reactions) {
      query += ' has:reaction';
    }
    
    // Add date filters
    if (args.after) {
      query += ` after:${this.formatSearchDate(args.after)}`;
    }
    if (args.before) {
      query += ` before:${this.formatSearchDate(args.before)}`;
    }
    if (args.on_date) {
      query += ` on:${args.on_date}`;
    }
    
    return query.trim();
  }
  
  private calculateSearchMetrics(messages: any[], query: string): SearchMetrics {
    const queryTerms = query.toLowerCase().split(/\s+/);
    
    return {
      total_matches: messages.length,
      relevance_scores: {
        average: this.calculateAverageRelevance(messages),
        highest: Math.max(...messages.map(m => m.relevance_score || 0)),
        lowest: Math.min(...messages.map(m => m.relevance_score || 0))
      },
      term_frequency: this.calculateTermFrequency(messages, queryTerms),
      channel_distribution: this.getChannelDistribution(messages),
      time_distribution: this.getTimeDistribution(messages),
      user_distribution: this.getUserDistribution(messages)
    };
  }
}
```

#### Afternoon (4 hours): User & Channel Search
- **Hour 5-6**: Implement search_users tool với fuzzy matching
- **Hour 7-8**: Implement search_channels tool với advanced filters

### Day 2: Thread Query Tools (8 hours)

#### Morning (4 hours): Thread Discovery & Search
- **Hour 1-2**: Implement get_workspace_threads tool
- **Hour 3-4**: Implement search_threads tool với reply analysis

**Workspace Threads Tool:**
```typescript
// src/tools/thread/get-workspace-threads.ts
export class GetWorkspaceThreadsTool extends BaseQueryTool {
  protected cacheEnabled = true;
  protected cacheTTL = 300; // 5 minutes for thread listing
  
  getDefinition(): SlackTool {
    return {
      name: 'get_workspace_threads',
      description: 'Discover và list threads across workspace với activity tracking',
      category: 'thread',
      requiresAuth: true,
      tags: ['threads', 'workspace', 'discovery', 'activity'],
      inputSchema: {
        type: 'object',
        properties: {
          // Channel filtering
          channels: {
            type: 'array',
            items: { type: 'string', pattern: '^[CDG][A-Z0-9]+$' },
            description: 'Limit to specific channels'
          },
          channel_types: {
            type: 'array',
            items: { type: 'string', enum: ['public', 'private', 'dm', 'mpim'] },
            description: 'Filter by channel types',
            default: ['public', 'private']
          },
          
          // Activity filtering
          min_replies: {
            type: 'number',
            minimum: 0,
            default: 1,
            description: 'Minimum number of replies'
          },
          max_replies: {
            type: 'number',
            minimum: 0,
            description: 'Maximum number of replies'
          },
          active_since: {
            type: 'string',
            description: 'Threads active since this timestamp/date'
          },
          created_after: {
            type: 'string',
            description: 'Threads created after this timestamp/date'
          },
          created_before: {
            type: 'string',
            description: 'Threads created before this timestamp/date'
          },
          
          // Participant filtering
          involves_users: {
            type: 'array',
            items: { type: 'string', pattern: '^U[A-Z0-9]+$' },
            description: 'Threads involving specific users'
          },
          started_by: {
            type: 'string',
            pattern: '^U[A-Z0-9]+$',
            description: 'Threads started by specific user'
          },
          
          // Content filtering
          has_reactions: {
            type: 'boolean',
            description: 'Threads with reactions'
          },
          has_attachments: {
            type: 'boolean',
            description: 'Threads with attachments'
          },
          status: {
            type: 'string',
            enum: ['active', 'resolved', 'archived', 'all'],
            default: 'active',
            description: 'Thread status filter'
          },
          
          // Sorting và pagination
          sort_by: {
            type: 'string',
            enum: ['created', 'last_reply', 'reply_count', 'participant_count'],
            default: 'last_reply',
            description: 'Sort threads by field'
          },
          sort_order: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'desc'
          },
          limit: {
            type: 'number',
            minimum: 1,
            maximum: 500,
            default: 100
          },
          cursor: {
            type: 'string',
            description: 'Pagination cursor'
          },
          
          // Data enrichment
          include_participants: {
            type: 'boolean',
            default: true,
            description: 'Include participant information'
          },
          include_preview: {
            type: 'boolean',
            default: true,
            description: 'Include thread message preview'
          },
          include_metrics: {
            type: 'boolean',
            default: false,
            description: 'Include detailed thread metrics'
          }
        }
      }
    };
  }
  
  async executeQuery(args: GetWorkspaceThreadsArgs): Promise<WorkspaceThreadsResponse> {
    const client = await this.initializeSlackClient();
    const startTime = Date.now();
    
    // Get channels to search based on filters
    const channels = await this.getChannelsToSearch(args);
    
    // Discover threads across channels
    const allThreads: ThreadInfo[] = [];
    
    // Process channels in batches to manage API limits
    const batchSize = 10;
    for (let i = 0; i < channels.length; i += batchSize) {
      const channelBatch = channels.slice(i, i + batchSize);
      
      const batchPromises = channelBatch.map(channel =>
        this.discoverChannelThreads(channel, args)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allThreads.push(...result.value);
        } else {
          logger.warn(`Failed to get threads for channel ${channelBatch[index].id}`, {
            error: result.reason
          });
        }
      });
    }
    
    // Apply filters
    let filteredThreads = this.applyThreadFilters(allThreads, args);
    
    // Sort threads
    filteredThreads = this.sortThreads(filteredThreads, args);
    
    // Apply pagination
    const paginatedThreads = this.paginateThreads(filteredThreads, args);
    
    // Enrich thread data
    if (args.include_participants || args.include_preview || args.include_metrics) {
      paginatedThreads.threads = await this.enrichThreadData(
        paginatedThreads.threads, 
        args
      );
    }
    
    // Calculate thread analytics
    const analytics = this.calculateThreadAnalytics(filteredThreads);
    
    return {
      threads: paginatedThreads.threads,
      total_count: filteredThreads.length,
      channels_searched: channels.length,
      discovery_time_ms: Date.now() - startTime,
      pagination: {
        has_more: paginatedThreads.has_more,
        next_cursor: paginatedThreads.next_cursor,
        total_pages: Math.ceil(filteredThreads.length / args.limit)
      },
      analytics: analytics,
      filters_applied: this.getAppliedThreadFilters(args),
      metadata: {
        search_scope: {
          channels: channels.map(c => ({ id: c.id, name: c.name })),
          channel_types: args.channel_types
        },
        enrichment: {
          participants_included: args.include_participants,
          preview_included: args.include_preview,
          metrics_included: args.include_metrics
        }
      }
    };
  }
}
```

#### Afternoon (4 hours): Thread Details & Optimization
- **Hour 5-6**: Implement get_thread_details tool với participant analysis
- **Hour 7-8**: Performance optimization và caching strategies

---

## 🧪 Testing Strategy

### Integration Testing
```typescript
// tests/integration/search-thread-tools.test.ts
describe('Search & Thread Tools Integration', () => {
  let toolRegistry: ToolRegistry;
  
  beforeEach(async () => {
    toolRegistry = new ToolRegistry();
    await toolRegistry.initialize();
  });
  
  describe('Search Tools', () => {
    it('should execute workspace search with multiple types', async () => {
      const result = await toolRegistry.executeTool('search_workspace', {
        query: 'testing',
        types: ['messages', 'channels', 'users'],
        limit: 10
      }, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.data.data.results_by_type).toHaveProperty('messages');
      expect(result.data.data.results_by_type).toHaveProperty('channels');
      expect(result.data.data.results_by_type).toHaveProperty('users');
    });
    
    it('should perform advanced message search với filters', async () => {
      const result = await toolRegistry.executeTool('search_messages', {
        query: 'important',
        has_reactions: true,
        include_context: true,
        highlight_terms: true,
        limit: 5
      }, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.data.data.messages).toBeInstanceOf(Array);
      expect(result.data.data).toHaveProperty('search_metrics');
    });
  });
  
  describe('Thread Tools', () => {
    it('should discover workspace threads với filters', async () => {
      const result = await toolRegistry.executeTool('get_workspace_threads', {
        min_replies: 2,
        sort_by: 'reply_count',
        include_participants: true,
        limit: 10
      }, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.data.data.threads).toBeInstanceOf(Array);
      expect(result.data.data).toHaveProperty('analytics');
    });
    
    it('should search threads với complex criteria', async () => {
      const result = await toolRegistry.executeTool('search_threads', {
        query: 'discussion',
        min_replies: 3,
        active_since: '2025-01-01',
        include_reply_analysis: true
      }, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.data.data.threads).toBeInstanceOf(Array);
      expect(result.data.data).toHaveProperty('search_analytics');
    });
  });
});
```

### Performance Benchmarking
```typescript
// tests/performance/search-thread-benchmarks.test.ts
describe('Search & Thread Tools Performance', () => {
  let benchmarks: SearchThreadBenchmarks;
  
  beforeEach(() => {
    benchmarks = new SearchThreadBenchmarks();
  });
  
  it('should meet search performance targets', async () => {
    const results = await benchmarks.runSearchBenchmarks();
    
    expect(results.search_workspace.avg_response_time).toBeLessThan(2000);
    expect(results.search_messages.avg_response_time).toBeLessThan(1500);
    expect(results.search_workspace.cache_hit_ratio).toBeGreaterThan(0.5);
  });
  
  it('should meet thread discovery performance targets', async () => {
    const results = await benchmarks.runThreadBenchmarks();
    
    expect(results.get_workspace_threads.avg_response_time).toBeLessThan(3000);
    expect(results.search_threads.avg_response_time).toBeLessThan(2500);
    expect(results.thread_discovery.throughput).toBeGreaterThan(50);
  });
});
```

---

## 📊 Success Criteria

### Functional Requirements
- ✅ 4 search resources converted to advanced search tools
- ✅ 3 thread resources converted to thread query tools
- ✅ Advanced search capabilities với relevance ranking
- ✅ Thread analytics và participant analysis
- ✅ Complex query parsing và filtering

### Performance Requirements
- ✅ search_workspace: <2s response time, >50% cache hit ratio
- ✅ search_messages: <1.5s response time, >60% cache hit ratio
- ✅ get_workspace_threads: <3s response time, >40% cache hit ratio
- ✅ Thread discovery throughput: >50 threads/second

### Quality Requirements
- ✅ Comprehensive search term highlighting
- ✅ Relevance scoring algorithms implemented
- ✅ Thread analytics calculations accurate
- ✅ Complex filter combinations working
- ✅ Pagination và cursor-based navigation

---

## 🚨 Risk Management

### Technical Risks
1. **Search Performance**: Complex queries may be slow
   - **Mitigation**: Implement query optimization, use search indices
   
2. **Thread Discovery Scale**: Large workspaces may timeout
   - **Mitigation**: Implement batching, progressive loading

### API Rate Limit Risks
1. **Concurrent Search Calls**: Multiple search types simultaneously
   - **Mitigation**: Implement request queuing, respect rate limits
   
2. **Thread Discovery API Usage**: High volume of API calls
   - **Mitigation**: Intelligent caching, batch operations

---

## 📈 Performance Targets

### Search Tool Performance
```typescript
interface SearchToolBenchmarks {
  search_workspace: {
    response_time_ms: 1800,
    cache_hit_ratio: 55,
    relevance_accuracy: 85
  };
  search_messages: {
    response_time_ms: 1400,
    cache_hit_ratio: 65,
    highlighting_speed_ms: 50
  };
  search_users: {
    response_time_ms: 800,
    cache_hit_ratio: 75,
    fuzzy_match_accuracy: 90
  };
  search_channels: {
    response_time_ms: 600,
    cache_hit_ratio: 80,
    filter_precision: 95
  };
}
```

### Thread Tool Performance
```typescript
interface ThreadToolBenchmarks {
  get_workspace_threads: {
    response_time_ms: 2800,
    cache_hit_ratio: 45,
    discovery_rate: 60
  };
  search_threads: {
    response_time_ms: 2300,
    cache_hit_ratio: 50,
    search_accuracy: 88
  };
  get_thread_details: {
    response_time_ms: 1200,
    cache_hit_ratio: 70,
    analysis_depth: 95
  };
}
```

---

**🎯 Sprint 4.3 Goal**: Convert search/thread resources to powerful query tools với advanced capabilities và optimal search performance.

_📅 Created: 2025-08-08 | Target: 2025-08-13 | Status: PLANNED_