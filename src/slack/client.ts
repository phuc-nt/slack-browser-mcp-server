/**
 * Slack API Client
 * Core client for making Slack API calls with stealth mode
 */

import { SlackTokens } from './auth.js';
import {
  SlackConversationsListResponse,
  SlackUsersListResponse,
  SlackConversationsHistoryResponse,
  SlackPostMessageResponse,
  SlackChannel,
  SlackUser,
  SlackMessage,
} from './types.js';

export class SlackClient {
  private tokens: SlackTokens;
  private baseUrl = 'https://slack.com/api';

  constructor(tokens: SlackTokens) {
    this.tokens = tokens;
  }

  /**
   * Make authenticated request to Slack API
   */
  private async makeRequest<T>(endpoint: string, data?: Record<string, any>): Promise<T> {
    const url = `${this.baseUrl}/${endpoint}`;

    // Prepare form data if provided
    const formData = new URLSearchParams();
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.tokens.xoxc}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: `d=${this.tokens.xoxd}`,
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = (await response.json()) as T;
    return result;
  }

  /**
   * Get list of channels user has access to
   */
  async getChannels(options?: {
    exclude_archived?: boolean;
    types?: string;
    limit?: number;
    cursor?: string;
  }): Promise<
    | SlackChannel[]
    | {
        ok: boolean;
        error?: string;
        channels?: SlackChannel[];
        response_metadata?: any;
      }
  > {
    try {
      const params: any = {
        types: options?.types || 'public_channel,private_channel,mpim,im',
        exclude_archived:
          options?.exclude_archived !== undefined ? options.exclude_archived : false,
        limit: options?.limit || 1000,
      };

      if (options?.cursor) {
        params.cursor = options.cursor;
      }

      const response = await this.makeRequest<SlackConversationsListResponse>(
        'conversations.list',
        params
      );

      if (!response.ok) {
        // If options are provided, return full response for tool compatibility
        if (options) {
          return {
            ok: false,
            error: response.error || 'Unknown error',
          };
        }
        throw new Error(`Slack API error: ${response.error || 'Unknown error'}`);
      }

      // If options are provided, return full response for tool compatibility
      if (options) {
        return {
          ok: true,
          channels: response.channels || [],
          response_metadata: response.response_metadata,
        };
      }

      // For backwards compatibility, return just channels array when no options
      return response.channels || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // If options are provided, return error response for tool compatibility
      if (options) {
        return {
          ok: false,
          error: `Failed to get channels: ${errorMessage}`,
        };
      }

      throw new Error(`Failed to get channels: ${errorMessage}`);
    }
  }

  /**
   * Get list of users in workspace
   */
  async getUsers(options?: { include_locale?: boolean; limit?: number; cursor?: string }): Promise<
    | SlackUser[]
    | {
        ok: boolean;
        error?: string;
        members?: SlackUser[];
        response_metadata?: any;
      }
  > {
    try {
      const params: any = {
        limit: options?.limit || 1000,
      };

      if (options?.include_locale) {
        params.include_locale = options.include_locale;
      }

      if (options?.cursor) {
        params.cursor = options.cursor;
      }

      const response = await this.makeRequest<SlackUsersListResponse>('users.list', params);

      if (!response.ok) {
        // If options are provided, return full response for tool compatibility
        if (options) {
          return {
            ok: false,
            error: response.error || 'Unknown error',
          };
        }
        throw new Error(`Slack API error: ${response.error || 'Unknown error'}`);
      }

      // If options are provided, return full response for tool compatibility
      if (options) {
        return {
          ok: true,
          members: response.members || [],
          response_metadata: response.response_metadata,
        };
      }

      // For backwards compatibility, return just members array when no options
      return response.members || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // If options are provided, return error response for tool compatibility
      if (options) {
        return {
          ok: false,
          error: `Failed to get users: ${errorMessage}`,
        };
      }

      throw new Error(`Failed to get users: ${errorMessage}`);
    }
  }

  /**
   * Get conversation history from a channel
   */
  async getConversationHistory(channelId: string, limit: number = 100): Promise<SlackMessage[]> {
    try {
      const response = await this.makeRequest<SlackConversationsHistoryResponse>(
        'conversations.history',
        {
          channel: channelId,
          limit,
        }
      );

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.error || 'Unknown error'}`);
      }

      return response.messages || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get conversation history: ${errorMessage}`);
    }
  }

  /**
   * Get conversation history with time range support and pagination
   * Used for time-range thread collection (Sprint 6.2)
   */
  async getConversationHistoryWithTimeRange(
    channelId: string,
    options: {
      oldest?: string;
      latest?: string;
      inclusive?: boolean;
      limit?: number;
      cursor?: string;
    }
  ): Promise<{
    ok: boolean;
    messages?: SlackMessage[];
    response_metadata?: { next_cursor?: string };
    error?: string;
  }> {
    try {
      const params: any = {
        channel: channelId,
        limit: options.limit || 999,
        inclusive: options.inclusive !== false,
      };

      if (options.oldest) {
        params.oldest = options.oldest;
      }

      if (options.latest) {
        params.latest = options.latest;
      }

      if (options.cursor) {
        params.cursor = options.cursor;
      }

      const response = await this.makeRequest<SlackConversationsHistoryResponse>(
        'conversations.history',
        params
      );

      return {
        ok: response.ok,
        messages: response.messages,
        response_metadata: response.response_metadata,
        error: response.error,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        ok: false,
        error: `Failed to get conversation history with time range: ${errorMessage}`,
      };
    }
  }

  /**
   * Post message to channel
   */
  async postMessage(
    channel: string,
    text: string,
    threadTs?: string,
    blocks?: any[],
    attachments?: any[],
    unfurlLinks?: boolean
  ): Promise<SlackPostMessageResponse> {
    try {
      const data: Record<string, any> = {
        channel,
        text,
      };

      if (threadTs) {
        data.thread_ts = threadTs;
      }

      if (blocks && blocks.length > 0) {
        data.blocks = JSON.stringify(blocks);
      }

      if (attachments && attachments.length > 0) {
        data.attachments = JSON.stringify(attachments);
      }

      if (unfurlLinks !== undefined) {
        data.unfurl_links = unfurlLinks;
      }

      const response = await this.makeRequest<SlackPostMessageResponse>('chat.postMessage', data);

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.error || 'Unknown error'}`);
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to post message: ${errorMessage}`);
    }
  }

  /**
   * Update/edit an existing message
   */
  async updateMessage(
    channel: string,
    ts: string,
    text: string,
    blocks?: any[]
  ): Promise<SlackPostMessageResponse> {
    try {
      const data: Record<string, any> = {
        channel,
        ts,
        text,
      };

      if (blocks && blocks.length > 0) {
        data.blocks = JSON.stringify(blocks);
      }

      const response = await this.makeRequest<SlackPostMessageResponse>('chat.update', data);

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.error || 'Unknown error'}`);
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update message: ${errorMessage}`);
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(
    channel: string,
    ts: string
  ): Promise<{ ok: boolean; channel: string; ts: string }> {
    try {
      const response = await this.makeRequest<{ ok: boolean; channel: string; ts: string }>(
        'chat.delete',
        {
          channel,
          ts,
        }
      );

      if (!response.ok) {
        throw new Error(`Slack API error: Failed to delete message`);
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete message: ${errorMessage}`);
    }
  }

  /**
   * Get conversation replies (thread replies)
   */
  async getConversationReplies(
    channelId: string,
    threadTs: string,
    options?: { limit?: number; cursor?: string; inclusive?: boolean; oldest?: string }
  ): Promise<{
    ok: boolean;
    messages?: SlackMessage[];
    response_metadata?: { next_cursor?: string };
    error?: string;
  }> {
    try {
      const params: any = {
        channel: channelId,
        ts: threadTs,
        limit: options?.limit || 100,
        inclusive: options?.inclusive !== false,
      };

      if (options?.cursor) {
        params.cursor = options.cursor;
      }

      if (options?.oldest) {
        params.oldest = options.oldest;
      }

      const response = await this.makeRequest<any>('conversations.replies', params);

      return {
        ok: response.ok,
        messages: response.messages,
        response_metadata: response.response_metadata,
        error: response.error,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        ok: false,
        error: `Failed to get conversation replies: ${errorMessage}`,
      };
    }
  }

  /**
   * Get conversation info
   */
  async getConversationInfo(
    channelId: string
  ): Promise<{ ok: boolean; channel?: SlackChannel; error?: string }> {
    try {
      const response = await this.makeRequest<any>('conversations.info', {
        channel: channelId,
      });

      return {
        ok: response.ok,
        channel: response.channel,
        error: response.error,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        ok: false,
        error: `Failed to get conversation info: ${errorMessage}`,
      };
    }
  }

  /**
   * Add reaction to message
   */
  async addReaction(
    channelId: string,
    messageTs: string,
    reaction: string
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const response = await this.makeRequest<any>('reactions.add', {
        channel: channelId,
        timestamp: messageTs,
        name: reaction,
      });

      return {
        ok: response.ok,
        error: response.error,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        ok: false,
        error: `Failed to add reaction: ${errorMessage}`,
      };
    }
  }

  /**
   * Pin message
   */
  async pinMessage(channelId: string, messageTs: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const response = await this.makeRequest<any>('pins.add', {
        channel: channelId,
        timestamp: messageTs,
      });

      return {
        ok: response.ok,
        error: response.error,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        ok: false,
        error: `Failed to pin message: ${errorMessage}`,
      };
    }
  }

  /**
   * Get permalink for message
   */
  async getPermalink(
    channelId: string,
    messageTs: string
  ): Promise<{ ok: boolean; permalink?: string; error?: string }> {
    try {
      const response = await this.makeRequest<any>('chat.getPermalink', {
        channel: channelId,
        message_ts: messageTs,
      });

      return {
        ok: response.ok,
        permalink: response.permalink,
        error: response.error,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        ok: false,
        error: `Failed to get permalink: ${errorMessage}`,
      };
    }
  }

  /**
   * Test API connection
   */
  /**
   * Search messages using search.inline API
   */
  async searchInline(params: {
    channel: string;
    query: string;
    count?: number;
    page?: number;
    thread_replies?: boolean;
    extract_len?: number;
  }): Promise<{
    ok: boolean;
    error?: string;
    items?: any[];
    pagination?: any;
  }> {
    const response = await this.makeRequest<{
      ok: boolean;
      error?: string;
      items?: any[];
      pagination?: any;
    }>('search.inline', {
      channel: params.channel,
      query: params.query,
      count: params.count || 3,
      page: params.page || 1,
      thread_replies: params.thread_replies !== false ? 1 : 0,
      extract_len: params.extract_len || 110,
    });

    return response;
  }

  /**
   * Search messages using search.modules.messages API
   */
  async searchMessages(params: {
    module: string;
    query: string;
    count?: number;
    page?: number;
    sort?: string;
    sort_dir?: string;
    extracts?: number;
    highlight?: number;
    max_extract_len?: number;
    search_exclude_bots?: number;
  }): Promise<{
    ok: boolean;
    error?: string;
    items?: any[];
    pagination?: any;
    filters?: any;
    filter_suggestions?: any;
  }> {
    const response = await this.makeRequest<{
      ok: boolean;
      error?: string;
      items?: any[];
      pagination?: any;
      filters?: any;
      filter_suggestions?: any;
    }>('search.modules.messages', {
      module: params.module,
      query: params.query,
      count: params.count || 20,
      page: params.page || 1,
      sort: params.sort || 'score',
      sort_dir: params.sort_dir || 'desc',
      extracts: params.extracts || 1,
      highlight: params.highlight !== undefined ? params.highlight : 1,
      max_extract_len: params.max_extract_len || 200,
      search_exclude_bots: params.search_exclude_bots || 0,
    });

    return response;
  }

  /**
   * Search messages using search.messages API (Phase 6 Enhanced Search)
   */
  async searchMessagesAdvanced(params: {
    query: string;
    count?: number;
    page?: number;
    sort?: 'asc' | 'desc';
    highlight?: boolean;
    cursor?: string;
  }): Promise<{
    ok: boolean;
    error?: string;
    query?: string;
    messages?: {
      matches?: any[];
      total?: number;
      pagination?: {
        page: number;
        page_count: number;
        per_page: number;
        total_count: number;
      };
    };
  }> {
    const response = await this.makeRequest<{
      ok: boolean;
      error?: string;
      query?: string;
      messages?: {
        matches?: any[];
        total?: number;
        pagination?: {
          page: number;
          page_count: number;
          per_page: number;
          total_count: number;
        };
      };
    }>('search.messages', {
      query: params.query,
      count: params.count || 20,
      page: params.page || 1,
      sort: params.sort || 'desc',
      highlight: params.highlight !== false ? true : false,
      ...(params.cursor && { cursor: params.cursor }),
    });

    return response;
  }

  /**
   * Search files using search.files API (Phase 6 Enhanced Search)
   */
  async searchFiles(params: {
    query: string;
    count?: number;
    page?: number;
    sort?: 'score' | 'timestamp' | 'size';
    sort_dir?: 'asc' | 'desc';
    highlight?: boolean;
  }): Promise<{
    ok: boolean;
    error?: string;
    query?: string;
    files?: {
      matches?: any[];
      total?: number;
      pagination?: {
        page: number;
        page_count: number;
        per_page: number;
        total_count: number;
      };
    };
  }> {
    const response = await this.makeRequest<{
      ok: boolean;
      error?: string;
      query?: string;
      files?: {
        matches?: any[];
        total?: number;
        pagination?: {
          page: number;
          page_count: number;
          per_page: number;
          total_count: number;
        };
      };
    }>('search.files', {
      query: params.query,
      count: params.count || 20,
      page: params.page || 1,
      sort: params.sort || 'score',
      sort_dir: params.sort_dir || 'desc',
      highlight: params.highlight !== false ? true : false,
    });

    return response;
  }

  /**
   * Get user profile information
   */
  async getUserProfile(userId: string): Promise<{
    ok: boolean;
    profile?: {
      display_name?: string;
      real_name?: string;
      email?: string;
      first_name?: string;
      last_name?: string;
      title?: string;
      phone?: string;
      image_24?: string;
      image_32?: string;
      image_48?: string;
      image_72?: string;
      image_192?: string;
      image_512?: string;
      status_text?: string;
      status_emoji?: string;
    };
    error?: string;
  }> {
    try {
      const response = await this.makeRequest<{
        ok: boolean;
        profile?: any;
        error?: string;
      }>('users.profile.get', {
        user: userId,
        _x_reason: 'MemberProfileFlexpane',
        _x_mode: 'online',
        _x_sonic: 'true',
        _x_app_name: 'client',
      });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        ok: false,
        error: errorMessage,
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ ok: boolean }>('auth.test');
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
