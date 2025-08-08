/**
 * Type definitions for Sprint 3.2 Thread Management Tools
 * Advanced thread operations với comprehensive type safety
 */

import { SlackMessage } from '../slack/types.js';

/**
 * Base parameters for thread tool operations
 */
export interface ThreadToolParams {
  thread_ts: string;          // Thread timestamp (required)
  channel_id: string;         // Channel ID containing thread (required)
  limit?: number;             // Pagination limit (optional)
  cursor?: string;            // Pagination cursor (optional)
  include_reactions?: boolean; // Include message reactions (optional)
  include_stats?: boolean;    // Include detailed statistics (optional)
}

/**
 * Thread context result - complete thread information
 */
export interface ThreadContextResult {
  thread_ts: string;           // Thread timestamp
  channel: string;             // Channel ID
  channel_name?: string;       // Channel name (if available)
  parent_message: SlackMessage; // Original thread starter message
  replies: SlackMessage[];     // All thread replies
  participants: string[];      // Unique participant user IDs
  total_replies: number;       // Total reply count
  last_activity: string;       // Timestamp of last activity
  thread_age_hours: number;    // Age of thread in hours
  status: 'active' | 'resolved' | 'archived'; // Thread status
  metadata: {
    created_at: string;        // Thread creation timestamp
    updated_at: string;        // Last update timestamp
    is_broadcast?: boolean;     // Is broadcast to channel
    reply_users_count: number; // Number of unique repliers
    reply_count: number;       // Total reply count
    latest_reply?: string;     // Latest reply timestamp
  };
}

/**
 * Paginated thread navigation result
 */
export interface ThreadNavigationResult {
  replies: SlackMessage[];     // Paginated replies
  has_more: boolean;           // More results available
  next_cursor?: string;        // Next page cursor
  prev_cursor?: string;        // Previous page cursor
  total_count: number;         // Total reply count
  current_page?: number;       // Current page number
  page_size: number;           // Results per page
}

/**
 * AI-powered thread summary
 */
export interface ThreadSummary {
  thread_ts: string;           // Source thread timestamp
  title: string;               // Generated thread title
  key_points: string[];        // Important discussion points
  action_items?: string[];     // Identified action items
  decisions?: string[];        // Decisions made in thread
  resolution?: string;         // Resolution summary if resolved
  participant_count: number;   // Number of participants
  reply_count: number;         // Total reply count
  summary_style: 'brief' | 'detailed' | 'action_items'; // Summary type
  confidence_score: number;    // AI confidence (0-1)
  summary_generated_at: string; // Generation timestamp
  tags?: string[];             // Auto-generated tags
}

/**
 * Thread participant analysis
 */
export interface ThreadParticipant {
  user_id: string;             // Slack user ID
  user_name: string;           // Display name
  real_name?: string;          // Real name if available
  message_count: number;       // Number of messages in thread
  first_reply_ts: string;      // First reply timestamp
  last_reply_ts: string;       // Last reply timestamp
  engagement_score: number;    // Engagement score (0-100)
  role: 'starter' | 'active' | 'casual' | 'observer'; // Participation level
  word_count: number;          // Total words contributed
  avg_response_time_minutes?: number; // Average response time
}

/**
 * Thread participants analysis result
 */
export interface ThreadParticipantsResult {
  thread_ts: string;           // Source thread
  total_participants: number;  // Total unique participants
  active_participants: number; // Active contributors (>1 message)
  participants: ThreadParticipant[]; // Detailed participant data
  engagement_stats: {
    avg_messages_per_user: number;    // Average messages per participant
    most_active_user: string;         // Most active participant ID
    participation_distribution: {     // Distribution breakdown
      starters: number;               // Thread starter count (should be 1)
      active: number;                 // Active participants (>3 messages)
      casual: number;                 // Casual participants (1-3 messages)
      observers: number;              // Observers (reactions only)
    };
  };
  analysis_generated_at: string; // Analysis timestamp
}

/**
 * Bulk thread operations arguments
 */
export interface BulkThreadActionsArgs {
  action: 'resolve' | 'archive' | 'summarize' | 'analyze' | 'delete'; // Action type
  thread_list: Array<{         // List of threads to process
    thread_ts: string;
    channel_id: string;
  }>;
  parameters?: Record<string, any>; // Action-specific parameters
  batch_size?: number;         // Processing batch size (default: 5)
  dry_run?: boolean;           // Preview mode (don't execute)
}

/**
 * Bulk operation result
 */
export interface BulkActionResult {
  action: string;              // Action performed
  total_requested: number;     // Total threads requested
  processed: number;           // Successfully processed
  successful: number;          // Successful operations
  failed: number;              // Failed operations
  skipped: number;             // Skipped threads
  results: Array<{             // Individual results
    thread_ts: string;
    channel_id: string;
    success: boolean;
    result?: any;              // Operation-specific result
    error?: string;            // Error message if failed
    processing_time_ms: number; // Time taken for this operation
  }>;
  total_processing_time_ms: number; // Total processing time
  batch_info: {
    batch_size: number;        // Configured batch size
    total_batches: number;     // Number of batches processed
    avg_batch_time_ms: number; // Average batch processing time
  };
}

/**
 * Thread creation arguments
 */
export interface CreateThreadArgs {
  channel_id: string;          // Target channel
  message_ts: string;          // Source message to create thread from
  initial_reply?: string;      // Optional initial reply text
  broadcast?: boolean;         // Broadcast reply to channel
}

/**
 * Thread resolution arguments  
 */
export interface ResolveThreadArgs {
  thread_ts: string;           // Thread to resolve
  channel_id: string;          // Channel containing thread
  resolution_summary?: string; // Optional resolution notes
  mark_with_reaction?: boolean; // Add resolved reaction (default: true)
  notify_participants?: boolean; // Notify all participants
}

/**
 * Thread archival arguments
 */
export interface ArchiveThreadArgs {
  thread_ts: string;           // Thread to archive
  channel_id: string;          // Channel containing thread
  archive_reason?: string;     // Optional archival reason
  pin_thread?: boolean;        // Pin before archiving
  add_to_bookmarks?: boolean;  // Add to channel bookmarks
}

/**
 * Thread summarization arguments
 */
export interface SummarizeThreadArgs {
  thread_ts: string;           // Thread to summarize
  channel_id: string;          // Channel containing thread
  summary_style?: 'brief' | 'detailed' | 'action_items'; // Summary type
  max_length?: number;         // Maximum summary length in characters
  include_participants?: boolean; // Include participant info
  focus_keywords?: string[];   // Keywords to focus on
}

/**
 * Get thread participants arguments
 */
export interface GetThreadParticipantsArgs {
  thread_ts: string;           // Thread to analyze
  channel_id: string;          // Channel containing thread
  include_stats?: boolean;     // Include detailed statistics
  min_messages?: number;       // Minimum messages to include participant
  sort_by?: 'messages' | 'engagement' | 'chronological'; // Sorting method
}

/**
 * Navigation arguments for thread replies
 */
export interface NavigateThreadRepliesArgs {
  thread_ts: string;           // Thread to navigate
  channel_id: string;          // Channel containing thread
  cursor?: string;             // Pagination cursor
  limit?: number;              // Results per page (default: 20)
  direction?: 'forward' | 'backward'; // Navigation direction
  include_parent?: boolean;    // Include parent message
}

/**
 * Error types for thread operations
 */
export interface ThreadOperationError {
  code: string;                // Error code
  message: string;             // Human readable message
  details?: any;               // Additional error details
  thread_ts?: string;          // Related thread if applicable
  channel_id?: string;         // Related channel if applicable
  timestamp: string;           // Error occurrence time
}

/**
 * Common thread operation result wrapper
 */
export interface ThreadOperationResult<T = any> {
  success: boolean;            // Operation success status
  data?: T;                    // Result data if successful
  error?: ThreadOperationError; // Error info if failed
  processing_time_ms: number;  // Operation duration
  api_calls_made: number;      // Slack API calls consumed
  cached_data_used: boolean;   // Whether cache was utilized
}