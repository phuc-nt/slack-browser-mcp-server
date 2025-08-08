/**
 * Slack API Client
 * Core client for making Slack API calls with stealth mode
 */
export class SlackClient {
    tokens;
    baseUrl = 'https://slack.com/api';
    constructor(tokens) {
        this.tokens = tokens;
    }
    /**
     * Make authenticated request to Slack API
     */
    async makeRequest(endpoint, data) {
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
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            body: formData.toString(),
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const result = (await response.json());
        return result;
    }
    /**
     * Get list of channels user has access to
     */
    async getChannels() {
        try {
            const response = await this.makeRequest('conversations.list', {
                types: 'public_channel,private_channel,mpim,im',
                exclude_archived: false,
                limit: 1000,
            });
            if (!response.ok) {
                throw new Error(`Slack API error: ${response.error || 'Unknown error'}`);
            }
            return response.channels || [];
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to get channels: ${errorMessage}`);
        }
    }
    /**
     * Get list of users in workspace
     */
    async getUsers() {
        try {
            const response = await this.makeRequest('users.list', {
                limit: 1000,
            });
            if (!response.ok) {
                throw new Error(`Slack API error: ${response.error || 'Unknown error'}`);
            }
            return response.members || [];
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to get users: ${errorMessage}`);
        }
    }
    /**
     * Get conversation history from a channel
     */
    async getConversationHistory(channelId, limit = 100) {
        try {
            const response = await this.makeRequest('conversations.history', {
                channel: channelId,
                limit,
            });
            if (!response.ok) {
                throw new Error(`Slack API error: ${response.error || 'Unknown error'}`);
            }
            return response.messages || [];
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to get conversation history: ${errorMessage}`);
        }
    }
    /**
     * Post message to channel
     */
    async postMessage(channel, text, threadTs, blocks, attachments, unfurlLinks) {
        try {
            const data = {
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
            const response = await this.makeRequest('chat.postMessage', data);
            if (!response.ok) {
                throw new Error(`Slack API error: ${response.error || 'Unknown error'}`);
                ;
            }
            return response;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to post message: ${errorMessage}`);
        }
    }
    /**
     * Update/edit an existing message
     */
    async updateMessage(channel, ts, text, blocks) {
        try {
            const data = {
                channel,
                ts,
                text,
            };
            if (blocks && blocks.length > 0) {
                data.blocks = JSON.stringify(blocks);
            }
            const response = await this.makeRequest('chat.update', data);
            if (!response.ok) {
                throw new Error(`Slack API error: ${response.error || 'Unknown error'}`);
            }
            return response;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to update message: ${errorMessage}`);
        }
    }
    /**
     * Delete a message
     */
    async deleteMessage(channel, ts) {
        try {
            const response = await this.makeRequest('chat.delete', {
                channel,
                ts,
            });
            if (!response.ok) {
                throw new Error(`Slack API error: Failed to delete message`);
            }
            return response;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to delete message: ${errorMessage}`);
        }
    }
    /**
     * Get conversation replies (thread replies)
     */
    async getConversationReplies(channelId, threadTs, options) {
        try {
            const response = await this.makeRequest('conversations.replies', {
                channel: channelId,
                ts: threadTs,
                limit: options?.limit || 100,
                cursor: options?.cursor,
                inclusive: options?.inclusive !== false
            });
            return {
                ok: response.ok,
                messages: response.messages,
                response_metadata: response.response_metadata,
                error: response.error
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                ok: false,
                error: `Failed to get conversation replies: ${errorMessage}`
            };
        }
    }
    /**
     * Get conversation info
     */
    async getConversationInfo(channelId) {
        try {
            const response = await this.makeRequest('conversations.info', {
                channel: channelId
            });
            return {
                ok: response.ok,
                channel: response.channel,
                error: response.error
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                ok: false,
                error: `Failed to get conversation info: ${errorMessage}`
            };
        }
    }
    /**
     * Add reaction to message
     */
    async addReaction(channelId, messageTs, reaction) {
        try {
            const response = await this.makeRequest('reactions.add', {
                channel: channelId,
                timestamp: messageTs,
                name: reaction
            });
            return {
                ok: response.ok,
                error: response.error
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                ok: false,
                error: `Failed to add reaction: ${errorMessage}`
            };
        }
    }
    /**
     * Pin message
     */
    async pinMessage(channelId, messageTs) {
        try {
            const response = await this.makeRequest('pins.add', {
                channel: channelId,
                timestamp: messageTs
            });
            return {
                ok: response.ok,
                error: response.error
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                ok: false,
                error: `Failed to pin message: ${errorMessage}`
            };
        }
    }
    /**
     * Get permalink for message
     */
    async getPermalink(channelId, messageTs) {
        try {
            const response = await this.makeRequest('chat.getPermalink', {
                channel: channelId,
                message_ts: messageTs
            });
            return {
                ok: response.ok,
                permalink: response.permalink,
                error: response.error
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                ok: false,
                error: `Failed to get permalink: ${errorMessage}`
            };
        }
    }
    /**
     * Test API connection
     */
    async testConnection() {
        try {
            const response = await this.makeRequest('auth.test');
            return response.ok;
        }
        catch (error) {
            return false;
        }
    }
}
//# sourceMappingURL=client.js.map