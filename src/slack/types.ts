/**
 * Slack API Types
 * Type definitions for Slack API responses
 */

export interface SlackApiResponse {
  ok: boolean;
  error?: string;
}

export interface SlackAuthTestResponse extends SlackApiResponse {
  user_id: string;
  user: string;
  team: string;
  team_id: string;
  url: string;
}

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
  is_private?: boolean;
  is_archived?: boolean;
  is_member?: boolean;
  topic?: {
    value: string;
    creator: string;
    last_set: number;
  };
  purpose?: {
    value: string;
    creator: string;
    last_set: number;
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
  replies?: Array<{
    user: string;
    ts: string;
  }>;
  latest_reply?: string;  // Timestamp of latest reply in thread
  reactions?: Array<{
    name: string;
    count: number;
    users: string[];
  }>;
  reply_broadcast?: boolean;
}

export interface SlackConversationsListResponse extends SlackApiResponse {
  channels: SlackChannel[];
  response_metadata?: {
    next_cursor?: string;
  };
}

export interface SlackUsersListResponse extends SlackApiResponse {
  members: SlackUser[];
  response_metadata?: {
    next_cursor?: string;
  };
}

export interface SlackConversationsHistoryResponse extends SlackApiResponse {
  messages: SlackMessage[];
  has_more?: boolean;
  response_metadata?: {
    next_cursor?: string;
  };
}

export interface SlackPostMessageResponse extends SlackApiResponse {
  channel: string;
  ts: string;
  message: SlackMessage;
}
