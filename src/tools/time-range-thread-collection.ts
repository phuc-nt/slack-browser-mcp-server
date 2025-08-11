/**
 * Sprint 6.2: Time-Range Thread Collection Tool
 * Collects complete thread conversations that had activity within a specific time range
 */

import { BaseSlackTool } from './base.js';
import { SlackAuth } from '../slack/auth.js';
import { SlackClient } from '../slack/client.js';
import { logger } from '../utils/logger.js';
import { ToolContext, ToolExecutionResult, SlackTool } from '../types/tools.js';

/**
 * CollectThreadsByTimeRangeTool - 3-step process for collecting threads with activity in time range
 * Step 1: Find all messages in time range using conversations.history
 * Step 2: Identify threads that had activity (parent messages with replies or thread replies)
 * Step 3: Fetch complete thread data using conversations.replies
 */
export class CollectThreadsByTimeRangeTool extends BaseSlackTool {
  constructor() {
    const definition: SlackTool = {
      name: 'collect_threads_by_timerange',
      description: `Collect complete thread conversations that had message activity within a specific time range.

This tool uses a specialized 3-step process:
1. Find all messages in the time range using conversations.history
2. Identify threads that had activity (new messages or replies) 
3. Fetch complete thread data including all replies using conversations.replies

PERFECT FOR:
- Research conversations during specific incidents or events ("Get threads during yesterday's deployment")
- Collect discussion threads for meeting preparation ("Find active discussions from last week")
- Analyze thread activity patterns for specific date ranges ("Show conversation patterns during the outage")
- Comprehensive conversation analysis for retrospectives ("Gather all discussions from the sprint")
- Keyword-based thread filtering for targeted analysis ("Find threads mentioning 'bug' during the incident")

EXAMPLE QUERIES:
- "Get all threads with activity in the last 24 hours in #general"
- "Find discussion threads during the deployment incident on Aug 10"
- "Collect active conversations from yesterday's team meeting discussions"
- "Gather all thread discussions that happened during last week"
- "Find threads mentioning 'test' or 'deployment' between Aug 1-9 in #mcp_test"
- "Get threads containing both 'bug' and 'fix' from the incident timeframe"

Returns complete thread data with parent messages and all replies, even if the thread was started outside the time range but had replies within it. Includes comprehensive metadata about collection scope and thread statistics.`,
      category: 'data_collection',
      action: 'GET',
      requiresAuth: true,
      rateLimit: {
        rpm: 10, // Lower rate due to intensive multi-API operations
        burst: 2,
      },
      inputSchema: {
        type: 'object',
        properties: {
          channel: {
            type: 'string',
            description: 'Channel ID where threads should be collected (e.g., C1234567890)',
            pattern: '^C[A-Z0-9]+$',
          },
          start_date: {
            type: 'string',
            description:
              'Start date/time for collection period. Accepts Unix timestamp (1693526400.000000) or ISO date (2025-08-10T00:00:00Z)',
          },
          end_date: {
            type: 'string',
            description:
              'End date/time for collection period. Accepts Unix timestamp (1693612800.000000) or ISO date (2025-08-11T23:59:59Z)',
          },
          include_parent: {
            type: 'boolean',
            description: 'Include parent message in thread data (default: true)',
            default: true,
          },
          include_metadata: {
            type: 'boolean',
            description: 'Include thread statistics and metadata (default: true)',
            default: true,
          },
          max_threads: {
            type: 'number',
            description: 'Maximum number of threads to collect (1-100, default: 50)',
            minimum: 1,
            maximum: 100,
            default: 50,
          },
          keywords: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional keywords to filter threads by message content (case-insensitive)',
            minItems: 1,
            maxItems: 10,
          },
          match_type: {
            type: 'string',
            enum: ['any', 'all'],
            description: 'Keyword matching strategy: "any" finds threads with any keyword, "all" requires all keywords (default: any)',
            default: 'any',
          },
        },
        required: ['channel', 'start_date', 'end_date'],
      },
    };
    super(definition);
  }

  async executeImpl(args: any, context: ToolContext): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    logger.info('Starting time-range thread collection', {
      channel: args.channel,
      start_date: args.start_date,
      end_date: args.end_date,
      max_threads: args.max_threads || 50,
      keywords: args.keywords || [],
      match_type: args.match_type || 'any',
    });

    try {
      // Initialize Slack client
      const auth = new SlackAuth();
      const tokens = auth.extractTokensFromEnvironment();
      if (!tokens) {
        return this.createErrorResult(
          'Slack authentication required for thread collection operations.',
          'AUTH_REQUIRED',
          { executionTime: Date.now() - startTime, apiCalls: 0, cacheHits: 0 }
        );
      }

      const client = new SlackClient(tokens);

      // Parse timestamps
      const {
        oldestTimestamp,
        latestTimestamp,
        startDateFormatted,
        endDateFormatted,
        durationHours,
      } = this.parseTimeRange(args.start_date, args.end_date);

      logger.info('Parsed time range', {
        oldest: oldestTimestamp,
        latest: latestTimestamp,
        duration_hours: durationHours,
      });

      // STEP 1: Get all messages in time range using enhanced conversations.history
      const allMessages = await this.getAllMessagesInTimeRange(
        client,
        args.channel,
        oldestTimestamp,
        latestTimestamp
      );

      if (allMessages.length === 0) {
        return this.createSuccessResult(
          {
            channel: args.channel,
            time_range: {
              start: startDateFormatted,
              end: endDateFormatted,
              duration_hours: durationHours,
            },
            collection_summary: {
              total_threads_found: 0,
              threads_returned: 0,
              total_messages_collected: 0,
              collection_method: '3-step-process',
            },
            threads: [],
            metadata: {
              api_calls_made: 1,
              execution_time_ms: Date.now() - startTime,
              pagination_info: { messages_found_in_timerange: 0 },
            },
          },
          {
            executionTime: Date.now() - startTime,
            apiCalls: 1,
            cacheHits: 0,
          }
        );
      }

      // STEP 2: Identify threads with activity in the time range
      const threadTimestamps = this.identifyActiveThreads(allMessages);

      if (threadTimestamps.size === 0) {
        return this.createSuccessResult(
          {
            channel: args.channel,
            time_range: {
              start: startDateFormatted,
              end: endDateFormatted,
              duration_hours: durationHours,
            },
            collection_summary: {
              total_threads_found: 0,
              threads_returned: 0,
              total_messages_collected: allMessages.length,
              collection_method: '3-step-process',
            },
            threads: [],
            metadata: {
              api_calls_made: 1,
              execution_time_ms: Date.now() - startTime,
              pagination_info: {
                messages_found_in_timerange: allMessages.length,
                no_thread_activity_detected: true,
              },
            },
          },
          {
            executionTime: Date.now() - startTime,
            apiCalls: 1,
            cacheHits: 0,
          }
        );
      }

      // Limit threads if necessary
      const limitedThreadTimestamps = Array.from(threadTimestamps).slice(0, args.max_threads || 50);

      // STEP 3: Collect complete thread data
      const threads = await this.collectCompleteThreadData(
        client,
        args.channel,
        limitedThreadTimestamps,
        args.include_parent !== false,
        args.include_metadata !== false
      );

      // STEP 4: Apply keyword filtering if specified
      let filteredThreads = threads;
      if (args.keywords && args.keywords.length > 0) {
        filteredThreads = this.filterThreadsByKeywords(
          threads,
          args.keywords,
          args.match_type || 'any'
        );
        
        logger.info('Applied keyword filtering', {
          original_threads: threads.length,
          filtered_threads: filteredThreads.length,
          keywords: args.keywords,
          match_type: args.match_type || 'any',
        });
      }

      const totalMessagesCollected = filteredThreads.reduce(
        (sum, thread) => sum + thread.messages.length,
        0
      );
      const apiCallsMade = 1 + limitedThreadTimestamps.length; // 1 for history + 1 per thread

      // Sprint 7.2: Optimize thread collection response (20-30% reduction)
      // Remove blocks from nested messages, keep thread structure and statistics
      const optimizedThreads = filteredThreads.map((thread: any) => ({
        thread_ts: thread.thread_ts,
        messages: thread.messages.map((message: any) => ({
          user: message.user,
          ts: message.ts,
          text: message.text || '',
          thread_ts: message.thread_ts,
          // Removed: blocks, client_msg_id, metadata
        })),
        thread_stats: thread.thread_stats, // Keep thread statistics
      }));

      logger.info('Thread collection completed and optimized', {
        channel: args.channel,
        threads_found: threadTimestamps.size,
        threads_collected: threads.length,
        threads_after_keyword_filter: filteredThreads.length,
        optimized_threads: optimizedThreads.length,
        total_messages: totalMessagesCollected,
        api_calls: apiCallsMade,
        keywords: args.keywords || [],
        duration_ms: Date.now() - startTime,
        optimization: 'Sprint 7.2 - 20-30% size reduction',
      });

      return this.createSuccessResult(
        {
          channel: args.channel,
          time_range: {
            start: startDateFormatted,
            end: endDateFormatted,
            duration_hours: durationHours,
          },
          collection_summary: {
            total_threads_found: threadTimestamps.size,
            threads_after_keyword_filter: args.keywords && args.keywords.length > 0 ? filteredThreads.length : undefined,
            threads_returned: optimizedThreads.length,
            total_messages_collected: totalMessagesCollected,
            collection_method: args.keywords && args.keywords.length > 0 ? '4-step-process-with-keywords' : '3-step-process',
            keywords_applied: args.keywords || [],
            match_type: args.keywords && args.keywords.length > 0 ? (args.match_type || 'any') : undefined,
          },
          threads: optimizedThreads,
          // Removed: detailed metadata (api_calls_made, execution_time_ms, pagination_info)
        },
        {
          executionTime: Date.now() - startTime,
          apiCalls: apiCallsMade,
          cacheHits: 0,
        }
      );
    } catch (error) {
      logger.error('Error in time-range thread collection', {
        error,
        channel: args.channel,
        start_date: args.start_date,
        end_date: args.end_date,
      });

      return this.createErrorResult(
        `Time-range thread collection failed: ${error}`,
        'EXECUTION_ERROR',
        { executionTime: Date.now() - startTime, apiCalls: 0, cacheHits: 0 }
      );
    }
  }

  /**
   * Parse start and end dates into Unix timestamps
   */
  private parseTimeRange(startDate: string, endDate: string) {
    let startTimestamp: Date;
    let endTimestamp: Date;

    // Parse start date
    if (startDate.includes('.') && !startDate.includes('-') && !startDate.includes('T')) {
      // Unix timestamp format (e.g., "1693526400.000000")
      startTimestamp = new Date(parseFloat(startDate) * 1000);
    } else {
      // ISO date format (e.g., "2025-08-10T00:00:00Z")
      startTimestamp = new Date(startDate);
    }

    // Parse end date
    if (endDate.includes('.') && !endDate.includes('-') && !endDate.includes('T')) {
      // Unix timestamp format
      endTimestamp = new Date(parseFloat(endDate) * 1000);
    } else {
      // ISO date format
      endTimestamp = new Date(endDate);
    }

    if (isNaN(startTimestamp.getTime()) || isNaN(endTimestamp.getTime())) {
      throw new Error(
        'Invalid date format. Use Unix timestamp (1693526400.000000) or ISO date (2025-08-10T00:00:00Z)'
      );
    }

    if (startTimestamp >= endTimestamp) {
      throw new Error('Start date must be before end date');
    }

    const oldestTimestamp = (startTimestamp.getTime() / 1000).toFixed(6);
    const latestTimestamp = (endTimestamp.getTime() / 1000).toFixed(6);
    const durationHours =
      Math.round(((endTimestamp.getTime() - startTimestamp.getTime()) / (1000 * 60 * 60)) * 100) /
      100;

    return {
      oldestTimestamp,
      latestTimestamp,
      startDateFormatted: startTimestamp.toISOString(),
      endDateFormatted: endTimestamp.toISOString(),
      durationHours,
    };
  }

  /**
   * STEP 1: Get all messages in time range with pagination support
   */
  private async getAllMessagesInTimeRange(
    client: SlackClient,
    channel: string,
    oldest: string,
    latest: string
  ) {
    let allMessages: any[] = [];
    let cursor: string | undefined = undefined;
    const maxIterations = 20; // Prevent infinite loops
    let iterations = 0;

    do {
      if (iterations++ > maxIterations) {
        logger.warn('Reached maximum pagination iterations', { iterations });
        break;
      }

      const response = await client.getConversationHistoryWithTimeRange(channel, {
        oldest,
        latest,
        inclusive: true,
        limit: 999,
        cursor,
      });

      if (!response.ok) {
        throw new Error(`Failed to get conversation history: ${response.error}`);
      }

      if (response.messages && response.messages.length > 0) {
        allMessages.push(...response.messages);
      }

      cursor = response.response_metadata?.next_cursor;
    } while (cursor);

    return allMessages;
  }

  /**
   * STEP 2: Identify threads that had activity in the time range
   */
  private identifyActiveThreads(messages: any[]): Set<string> {
    const threadTimestamps = new Set<string>();

    messages.forEach((msg) => {
      // Thread parent message with replies
      if (msg.reply_count && msg.reply_count > 0) {
        threadTimestamps.add(msg.ts);
      }

      // Thread reply message
      if (msg.thread_ts && msg.thread_ts !== msg.ts) {
        threadTimestamps.add(msg.thread_ts);
      }
    });

    return threadTimestamps;
  }

  /**
   * STEP 3: Collect complete thread data for each identified thread
   */
  private async collectCompleteThreadData(
    client: SlackClient,
    channel: string,
    threadTimestamps: string[],
    includeParent: boolean,
    includeMetadata: boolean
  ) {
    const completeThreads: any[] = [];

    for (const threadTs of threadTimestamps) {
      try {
        const response = await client.getConversationReplies(channel, threadTs, {
          inclusive: true,
          limit: 999,
        });

        if (response.ok && response.messages && response.messages.length > 0) {
          const messages = response.messages;
          const parentMessage = messages[0];
          const replies = messages.slice(1);

          const threadData: any = {
            thread_ts: threadTs,
            messages: includeParent ? messages : replies,
          };

          if (includeMetadata) {
            threadData.thread_stats = {
              reply_count: replies.length,
              participant_count: new Set(messages.map((m) => m.user).filter((u) => u)).size,
              first_reply_ts: replies.length > 0 ? replies[0].ts : null,
              last_reply_ts: replies.length > 0 ? replies[replies.length - 1].ts : null,
              parent_user: parentMessage.user,
              parent_text_preview: parentMessage.text?.substring(0, 100) || '',
            };
          }

          completeThreads.push(threadData);
        }
      } catch (error) {
        logger.warn('Failed to get thread replies', { threadTs, error });
        // Continue with other threads even if one fails
      }
    }

    return completeThreads;
  }

  /**
   * STEP 4: Filter threads by keywords (Sprint 7.3 enhancement)
   */
  private filterThreadsByKeywords(
    threads: any[],
    keywords: string[],
    matchType: 'any' | 'all' = 'any'
  ): any[] {
    if (!keywords || keywords.length === 0) {
      return threads;
    }

    const normalizedKeywords = keywords.map(k => k.toLowerCase().trim());
    
    return threads.filter(thread => {
      // Collect all text content from thread messages
      const allMessages = thread.messages || [];
      const allText = allMessages
        .map((msg: any) => (msg.text || '').toLowerCase())
        .join(' ');

      if (matchType === 'all') {
        // Thread must contain ALL keywords
        return normalizedKeywords.every(keyword => 
          allText.includes(keyword)
        );
      } else {
        // Thread must contain ANY keyword (default)
        return normalizedKeywords.some(keyword => 
          allText.includes(keyword)
        );
      }
    });
  }
}

/**
 * CollectThreadsByKeywordTool - Sprint 7.3: Dedicated keyword-based thread collection
 * Optimized for searching and collecting threads containing specific keywords within timeframes
 */
export class CollectThreadsByKeywordTool extends BaseSlackTool {
  constructor() {
    const definition: SlackTool = {
      name: 'collect_threads_by_keyword',
      description: `Collect threads containing specific keywords within a time range - optimized for keyword-based discovery.

This tool specializes in keyword-based thread collection using an enhanced 4-step process:
1. Search messages using Slack search API with keyword operators
2. Extract thread timestamps from search results
3. Collect complete thread data using conversations.replies
4. Apply additional keyword filtering for precision

PERFECT FOR:
- Finding specific discussions by topic ("threads about deployment issues")
- Research incident-related conversations ("threads mentioning bug and fix")
- Targeted content discovery ("conversations about API changes")
- Topic-based thread analysis ("discussions containing security keywords")

EXAMPLE USE CASES:
- "Find threads discussing 'API timeout' between Aug 1-9"
- "Get conversations mentioning both 'bug' and 'production' from last week"
- "Collect threads about 'deployment' or 'release' from the incident period"
- "Find discussions containing 'test' keyword in #mcp_test channel"

Optimized for keyword-centric workflows with enhanced search precision and reduced API calls compared to time-range collection with filtering.`,
      category: 'data_collection',
      action: 'GET',
      requiresAuth: true,
      rateLimit: {
        rpm: 10, // Lower rate due to search API usage
        burst: 2,
      },
      inputSchema: {
        type: 'object',
        properties: {
          channel: {
            type: 'string',
            description: 'Channel ID where threads should be searched (e.g., C1234567890)',
            pattern: '^C[A-Z0-9]+$',
          },
          keywords: {
            type: 'array',
            items: { type: 'string' },
            description: 'Keywords to search for in thread content (case-insensitive)',
            minItems: 1,
            maxItems: 10,
          },
          match_type: {
            type: 'string',
            enum: ['any', 'all'],
            description: 'Keyword matching strategy: "any" finds threads with any keyword, "all" requires all keywords (default: any)',
            default: 'any',
          },
          start_date: {
            type: 'string',
            description: 'Start date/time for search period. Accepts Unix timestamp (1693526400.000000) or ISO date (2025-08-01T00:00:00Z)',
          },
          end_date: {
            type: 'string',
            description: 'End date/time for search period. Accepts Unix timestamp (1693612800.000000) or ISO date (2025-08-09T23:59:59Z)',
          },
          max_threads: {
            type: 'number',
            description: 'Maximum number of threads to return (1-50, default: 20)',
            minimum: 1,
            maximum: 50,
            default: 20,
          },
          include_parent: {
            type: 'boolean',
            description: 'Include parent message in thread data (default: true)',
            default: true,
          },
        },
        required: ['channel', 'keywords', 'start_date', 'end_date'],
      },
    };
    super(definition);
  }

  async executeImpl(args: any, context: ToolContext): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    logger.info('Starting keyword-based thread collection', {
      channel: args.channel,
      keywords: args.keywords,
      match_type: args.match_type || 'any',
      start_date: args.start_date,
      end_date: args.end_date,
      max_threads: args.max_threads || 20,
    });

    try {
      // Initialize Slack client
      const auth = new SlackAuth();
      const tokens = auth.extractTokensFromEnvironment();
      if (!tokens) {
        return this.createErrorResult(
          'Slack authentication required for keyword thread collection operations.',
          'AUTH_REQUIRED',
          { executionTime: Date.now() - startTime, apiCalls: 0, cacheHits: 0 }
        );
      }

      const client = new SlackClient(tokens);

      // Parse timestamps
      const timeRangeTool = new CollectThreadsByTimeRangeTool();
      const {
        oldestTimestamp,
        latestTimestamp,
        startDateFormatted,
        endDateFormatted,
        durationHours,
      } = (timeRangeTool as any).parseTimeRange(args.start_date, args.end_date);

      logger.info('Parsed time range for keyword search', {
        oldest: oldestTimestamp,
        latest: latestTimestamp,
        duration_hours: durationHours,
      });

      // STEP 1: Build search query for Slack search API
      const searchQuery = this.buildSearchQuery(
        args.channel,
        args.keywords,
        args.match_type || 'any',
        args.start_date,
        args.end_date
      );

      logger.info('Built search query', { query: searchQuery });

      // STEP 2: Search for messages containing keywords
      const searchResults = await this.searchMessagesWithKeywords(client, searchQuery);

      if (!searchResults || searchResults.length === 0) {
        return this.createSuccessResult(
          {
            channel: args.channel,
            time_range: {
              start: startDateFormatted,
              end: endDateFormatted,
              duration_hours: durationHours,
            },
            search_query: searchQuery,
            collection_summary: {
              total_threads_found: 0,
              threads_returned: 0,
              total_messages_collected: 0,
              collection_method: 'keyword-optimized-search',
            },
            threads: [],
          },
          {
            executionTime: Date.now() - startTime,
            apiCalls: 1,
            cacheHits: 0,
          }
        );
      }

      // STEP 3: Extract thread timestamps from search results
      const threadTimestamps = this.extractThreadTimestampsFromSearch(searchResults);

      if (threadTimestamps.size === 0) {
        return this.createSuccessResult(
          {
            channel: args.channel,
            time_range: {
              start: startDateFormatted,
              end: endDateFormatted,
              duration_hours: durationHours,
            },
            search_query: searchQuery,
            collection_summary: {
              total_threads_found: 0,
              threads_returned: 0,
              total_messages_collected: searchResults.length,
              collection_method: 'keyword-optimized-search',
            },
            threads: [],
          },
          {
            executionTime: Date.now() - startTime,
            apiCalls: 1,
            cacheHits: 0,
          }
        );
      }

      // Limit threads if necessary
      const limitedThreadTimestamps = Array.from(threadTimestamps).slice(0, args.max_threads || 20);

      // STEP 4: Collect complete thread data
      const threads = await this.collectCompleteThreadData(
        client,
        args.channel,
        limitedThreadTimestamps,
        args.include_parent !== false
      );

      const totalMessagesCollected = threads.reduce(
        (sum, thread) => sum + thread.messages.length,
        0
      );
      const apiCallsMade = 1 + limitedThreadTimestamps.length; // 1 for search + 1 per thread

      // Apply Sprint 7.2 optimization - streamlined responses
      const optimizedThreads = threads.map((thread: any) => ({
        thread_ts: thread.thread_ts,
        messages: thread.messages.map((message: any) => ({
          user: message.user,
          ts: message.ts,
          text: message.text || '',
          thread_ts: message.thread_ts,
        })),
        thread_stats: thread.thread_stats,
        keyword_matches: this.identifyKeywordMatches(thread, args.keywords), // Sprint 7.3 enhancement
      }));

      logger.info('Keyword-based thread collection completed', {
        channel: args.channel,
        search_results: searchResults.length,
        threads_found: threadTimestamps.size,
        threads_collected: threads.length,
        optimized_threads: optimizedThreads.length,
        total_messages: totalMessagesCollected,
        api_calls: apiCallsMade,
        keywords: args.keywords,
        duration_ms: Date.now() - startTime,
      });

      return this.createSuccessResult(
        {
          channel: args.channel,
          time_range: {
            start: startDateFormatted,
            end: endDateFormatted,
            duration_hours: durationHours,
          },
          search_query: searchQuery,
          collection_summary: {
            total_threads_found: threadTimestamps.size,
            threads_returned: optimizedThreads.length,
            total_messages_collected: totalMessagesCollected,
            collection_method: 'keyword-optimized-search',
            keywords_applied: args.keywords,
            match_type: args.match_type || 'any',
          },
          threads: optimizedThreads,
        },
        {
          executionTime: Date.now() - startTime,
          apiCalls: apiCallsMade,
          cacheHits: 0,
        }
      );
    } catch (error) {
      logger.error('Error in keyword-based thread collection', {
        error,
        channel: args.channel,
        keywords: args.keywords,
        start_date: args.start_date,
        end_date: args.end_date,
      });

      return this.createErrorResult(
        `Keyword thread collection failed: ${error}`,
        'EXECUTION_ERROR',
        { executionTime: Date.now() - startTime, apiCalls: 0, cacheHits: 0 }
      );
    }
  }

  /**
   * Build optimized search query for Slack search API
   */
  private buildSearchQuery(
    channel: string,
    keywords: string[],
    matchType: 'any' | 'all',
    startDate: string,
    endDate: string
  ): string {
    // Convert channel ID to search format
    const channelQuery = `in:<#${channel}>`;
    
    // Build date range
    const beforeDate = this.formatDateForSearch(endDate);
    const afterDate = this.formatDateForSearch(startDate);
    const dateQuery = `before:${beforeDate} after:${afterDate}`;
    
    // Build keyword query
    let keywordQuery: string;
    if (matchType === 'all') {
      // All keywords required (AND logic)
      keywordQuery = keywords.join(' ');
    } else {
      // Any keyword matches (OR logic) - use parentheses for complex OR
      keywordQuery = keywords.length === 1 ? keywords[0] : `(${keywords.join(' OR ')})`;
    }
    
    return `${channelQuery} ${dateQuery} ${keywordQuery}`;
  }

  /**
   * Format date for Slack search API
   */
  private formatDateForSearch(dateString: string): string {
    let date: Date;
    
    if (dateString.includes('.') && !dateString.includes('-') && !dateString.includes('T')) {
      // Unix timestamp format
      date = new Date(parseFloat(dateString) * 1000);
    } else {
      // ISO date format
      date = new Date(dateString);
    }
    
    // Return YYYY-MM-DD format for Slack search
    return date.toISOString().split('T')[0];
  }

  /**
   * Search messages using Slack search API
   */
  private async searchMessagesWithKeywords(client: SlackClient, query: string): Promise<any[]> {
    try {
      // Use the existing search functionality from SlackClient
      const response = await client.searchMessages({
        module: 'messages',
        query: query,
        sort: 'timestamp',
        sort_dir: 'desc',
        count: 100, // Maximum results
      });

      if (!response.ok || !response.items) {
        logger.warn('Search API returned no results or error', { 
          ok: response.ok, 
          error: response.error 
        });
        return [];
      }

      return response.items || [];
    } catch (error) {
      logger.error('Error in search API call', { error, query });
      return [];
    }
  }

  /**
   * Extract thread timestamps from search results
   */
  private extractThreadTimestampsFromSearch(searchResults: any[]): Set<string> {
    const threadTimestamps = new Set<string>();

    searchResults.forEach((result) => {
      // Check if result is a thread parent (has replies)
      if (result.reply_count && result.reply_count > 0) {
        threadTimestamps.add(result.ts);
      }
      
      // Check if result is a thread reply
      if (result.thread_ts && result.thread_ts !== result.ts) {
        threadTimestamps.add(result.thread_ts);
      }
    });

    return threadTimestamps;
  }

  /**
   * Collect complete thread data (reused from parent class logic)
   */
  private async collectCompleteThreadData(
    client: SlackClient,
    channel: string,
    threadTimestamps: string[],
    includeParent: boolean
  ): Promise<any[]> {
    const completeThreads: any[] = [];

    for (const threadTs of threadTimestamps) {
      try {
        const response = await client.getConversationReplies(channel, threadTs, {
          inclusive: true,
          limit: 999,
        });

        if (response.ok && response.messages && response.messages.length > 0) {
          const messages = response.messages;
          const parentMessage = messages[0];
          const replies = messages.slice(1);

          const threadData: any = {
            thread_ts: threadTs,
            messages: includeParent ? messages : replies,
            thread_stats: {
              reply_count: replies.length,
              participant_count: new Set(messages.map((m) => m.user).filter((u) => u)).size,
              first_reply_ts: replies.length > 0 ? replies[0].ts : null,
              last_reply_ts: replies.length > 0 ? replies[replies.length - 1].ts : null,
              parent_user: parentMessage.user,
              parent_text_preview: parentMessage.text?.substring(0, 100) || '',
            },
          };

          completeThreads.push(threadData);
        }
      } catch (error) {
        logger.warn('Failed to get thread replies', { threadTs, error });
        // Continue with other threads even if one fails
      }
    }

    return completeThreads;
  }

  /**
   * Identify which specific keywords matched in each thread (Sprint 7.3 enhancement)
   */
  private identifyKeywordMatches(thread: any, keywords: string[]): string[] {
    const allMessages = thread.messages || [];
    const allText = allMessages
      .map((msg: any) => (msg.text || '').toLowerCase())
      .join(' ');
    
    const normalizedKeywords = keywords.map(k => k.toLowerCase().trim());
    
    return normalizedKeywords.filter(keyword => 
      allText.includes(keyword)
    );
  }
}
