/**
 * Thread-specific type definitions for Slack MCP Server
 * Used for thread resources and thread management operations
 */

import { SlackMessage } from '../slack/types.js';

/**
 * Thread metadata interface - complete information about a thread
 */
export interface ThreadMetadata {
  thread_ts: string;                    // Thread timestamp (parent message)
  parent_message: SlackMessage;         // Complete parent message object
  channel: string;                      // Channel ID where thread exists
  reply_count: number;                  // Number of replies in thread
  participants: string[];               // User IDs who participated
  last_activity: string;                // Timestamp of last reply
  created_at: string;                   // Thread creation timestamp
  status: 'active' | 'resolved' | 'archived';  // Thread status
}

/**
 * Thread summary interface - lightweight thread information
 */
export interface ThreadSummary {
  thread_ts: string;                    // Thread timestamp
  channel: string;                      // Channel ID
  title: string;                        // Extracted from parent message text
  reply_count: number;                  // Number of replies
  last_reply: string;                   // Timestamp of last reply
  participants_count: number;           // Count of unique participants
  status: 'active' | 'resolved' | 'archived';
  preview_text: string;                 // First 100 chars of parent message
}

/**
 * Thread participant information
 */
export interface ThreadParticipant {
  user_id: string;                      // Slack user ID
  user_name?: string;                   // Display name (if available)
  message_count: number;                // Number of messages in thread
  first_reply: string;                  // Timestamp of first participation
  last_reply: string;                   // Timestamp of last message
  role: 'creator' | 'participant' | 'viewer';  // Participation level
}

/**
 * Complete thread information with participants
 */
export interface ThreadDetails {
  thread_ts: string;
  channel: string;
  parent_message: SlackMessage;
  reply_count: number;
  participants: ThreadParticipant[];
  last_activity: string;
  thread_age_hours: number;
  status: 'active' | 'resolved' | 'archived';
  created_at: string;
  updated_at: string;
}

/**
 * Thread search parameters for filtering and pagination
 */
export interface ThreadSearchParams {
  query?: string;                       // Search term in thread content
  limit?: string;                       // Number of results (default: 20)
  oldest?: string;                      // Oldest thread timestamp
  latest?: string;                      // Latest thread timestamp
  has_replies?: string;                 // Filter threads with replies
  min_replies?: string;                 // Minimum reply count
  max_replies?: string;                 // Maximum reply count
  sort?: 'timestamp' | 'replies' | 'activity'; // Sort order
  channel?: string;                     // Filter by channel
  user?: string;                        // Filter by thread creator
  status?: string;                      // Filter by thread status
}

/**
 * Thread resource parameters - extends search params for resource URIs
 */
export interface ThreadResourceParams extends ThreadSearchParams {
  include_archived?: string;            // Include archived threads
  participants?: string;                // Filter by participant user IDs
  after?: string;                       // Pagination cursor
  before?: string;                      // Pagination cursor
}

/**
 * Thread search result container
 */
export interface ThreadSearchResult {
  success: boolean;
  threads: ThreadSummary[];
  total: number;
  has_more: boolean;
  parameters: ThreadResourceParams;
  search_metadata: {
    query?: string;
    search_time: string;
    execution_time_ms: number;
    channels_searched?: string[];
  };
  retrieved_at: string;
}

/**
 * Channel threads result container
 */
export interface ChannelThreadsResult {
  success: boolean;
  channel: string;
  threads: ThreadSummary[];
  total: number;
  has_more: boolean;
  channel_info?: {
    name: string;
    is_private: boolean;
    member_count: number;
  };
  parameters: ThreadResourceParams;
  retrieved_at: string;
}

/**
 * Thread details result container
 */
export interface ThreadDetailsResult {
  success: boolean;
  thread: ThreadDetails;
  context?: {
    channel_name: string;
    surrounding_messages?: SlackMessage[];
  };
  retrieved_at: string;
}

/**
 * Thread replies result container
 */
export interface ThreadRepliesResult {
  success: boolean;
  thread_ts: string;
  channel: string;
  parent_message: SlackMessage;
  replies: SlackMessage[];
  total_replies: number;
  has_more: boolean;
  parameters: {
    limit: number;
    oldest?: string;
    latest?: string;
  };
  thread_metadata: {
    participants_count: number;
    created_at: string;
    last_activity: string;
  };
  retrieved_at: string;
}

/**
 * Error result for thread operations
 */
export interface ThreadErrorResult {
  success: false;
  error: string;
  error_code?: 'THREAD_NOT_FOUND' | 'CHANNEL_NOT_FOUND' | 'ACCESS_DENIED' | 'INVALID_PARAMETERS';
  thread_ts?: string;
  channel?: string;
  retrieved_at: string;
}