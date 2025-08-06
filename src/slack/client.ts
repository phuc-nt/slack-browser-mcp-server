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
  async getChannels(): Promise<SlackChannel[]> {
    try {
      const response = await this.makeRequest<SlackConversationsListResponse>(
        'conversations.list',
        {
          types: 'public_channel,private_channel,mpim,im',
          exclude_archived: false,
          limit: 1000,
        }
      );

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.error || 'Unknown error'}`);
      }

      return response.channels || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get channels: ${errorMessage}`);
    }
  }

  /**
   * Get list of users in workspace
   */
  async getUsers(): Promise<SlackUser[]> {
    try {
      const response = await this.makeRequest<SlackUsersListResponse>('users.list', {
        limit: 1000,
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.error || 'Unknown error'}`);
      }

      return response.members || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
        throw new Error(`Slack API error: ${response.error || 'Unknown error'}`);;
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
  async deleteMessage(channel: string, ts: string): Promise<{ ok: boolean; channel: string; ts: string }> {
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
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ ok: boolean }>('auth.test');
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
