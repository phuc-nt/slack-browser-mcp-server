/**
 * Slack API Client
 * Core client for making Slack API calls with stealth mode
 */
import { SlackTokens } from './auth.js';
import { SlackPostMessageResponse, SlackChannel, SlackUser, SlackMessage } from './types.js';
export declare class SlackClient {
    private tokens;
    private baseUrl;
    constructor(tokens: SlackTokens);
    /**
     * Make authenticated request to Slack API
     */
    private makeRequest;
    /**
     * Get list of channels user has access to
     */
    getChannels(): Promise<SlackChannel[]>;
    /**
     * Get list of users in workspace
     */
    getUsers(): Promise<SlackUser[]>;
    /**
     * Get conversation history from a channel
     */
    getConversationHistory(channelId: string, limit?: number): Promise<SlackMessage[]>;
    /**
     * Post message to channel
     */
    postMessage(channel: string, text: string, threadTs?: string, blocks?: any[], attachments?: any[], unfurlLinks?: boolean): Promise<SlackPostMessageResponse>;
    /**
     * Update/edit an existing message
     */
    updateMessage(channel: string, ts: string, text: string, blocks?: any[]): Promise<SlackPostMessageResponse>;
    /**
     * Delete a message
     */
    deleteMessage(channel: string, ts: string): Promise<{
        ok: boolean;
        channel: string;
        ts: string;
    }>;
    /**
     * Get conversation replies (thread replies)
     */
    getConversationReplies(channelId: string, threadTs: string, options?: {
        limit?: number;
        cursor?: string;
        inclusive?: boolean;
    }): Promise<{
        ok: boolean;
        messages?: SlackMessage[];
        response_metadata?: {
            next_cursor?: string;
        };
        error?: string;
    }>;
    /**
     * Get conversation info
     */
    getConversationInfo(channelId: string): Promise<{
        ok: boolean;
        channel?: SlackChannel;
        error?: string;
    }>;
    /**
     * Add reaction to message
     */
    addReaction(channelId: string, messageTs: string, reaction: string): Promise<{
        ok: boolean;
        error?: string;
    }>;
    /**
     * Pin message
     */
    pinMessage(channelId: string, messageTs: string): Promise<{
        ok: boolean;
        error?: string;
    }>;
    /**
     * Get permalink for message
     */
    getPermalink(channelId: string, messageTs: string): Promise<{
        ok: boolean;
        permalink?: string;
        error?: string;
    }>;
    /**
     * Test API connection
     */
    testConnection(): Promise<boolean>;
}
//# sourceMappingURL=client.d.ts.map