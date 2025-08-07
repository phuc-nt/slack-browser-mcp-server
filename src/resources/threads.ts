/**
 * Thread Resources - Advanced thread discovery and management resources
 * Implements 5 new thread resources for comprehensive thread system
 */

import { SlackAuth } from '../slack/auth.js';
import { SlackClient } from '../slack/client.js';
import { logger } from '../utils/logger.js';
import { SlackMCPResource } from '../types/mcp.js';
import { 
  ThreadResourceParams, 
  ThreadSearchResult, 
  ChannelThreadsResult, 
  ThreadDetailsResult, 
  ThreadRepliesResult,
  ThreadErrorResult,
  ThreadSummary,
  ThreadDetails,
  ThreadParticipant
} from '../types/threads.js';
import { SlackMessage } from '../slack/types.js';

/**
 * Thread Resources Factory - Creates and manages all thread-related MCP resources
 */
export class ThreadResources {

  /**
   * Resource 1: Channel Thread Discovery
   * URI: slack://channels/{channelId}/threads
   */
  static createChannelThreadsResource(): SlackMCPResource {
    return {
      uri: 'slack://channels/{channelId}/threads',
      name: 'Channel Thread Discovery',
      description: 'List all active threads in a specific channel with metadata and filtering',
      mimeType: 'application/json',
      requiresAuth: true,
      cacheable: true,
      generator: {
        type: 'cached',
        refreshInterval: 120000 // 2 minutes - threads change frequently
      }
    };
  }

  /**
   * Generate channel threads content
   */
  static async generateChannelThreadsContent(
    channelId: string, 
    params: ThreadResourceParams
  ): Promise<string> {
    try {
      logger.info('Generating channel threads content', { channelId, params });

      // Authenticate with Slack
      const auth = new SlackAuth();
      const authResult = await auth.authenticate();
      
      if (!authResult.success || !authResult.tokens) {
        throw new Error(authResult.error || 'Authentication failed');
      }

      // Create API client
      const client = new SlackClient(authResult.tokens);

      // Get channel info first
      const channels = await client.getChannels();
      const channel = channels.find(ch => ch.id === channelId);
      
      if (!channel) {
        const errorResult: ThreadErrorResult = {
          success: false,
          error: `Channel not found: ${channelId}`,
          error_code: 'CHANNEL_NOT_FOUND',
          channel: channelId,
          retrieved_at: new Date().toISOString()
        };
        return JSON.stringify(errorResult, null, 2);
      }

      // Get conversation history to find threads
      const limit = parseInt(params.limit || '100'); // Get more messages to find threads
      const messages = await client.getConversationHistory(channelId, limit);

      // Filter messages that have thread_ts (are parent messages of threads)
      const threadMessages = messages.filter(msg => 
        msg.reply_count && msg.reply_count > 0
      );

      // Apply additional filters
      let filteredThreads = threadMessages;
      
      if (params.has_replies === 'true') {
        filteredThreads = filteredThreads.filter(msg => (msg.reply_count || 0) > 0);
      }
      
      if (params.min_replies) {
        const minReplies = parseInt(params.min_replies);
        filteredThreads = filteredThreads.filter(msg => (msg.reply_count || 0) >= minReplies);
      }

      if (params.oldest) {
        filteredThreads = filteredThreads.filter(msg => 
          parseFloat(msg.ts) >= parseFloat(params.oldest!)
        );
      }

      // Sort by timestamp (newest first) or replies
      const sortBy = (params.sort as 'timestamp' | 'replies' | 'activity') || 'timestamp';
      filteredThreads.sort((a, b) => {
        if (sortBy === 'replies') {
          return (b.reply_count || 0) - (a.reply_count || 0);
        } else if (sortBy === 'activity') {
          // Use latest_reply if available, otherwise message timestamp
          const aTime = a.latest_reply || a.ts;
          const bTime = b.latest_reply || b.ts;
          return parseFloat(bTime) - parseFloat(aTime);
        } else {
          // Default: timestamp
          return parseFloat(b.ts) - parseFloat(a.ts);
        }
      });

      // Apply final limit
      const resultLimit = parseInt(params.limit || '20');
      const limitedThreads = filteredThreads.slice(0, resultLimit);

      // Convert to thread summaries
      const threadSummaries: ThreadSummary[] = limitedThreads.map(msg => ({
        thread_ts: msg.ts,
        channel: channelId,
        title: this.extractThreadTitle(msg.text || ''),
        reply_count: msg.reply_count || 0,
        last_reply: msg.latest_reply || msg.ts,
        participants_count: 1, // Will be enhanced in future versions
        status: 'active', // Default status
        preview_text: this.truncateText(msg.text || '', 100)
      }));

      const result: ChannelThreadsResult = {
        success: true,
        channel: channelId,
        threads: threadSummaries,
        total: threadSummaries.length,
        has_more: filteredThreads.length > resultLimit,
        channel_info: {
          name: channel.name || '',
          is_private: channel.is_private || false,
          member_count: channel.num_members || 0
        },
        parameters: params,
        retrieved_at: new Date().toISOString()
      };

      logger.info('Channel threads content generated successfully', {
        channelId,
        threadCount: threadSummaries.length
      });

      return JSON.stringify(result, null, 2);

    } catch (error) {
      logger.error('Failed to generate channel threads content', { 
        channelId, 
        error: error instanceof Error ? error.message : 'Unknown error',
        params 
      });

      const errorResult: ThreadErrorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error generating channel threads',
        channel: channelId,
        retrieved_at: new Date().toISOString()
      };

      return JSON.stringify(errorResult, null, 2);
    }
  }

  /**
   * Resource 2: Thread Details
   * URI: slack://threads/{thread_ts}/details
   */
  static createThreadDetailsResource(): SlackMCPResource {
    return {
      uri: 'slack://threads/{thread_ts}/details',
      name: 'Thread Details & Metadata',
      description: 'Complete thread information including participants, statistics, and metadata',
      mimeType: 'application/json',
      requiresAuth: true,
      cacheable: true,
      generator: {
        type: 'cached',
        refreshInterval: 60000 // 1 minute - thread details change less frequently
      }
    };
  }

  /**
   * Generate thread details content
   */
  static async generateThreadDetailsContent(
    threadTs: string,
    channelId?: string,
    params?: ThreadResourceParams
  ): Promise<string> {
    try {
      logger.info('Generating thread details content', { threadTs, channelId });

      // Authenticate with Slack
      const auth = new SlackAuth();
      const authResult = await auth.authenticate();
      
      if (!authResult.success || !authResult.tokens) {
        throw new Error(authResult.error || 'Authentication failed');
      }

      // Create API client
      const client = new SlackClient(authResult.tokens);

      // If no channelId provided, we need to find it (this would require workspace-wide search)
      if (!channelId) {
        const errorResult: ThreadErrorResult = {
          success: false,
          error: 'Channel ID is required for thread details lookup',
          error_code: 'INVALID_PARAMETERS',
          thread_ts: threadTs,
          retrieved_at: new Date().toISOString()
        };
        return JSON.stringify(errorResult, null, 2);
      }

      // Get the parent message and thread replies
      const history = await client.getConversationHistory(channelId, 200);
      const parentMessage = history.find(msg => msg.ts === threadTs);

      if (!parentMessage) {
        const errorResult: ThreadErrorResult = {
          success: false,
          error: `Thread not found: ${threadTs}`,
          error_code: 'THREAD_NOT_FOUND',
          thread_ts: threadTs,
          channel: channelId,
          retrieved_at: new Date().toISOString()
        };
        return JSON.stringify(errorResult, null, 2);
      }

      // Get thread replies if any
      let replies: SlackMessage[] = [];
      let participants: ThreadParticipant[] = [];
      
      if (parentMessage.reply_count && parentMessage.reply_count > 0) {
        // Get thread replies using conversation history with thread_ts
        const allMessages = await client.getConversationHistory(channelId, 1000);
        replies = allMessages.filter(msg => msg.thread_ts === threadTs && msg.ts !== threadTs);
        
        // Calculate participants
        const userCounts: { [userId: string]: number } = {};
        const userFirstReply: { [userId: string]: string } = {};
        const userLastReply: { [userId: string]: string } = {};

        // Count parent message creator
        if (parentMessage.user) {
          userCounts[parentMessage.user] = 1;
          userFirstReply[parentMessage.user] = parentMessage.ts;
          userLastReply[parentMessage.user] = parentMessage.ts;
        }

        // Count reply participants
        replies.forEach(reply => {
          if (reply.user) {
            userCounts[reply.user] = (userCounts[reply.user] || 0) + 1;
            if (!userFirstReply[reply.user]) {
              userFirstReply[reply.user] = reply.ts;
            }
            userLastReply[reply.user] = reply.ts;
          }
        });

        // Create participant objects
        participants = Object.keys(userCounts).map(userId => ({
          user_id: userId,
          message_count: userCounts[userId],
          first_reply: userFirstReply[userId],
          last_reply: userLastReply[userId],
          role: userId === parentMessage.user ? 'creator' : 'participant'
        }));
      }

      // Calculate thread age
      const createdTime = new Date(parseFloat(threadTs) * 1000);
      const now = new Date();
      const threadAgeHours = Math.round((now.getTime() - createdTime.getTime()) / (1000 * 60 * 60));

      const threadDetails: ThreadDetails = {
        thread_ts: threadTs,
        channel: channelId,
        parent_message: parentMessage,
        reply_count: parentMessage.reply_count || 0,
        participants,
        last_activity: parentMessage.latest_reply || parentMessage.ts,
        thread_age_hours: threadAgeHours,
        status: 'active', // Could be enhanced with actual status detection
        created_at: createdTime.toISOString(),
        updated_at: new Date(parseFloat(parentMessage.latest_reply || parentMessage.ts) * 1000).toISOString()
      };

      const result: ThreadDetailsResult = {
        success: true,
        thread: threadDetails,
        retrieved_at: new Date().toISOString()
      };

      logger.info('Thread details content generated successfully', {
        threadTs,
        channelId,
        replyCount: parentMessage.reply_count,
        participantCount: participants.length
      });

      return JSON.stringify(result, null, 2);

    } catch (error) {
      logger.error('Failed to generate thread details content', { 
        threadTs,
        channelId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      const errorResult: ThreadErrorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error generating thread details',
        thread_ts: threadTs,
        channel: channelId,
        retrieved_at: new Date().toISOString()
      };

      return JSON.stringify(errorResult, null, 2);
    }
  }

  /**
   * Resource 3: Thread Replies
   * URI: slack://threads/{thread_ts}/replies
   */
  static createThreadRepliesResource(): SlackMCPResource {
    return {
      uri: 'slack://threads/{thread_ts}/replies',
      name: 'Thread Conversation Replies',
      description: 'Complete thread conversation with all replies and pagination support',
      mimeType: 'application/json',
      requiresAuth: true,
      cacheable: true,
      generator: {
        type: 'cached',
        refreshInterval: 30000 // 30 seconds - replies change frequently
      }
    };
  }

  /**
   * Generate thread replies content
   */
  static async generateThreadRepliesContent(
    threadTs: string,
    channelId: string,
    params: ThreadResourceParams
  ): Promise<string> {
    try {
      logger.info('Generating thread replies content', { threadTs, channelId, params });

      // Authenticate with Slack
      const auth = new SlackAuth();
      const authResult = await auth.authenticate();
      
      if (!authResult.success || !authResult.tokens) {
        throw new Error(authResult.error || 'Authentication failed');
      }

      // Create API client
      const client = new SlackClient(authResult.tokens);

      // Get conversation history to find parent message and replies
      const allMessages = await client.getConversationHistory(channelId, 1000);
      
      // Find parent message
      const parentMessage = allMessages.find(msg => msg.ts === threadTs);
      if (!parentMessage) {
        const errorResult: ThreadErrorResult = {
          success: false,
          error: `Thread not found: ${threadTs}`,
          error_code: 'THREAD_NOT_FOUND',
          thread_ts: threadTs,
          channel: channelId,
          retrieved_at: new Date().toISOString()
        };
        return JSON.stringify(errorResult, null, 2);
      }

      // Get all replies in thread
      let replies = allMessages.filter(msg => msg.thread_ts === threadTs && msg.ts !== threadTs);

      // Apply filters
      if (params.oldest) {
        replies = replies.filter(msg => parseFloat(msg.ts) >= parseFloat(params.oldest!));
      }
      
      if (params.latest) {
        replies = replies.filter(msg => parseFloat(msg.ts) <= parseFloat(params.latest!));
      }

      // Sort by timestamp (oldest first for conversation flow)
      replies.sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts));

      // Apply limit
      const limit = parseInt(params.limit || '100');
      const limitedReplies = replies.slice(0, limit);

      // Calculate participants count
      const participantIds = new Set([parentMessage.user]);
      replies.forEach(reply => {
        if (reply.user) participantIds.add(reply.user);
      });

      const result: ThreadRepliesResult = {
        success: true,
        thread_ts: threadTs,
        channel: channelId,
        parent_message: parentMessage,
        replies: limitedReplies,
        total_replies: replies.length,
        has_more: replies.length > limit,
        parameters: {
          limit,
          oldest: params.oldest,
          latest: params.latest
        },
        thread_metadata: {
          participants_count: participantIds.size,
          created_at: new Date(parseFloat(threadTs) * 1000).toISOString(),
          last_activity: parentMessage.latest_reply || threadTs
        },
        retrieved_at: new Date().toISOString()
      };

      logger.info('Thread replies content generated successfully', {
        threadTs,
        channelId,
        totalReplies: replies.length,
        returnedReplies: limitedReplies.length
      });

      return JSON.stringify(result, null, 2);

    } catch (error) {
      logger.error('Failed to generate thread replies content', { 
        threadTs,
        channelId,
        error: error instanceof Error ? error.message : 'Unknown error',
        params 
      });

      const errorResult: ThreadErrorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error generating thread replies',
        thread_ts: threadTs,
        channel: channelId,
        retrieved_at: new Date().toISOString()
      };

      return JSON.stringify(errorResult, null, 2);
    }
  }

  /**
   * Resource 4: Workspace Thread Search
   * URI: slack://workspace/threads
   */
  static createWorkspaceThreadsResource(): SlackMCPResource {
    return {
      uri: 'slack://workspace/threads',
      name: 'Workspace Thread Search',
      description: 'Search threads across all accessible channels in the workspace',
      mimeType: 'application/json',
      requiresAuth: true,
      cacheable: true,
      generator: {
        type: 'cached',
        refreshInterval: 300000 // 5 minutes - workspace search is expensive
      }
    };
  }

  /**
   * Generate workspace threads content
   */
  static async generateWorkspaceThreadsContent(params: ThreadResourceParams): Promise<string> {
    try {
      logger.info('Generating workspace threads content', { params });

      if (!params.query || params.query.trim().length === 0) {
        const errorResult = {
          success: false,
          error: 'Query parameter is required for workspace thread search',
          example_usage: 'slack://workspace/threads?query=project%20discussion&limit=20&sort=activity',
          retrieved_at: new Date().toISOString()
        };
        return JSON.stringify(errorResult, null, 2);
      }

      // Authenticate with Slack
      const auth = new SlackAuth();
      const authResult = await auth.authenticate();
      
      if (!authResult.success || !authResult.tokens) {
        throw new Error(authResult.error || 'Authentication failed');
      }

      // Create API client
      const client = new SlackClient(authResult.tokens);

      // Get all accessible channels
      const channels = await client.getChannels();
      const searchQuery = decodeURIComponent(params.query.trim()).toLowerCase();
      const limit = parseInt(params.limit || '20');
      
      const allThreads: ThreadSummary[] = [];
      const channelsSearched: string[] = [];

      // Search through channels (limit to first 10 channels to avoid timeout)
      const searchChannels = channels.slice(0, 10);
      
      for (const channel of searchChannels) {
        try {
          channelsSearched.push(channel.id);
          
          // Get recent messages from channel
          const messages = await client.getConversationHistory(channel.id, 100);
          
          // Find threads that match search query
          const threadMessages = messages.filter(msg => {
            if (!msg.reply_count || msg.reply_count === 0) return false;
            
            const text = (msg.text || '').toLowerCase();
            return text.includes(searchQuery);
          });

          // Convert to thread summaries
          const channelThreads: ThreadSummary[] = threadMessages.map(msg => ({
            thread_ts: msg.ts,
            channel: channel.id,
            title: this.extractThreadTitle(msg.text || ''),
            reply_count: msg.reply_count || 0,
            last_reply: msg.latest_reply || msg.ts,
            participants_count: 1, // Simplified for performance
            status: 'active',
            preview_text: this.truncateText(msg.text || '', 100)
          }));

          allThreads.push(...channelThreads);
          
        } catch (error) {
          logger.warn(`Failed to search channel ${channel.id}`, { error });
          continue;
        }
      }

      // Sort results
      const sortBy = (params.sort as 'timestamp' | 'replies' | 'activity') || 'activity';
      allThreads.sort((a, b) => {
        if (sortBy === 'replies') {
          return b.reply_count - a.reply_count;
        } else if (sortBy === 'activity') {
          return parseFloat(b.last_reply) - parseFloat(a.last_reply);
        } else {
          return parseFloat(b.thread_ts) - parseFloat(a.thread_ts);
        }
      });

      // Apply limit
      const limitedThreads = allThreads.slice(0, limit);

      const result: ThreadSearchResult = {
        success: true,
        threads: limitedThreads,
        total: limitedThreads.length,
        has_more: allThreads.length > limit,
        parameters: params,
        search_metadata: {
          query: searchQuery,
          search_time: new Date().toISOString(),
          execution_time_ms: 0, // Would be calculated in real implementation
          channels_searched: channelsSearched
        },
        retrieved_at: new Date().toISOString()
      };

      logger.info('Workspace threads content generated successfully', {
        query: searchQuery,
        threadsFound: allThreads.length,
        channelsSearched: channelsSearched.length
      });

      return JSON.stringify(result, null, 2);

    } catch (error) {
      logger.error('Failed to generate workspace threads content', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        params 
      });

      const errorResult: ThreadErrorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error searching workspace threads',
        retrieved_at: new Date().toISOString()
      };

      return JSON.stringify(errorResult, null, 2);
    }
  }

  /**
   * Resource 5: Advanced Thread Search
   * URI: slack://search/threads
   */
  static createThreadSearchResource(): SlackMCPResource {
    return {
      uri: 'slack://search/threads',
      name: 'Advanced Thread Search',
      description: 'Advanced thread search with filtering by reply count, participants, and age',
      mimeType: 'application/json',
      requiresAuth: true,
      cacheable: true,
      generator: {
        type: 'cached',
        refreshInterval: 180000 // 3 minutes
      }
    };
  }

  /**
   * Generate advanced thread search content
   */
  static async generateThreadSearchContent(params: ThreadResourceParams): Promise<string> {
    try {
      logger.info('Generating advanced thread search content', { params });

      if (!params.query || params.query.trim().length === 0) {
        const errorResult = {
          success: false,
          error: 'Query parameter is required for thread search',
          example_usage: 'slack://search/threads?query=design&min_replies=3&channel=C1234567890',
          available_filters: {
            query: 'Search term (required)',
            min_replies: 'Minimum reply count',
            max_replies: 'Maximum reply count', 
            channel: 'Filter by specific channel',
            user: 'Filter by thread creator',
            oldest: 'Oldest thread timestamp',
            latest: 'Latest thread timestamp',
            limit: 'Number of results (default: 20)'
          },
          retrieved_at: new Date().toISOString()
        };
        return JSON.stringify(errorResult, null, 2);
      }

      // For now, delegate to workspace search but with enhanced filtering
      // This could be expanded with more sophisticated search algorithms
      const workspaceResult = await this.generateWorkspaceThreadsContent(params);
      const workspaceData = JSON.parse(workspaceResult) as ThreadSearchResult;

      if (!workspaceData.success) {
        return workspaceResult; // Return error as-is
      }

      // Apply advanced filters
      let filteredThreads = workspaceData.threads;

      if (params.min_replies) {
        const minReplies = parseInt(params.min_replies);
        filteredThreads = filteredThreads.filter(thread => thread.reply_count >= minReplies);
      }

      if (params.max_replies) {
        const maxReplies = parseInt(params.max_replies);
        filteredThreads = filteredThreads.filter(thread => thread.reply_count <= maxReplies);
      }

      if (params.channel) {
        filteredThreads = filteredThreads.filter(thread => thread.channel === params.channel);
      }

      const result: ThreadSearchResult = {
        ...workspaceData,
        threads: filteredThreads,
        total: filteredThreads.length,
        search_metadata: {
          ...workspaceData.search_metadata,
          query: params.query,
          search_time: new Date().toISOString()
        }
      };

      logger.info('Advanced thread search content generated successfully', {
        originalCount: workspaceData.threads.length,
        filteredCount: filteredThreads.length,
        filters: { min_replies: params.min_replies, max_replies: params.max_replies, channel: params.channel }
      });

      return JSON.stringify(result, null, 2);

    } catch (error) {
      logger.error('Failed to generate advanced thread search content', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        params 
      });

      const errorResult: ThreadErrorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in advanced thread search',
        retrieved_at: new Date().toISOString()
      };

      return JSON.stringify(errorResult, null, 2);
    }
  }

  /**
   * Extract thread parameters from URI
   */
  static extractThreadParamsFromUri(uri: string): ThreadResourceParams {
    const params: ThreadResourceParams = {};
    
    try {
      const urlObj = new URL(uri.replace('slack://', 'http://'));
      urlObj.searchParams.forEach((value, key) => {
        (params as any)[key] = value;
      });
    } catch (error) {
      logger.warn('Failed to parse thread parameters from URI', { uri, error });
    }
    
    return params;
  }

  /**
   * Extract thread timestamp from dynamic URI
   */
  static extractThreadTsFromUri(uri: string): string | null {
    const match = uri.match(/^slack:\/\/threads\/([^\/]+)\/(?:details|replies)(?:\?.*)?$/);
    if (!match) return null;
    
    const threadTs = match[1];
    // Validate thread timestamp format
    if (!/^\d+\.\d+$/.test(threadTs)) {
      return null;
    }
    
    return threadTs;
  }

  /**
   * Extract channel ID from thread URI context (if available)
   */
  static extractChannelFromThreadUri(uri: string): string | null {
    try {
      const urlObj = new URL(uri.replace('slack://', 'http://'));
      return urlObj.searchParams.get('channel');
    } catch {
      return null;
    }
  }

  /**
   * Helper: Extract thread title from message text
   */
  private static extractThreadTitle(text: string): string {
    // Remove markdown formatting and get first meaningful part
    const clean = text.replace(/[*_`~]/g, '').replace(/\n/g, ' ').trim();
    
    // If it starts with a question, use the whole question
    if (clean.match(/^[A-Z][^.!?]*\?/)) {
      return clean.split('?')[0] + '?';
    }
    
    // Otherwise take first sentence or first 50 characters
    const firstSentence = clean.split(/[.!]/)[0];
    if (firstSentence.length > 0 && firstSentence.length <= 60) {
      return firstSentence;
    }
    
    return clean.substring(0, 50) + (clean.length > 50 ? '...' : '');
  }

  /**
   * Helper: Truncate text to specified length
   */
  private static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}