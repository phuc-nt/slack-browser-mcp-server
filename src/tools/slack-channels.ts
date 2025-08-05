/**
 * Slack Channel Tools - IMPLEMENTED
 * Real Slack API integration for channel operations
 */

import { SlackAuth } from '../slack/auth.js';
import { SlackClient } from '../slack/client.js';

interface ListChannelsArgs {
  include_archived?: boolean;
  types?: string;
}

export async function listChannels(args: ListChannelsArgs = {}) {
  try {
    // Authenticate with Slack
    const auth = new SlackAuth();
    const authResult = await auth.authenticate();

    if (!authResult.success) {
      throw new Error(authResult.error || 'Authentication failed');
    }

    // Create API client
    const client = new SlackClient(authResult.tokens!);

    // Get channels
    const channels = await client.getChannels();

    // Filter archived channels if requested
    const filteredChannels = args.include_archived
      ? channels
      : channels.filter((channel) => !channel.is_archived);

    // Format response
    const channelList = filteredChannels.map((channel) => ({
      id: channel.id,
      name: channel.name,
      is_private: channel.is_private || false,
      is_archived: channel.is_archived || false,
      is_member: channel.is_member || false,
      topic: channel.topic?.value || '',
      purpose: channel.purpose?.value || '',
      num_members: channel.num_members || 0,
    }));

    return {
      success: true,
      channels: channelList,
      total: channelList.length,
      user: authResult.user,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage,
      channels: [],
    };
  }
}

interface ListUsersArgs {
  include_deleted?: boolean;
}

export async function listUsers(args: ListUsersArgs = {}) {
  try {
    // Authenticate with Slack
    const auth = new SlackAuth();
    const authResult = await auth.authenticate();

    if (!authResult.success) {
      throw new Error(authResult.error || 'Authentication failed');
    }

    // Create API client
    const client = new SlackClient(authResult.tokens!);

    // Get users
    const users = await client.getUsers();

    // Filter deleted users if requested
    const filteredUsers = args.include_deleted ? users : users.filter((user) => !user.deleted);

    // Format response
    const userList = filteredUsers.map((user) => ({
      id: user.id,
      name: user.name,
      real_name: user.real_name || '',
      display_name: user.display_name || '',
      email: user.email || '',
      is_bot: user.is_bot || false,
      deleted: user.deleted || false,
    }));

    return {
      success: true,
      users: userList,
      total: userList.length,
      user: authResult.user,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage,
      users: [],
    };
  }
}

interface GetChannelHistoryArgs {
  channel: string;
  limit?: number;
}

export async function getChannelHistory(args: GetChannelHistoryArgs) {
  try {
    // Authenticate with Slack
    const auth = new SlackAuth();
    const authResult = await auth.authenticate();

    if (!authResult.success) {
      throw new Error(authResult.error || 'Authentication failed');
    }

    // Create API client
    const client = new SlackClient(authResult.tokens!);

    // Get conversation history
    const messages = await client.getConversationHistory(args.channel, args.limit || 20);

    // Format response
    const messageList = messages.map((message) => ({
      ts: message.ts,
      user: message.user || 'system',
      text: message.text,
      type: message.type,
      thread_ts: message.thread_ts,
      reply_count: message.reply_count || 0,
    }));

    return {
      success: true,
      messages: messageList,
      total: messageList.length,
      channel: args.channel,
      user: authResult.user,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage,
      messages: [],
    };
  }
}
