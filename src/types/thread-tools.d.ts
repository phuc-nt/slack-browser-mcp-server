/**
 * Type definitions for Sprint 3.2 Thread Management Tools
 * Advanced thread operations với comprehensive type safety
 */
import { SlackMessage } from '../slack/types.js';
/**
 * Base parameters for thread tool operations
 */
export interface ThreadToolParams {
    thread_ts: string;
    channel_id: string;
    limit?: number;
    cursor?: string;
    include_reactions?: boolean;
    include_stats?: boolean;
}
/**
 * Thread context result - complete thread information
 */
export interface ThreadContextResult {
    thread_ts: string;
    channel: string;
    channel_name?: string;
    parent_message: SlackMessage;
    replies: SlackMessage[];
    participants: string[];
    total_replies: number;
    last_activity: string;
    thread_age_hours: number;
    status: 'active' | 'resolved' | 'archived';
    metadata: {
        created_at: string;
        updated_at: string;
        is_broadcast?: boolean;
        reply_users_count: number;
        reply_count: number;
        latest_reply?: string;
    };
}
/**
 * Paginated thread navigation result
 */
export interface ThreadNavigationResult {
    replies: SlackMessage[];
    has_more: boolean;
    next_cursor?: string;
    prev_cursor?: string;
    total_count: number;
    current_page?: number;
    page_size: number;
}
/**
 * AI-powered thread summary
 */
export interface ThreadSummary {
    thread_ts: string;
    title: string;
    key_points: string[];
    action_items?: string[];
    decisions?: string[];
    resolution?: string;
    participant_count: number;
    reply_count: number;
    summary_style: 'brief' | 'detailed' | 'action_items';
    confidence_score: number;
    summary_generated_at: string;
    tags?: string[];
}
/**
 * Thread participant analysis
 */
export interface ThreadParticipant {
    user_id: string;
    user_name: string;
    real_name?: string;
    message_count: number;
    first_reply_ts: string;
    last_reply_ts: string;
    engagement_score: number;
    role: 'starter' | 'active' | 'casual' | 'observer';
    word_count: number;
    avg_response_time_minutes?: number;
}
/**
 * Thread participants analysis result
 */
export interface ThreadParticipantsResult {
    thread_ts: string;
    total_participants: number;
    active_participants: number;
    participants: ThreadParticipant[];
    engagement_stats: {
        avg_messages_per_user: number;
        most_active_user: string;
        participation_distribution: {
            starters: number;
            active: number;
            casual: number;
            observers: number;
        };
    };
    analysis_generated_at: string;
}
/**
 * Bulk thread operations arguments
 */
export interface BulkThreadActionsArgs {
    action: 'resolve' | 'archive' | 'summarize' | 'analyze' | 'delete';
    thread_list: Array<{
        thread_ts: string;
        channel_id: string;
    }>;
    parameters?: Record<string, any>;
    batch_size?: number;
    dry_run?: boolean;
}
/**
 * Bulk operation result
 */
export interface BulkActionResult {
    action: string;
    total_requested: number;
    processed: number;
    successful: number;
    failed: number;
    skipped: number;
    results: Array<{
        thread_ts: string;
        channel_id: string;
        success: boolean;
        result?: any;
        error?: string;
        processing_time_ms: number;
    }>;
    total_processing_time_ms: number;
    batch_info: {
        batch_size: number;
        total_batches: number;
        avg_batch_time_ms: number;
    };
}
/**
 * Thread creation arguments
 */
export interface CreateThreadArgs {
    channel_id: string;
    message_ts: string;
    initial_reply?: string;
    broadcast?: boolean;
}
/**
 * Thread resolution arguments
 */
export interface ResolveThreadArgs {
    thread_ts: string;
    channel_id: string;
    resolution_summary?: string;
    mark_with_reaction?: boolean;
    notify_participants?: boolean;
}
/**
 * Thread archival arguments
 */
export interface ArchiveThreadArgs {
    thread_ts: string;
    channel_id: string;
    archive_reason?: string;
    pin_thread?: boolean;
    add_to_bookmarks?: boolean;
}
/**
 * Thread summarization arguments
 */
export interface SummarizeThreadArgs {
    thread_ts: string;
    channel_id: string;
    summary_style?: 'brief' | 'detailed' | 'action_items';
    max_length?: number;
    include_participants?: boolean;
    focus_keywords?: string[];
}
/**
 * Get thread participants arguments
 */
export interface GetThreadParticipantsArgs {
    thread_ts: string;
    channel_id: string;
    include_stats?: boolean;
    min_messages?: number;
    sort_by?: 'messages' | 'engagement' | 'chronological';
}
/**
 * Navigation arguments for thread replies
 */
export interface NavigateThreadRepliesArgs {
    thread_ts: string;
    channel_id: string;
    cursor?: string;
    limit?: number;
    direction?: 'forward' | 'backward';
    include_parent?: boolean;
}
/**
 * Error types for thread operations
 */
export interface ThreadOperationError {
    code: string;
    message: string;
    details?: any;
    thread_ts?: string;
    channel_id?: string;
    timestamp: string;
}
/**
 * Common thread operation result wrapper
 */
export interface ThreadOperationResult<T = any> {
    success: boolean;
    data?: T;
    error?: ThreadOperationError;
    processing_time_ms: number;
    api_calls_made: number;
    cached_data_used: boolean;
}
//# sourceMappingURL=thread-tools.d.ts.map