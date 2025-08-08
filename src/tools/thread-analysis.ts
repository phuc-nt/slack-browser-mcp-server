/**
 * Sprint 3.2: Analysis Thread Tools Implementation  
 * Tools 6-7: summarize_thread, get_thread_participants
 */

import { BaseThreadTool } from './threads.js';
import { SlackAuth } from '../slack/auth.js';
import { SlackClient } from '../slack/client.js';
import { logger } from '../utils/logger.js';
import { 
  ToolContext, 
  ToolExecutionResult,
  ToolValidationResult 
} from '../types/tools.js';
import {
  SummarizeThreadArgs,
  GetThreadParticipantsArgs,
  ThreadSummary,
  ThreadParticipantsResult,
  ThreadParticipant,
  ThreadOperationResult
} from '../types/thread-tools.js';
import { SlackMessage } from '../slack/types.js';

/**
 * Tool 6: Summarize Thread  
 * Generates AI-powered summary of thread discussion
 */
export class SummarizeThreadTool extends BaseThreadTool {
  
  async execute(args: SummarizeThreadArgs, context: ToolContext): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    logger.info('Executing summarize_thread', { 
      thread_ts: args.thread_ts,
      channel_id: args.channel_id,
      summary_style: args.summary_style,
      max_length: args.max_length
    });

    try {
      // Validate input parameters
      const validationError = this.validateThreadParams(args);
      if (validationError) {
        return {
          success: false,
          error: validationError.message,
          errorCode: validationError.code,
          metadata: {
            processingTimeMs: Date.now() - startTime,
            apiCallsUsed: 0
          }
        };
      }

      // Get complete thread content
      const threadResult = await this.getThreadReplies(args.channel_id, args.thread_ts, 200);
      if (!threadResult.success || !threadResult.data) {
        return {
          success: false,
          error: threadResult.error?.message || 'Failed to fetch thread content',
          errorCode: threadResult.error?.code || 'THREAD_FETCH_FAILED',
          metadata: {
            processingTimeMs: Date.now() - startTime,
            apiCallsUsed: threadResult.api_calls_made
          }
        };
      }

      const messages = threadResult.data;
      const parentMessage = messages[0];
      const replies = messages.slice(1);

      // Extract and analyze thread content
      const threadContent = await this.extractThreadContent(messages);
      const participants = this.extractParticipants(messages);
      
      // Generate summary based on style
      const summaryStyle = args.summary_style || 'brief';
      const maxLength = Math.min(args.max_length || 500, 2000);
      
      const summary = await this.generateThreadSummary(
        threadContent, 
        parentMessage,
        replies,
        summaryStyle,
        maxLength,
        args.focus_keywords
      );

      // Calculate confidence score based on content quality
      const confidenceScore = this.calculateSummaryConfidence(
        threadContent,
        replies.length,
        participants.length
      );

      // Generate auto-tags based on content
      const autoTags = this.generateAutoTags(threadContent, args.focus_keywords);

      const result: ThreadSummary = {
        thread_ts: args.thread_ts,
        title: this.generateThreadTitle(parentMessage, replies),
        key_points: summary.keyPoints,
        action_items: summary.actionItems,
        decisions: summary.decisions,
        resolution: summary.resolution,
        participant_count: participants.length,
        reply_count: replies.length,
        summary_style: summaryStyle,
        confidence_score: confidenceScore,
        summary_generated_at: new Date().toISOString(),
        tags: autoTags
      };

      logger.info('Thread summary generated successfully', {
        thread_ts: args.thread_ts,
        summary_style: summaryStyle,
        key_points: summary.keyPoints.length,
        confidence_score: confidenceScore,
        processing_time_ms: Date.now() - startTime
      });

      return {
        success: true,
        data: result,
        metadata: {
          processingTimeMs: Date.now() - startTime,
          apiCallsUsed: threadResult.api_calls_made,
          cached: false
        }
      };

    } catch (error) {
      logger.error('Error in summarize_thread execution', { 
        error,
        thread_ts: args.thread_ts,
        channel_id: args.channel_id
      });

      return {
        success: false,
        error: `Thread summarization failed: ${error}`,
        errorCode: 'EXECUTION_ERROR',
        metadata: {
          processingTimeMs: Date.now() - startTime,
          apiCallsUsed: 0
        }
      };
    }
  }

  /**
   * Extract meaningful content từ thread messages
   */
  private async extractThreadContent(messages: SlackMessage[]): Promise<{
    fullText: string;
    messageTexts: string[];
    codeBlocks: string[];
    links: string[];
    mentions: string[];
  }> {
    const messageTexts: string[] = [];
    const codeBlocks: string[] = [];
    const links: string[] = [];
    const mentions: string[] = [];

    for (const message of messages) {
      if (message.text) {
        messageTexts.push(message.text);
        
        // Extract code blocks
        const codeMatches = message.text.match(/```[\s\S]*?```|`[^`]*`/g);
        if (codeMatches) {
          codeBlocks.push(...codeMatches);
        }
        
        // Extract links
        const linkMatches = message.text.match(/https?:\/\/[^\s]+/g);
        if (linkMatches) {
          links.push(...linkMatches);
        }
        
        // Extract mentions
        const mentionMatches = message.text.match(/<@[UW][A-Z0-9]+>/g);
        if (mentionMatches) {
          mentions.push(...mentionMatches);
        }
      }
    }

    return {
      fullText: messageTexts.join(' '),
      messageTexts,
      codeBlocks,
      links,
      mentions: [...new Set(mentions)]
    };
  }

  /**
   * Generate AI-powered thread summary
   */
  private async generateThreadSummary(
    content: any,
    parentMessage: SlackMessage,
    replies: SlackMessage[],
    style: string,
    maxLength: number,
    focusKeywords?: string[]
  ): Promise<{
    keyPoints: string[];
    actionItems?: string[];
    decisions?: string[];
    resolution?: string;
  }> {
    // Extract key discussion points
    const keyPoints = this.extractKeyPoints(content.messageTexts, style, focusKeywords);
    
    // Identify action items
    const actionItems = this.identifyActionItems(content.messageTexts);
    
    // Identify decisions made
    const decisions = this.identifyDecisions(content.messageTexts);
    
    // Check for resolution
    const resolution = this.checkForResolution(replies);

    return {
      keyPoints: keyPoints.slice(0, style === 'brief' ? 3 : 8),
      actionItems: actionItems.length > 0 ? actionItems : undefined,
      decisions: decisions.length > 0 ? decisions : undefined,
      resolution
    };
  }

  /**
   * Extract key discussion points từ messages
   */
  private extractKeyPoints(messageTexts: string[], style: string, focusKeywords?: string[]): string[] {
    const keyPoints: string[] = [];
    const sentences = messageTexts.join(' ').split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    // Simple keyword-based extraction
    const importantWords = [
      'important', 'critical', 'issue', 'problem', 'solution', 'decision',
      'agreed', 'consensus', 'action', 'next steps', 'follow up',
      ...(focusKeywords || [])
    ];

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      const hasImportantWords = importantWords.some(word => lowerSentence.includes(word));
      const isLongEnough = sentence.length > 20 && sentence.length < 200;
      
      if (hasImportantWords && isLongEnough) {
        keyPoints.push(sentence.trim());
      }
    }

    // If no keyword-based points found, take first few substantial sentences
    if (keyPoints.length === 0) {
      keyPoints.push(...sentences.filter(s => s.length > 30).slice(0, 5));
    }

    return [...new Set(keyPoints)].slice(0, style === 'detailed' ? 10 : 5);
  }

  /**
   * Identify action items from message content
   */
  private identifyActionItems(messageTexts: string[]): string[] {
    const actionItems: string[] = [];
    const actionKeywords = [
      'todo', 'to do', 'action item', 'need to', 'should', 'will',
      'follow up', 'next step', 'assign', 'responsible'
    ];

    const allText = messageTexts.join(' ');
    const sentences = allText.split(/[.!?]+/);

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      const hasActionKeyword = actionKeywords.some(keyword => lowerSentence.includes(keyword));
      
      if (hasActionKeyword && sentence.length > 15 && sentence.length < 300) {
        actionItems.push(sentence.trim());
      }
    }

    return [...new Set(actionItems)].slice(0, 5);
  }

  /**
   * Identify decisions made trong thread
   */
  private identifyDecisions(messageTexts: string[]): string[] {
    const decisions: string[] = [];
    const decisionKeywords = [
      'decided', 'decision', 'agreed', 'consensus', 'concluded',
      'final', 'chosen', 'selected', 'approved'
    ];

    const allText = messageTexts.join(' ');
    const sentences = allText.split(/[.!?]+/);

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      const hasDecisionKeyword = decisionKeywords.some(keyword => lowerSentence.includes(keyword));
      
      if (hasDecisionKeyword && sentence.length > 15 && sentence.length < 300) {
        decisions.push(sentence.trim());
      }
    }

    return [...new Set(decisions)].slice(0, 3);
  }

  /**
   * Check for thread resolution
   */
  private checkForResolution(replies: SlackMessage[]): string | undefined {
    if (replies.length === 0) return undefined;

    const lastFewReplies = replies.slice(-3).map(r => r.text || '').join(' ').toLowerCase();
    
    const resolutionKeywords = [
      'resolved', 'fixed', 'done', 'completed', 'solved',
      'closed', 'finished', 'implemented'
    ];

    const hasResolution = resolutionKeywords.some(keyword => lastFewReplies.includes(keyword));
    
    if (hasResolution) {
      const lastReply = replies[replies.length - 1].text;
      return lastReply && lastReply.length < 200 ? lastReply : 'Thread appears to be resolved';
    }

    return undefined;
  }

  /**
   * Generate thread title từ parent message
   */
  private generateThreadTitle(parentMessage: SlackMessage, replies: SlackMessage[]): string {
    const text = parentMessage.text || '';
    
    // Extract first sentence or meaningful phrase
    const firstSentence = text.split(/[.!?]+/)[0]?.trim();
    if (firstSentence && firstSentence.length > 10 && firstSentence.length < 100) {
      return firstSentence;
    }

    // Fallback: first 50 characters
    const fallbackTitle = text.substring(0, 50).trim();
    return fallbackTitle || `Thread discussion (${replies.length} replies)`;
  }

  /**
   * Calculate summary confidence score
   */
  private calculateSummaryConfidence(content: any, replyCount: number, participantCount: number): number {
    let confidence = 0.5; // Base confidence

    // More replies = higher confidence in summary accuracy
    if (replyCount > 10) confidence += 0.2;
    else if (replyCount > 5) confidence += 0.1;

    // More participants = more diverse content
    if (participantCount > 3) confidence += 0.15;
    
    // Substantial content increases confidence  
    if (content.messageTexts.length > 5) confidence += 0.1;
    if (content.fullText.length > 500) confidence += 0.05;

    return Math.min(Math.round(confidence * 100) / 100, 1.0);
  }

  /**
   * Generate auto-tags based on content
   */
  private generateAutoTags(content: any, focusKeywords?: string[]): string[] {
    const tags: string[] = [];
    
    const text = content.fullText.toLowerCase();
    
    // Technical tags
    if (text.includes('bug') || text.includes('error') || text.includes('issue')) tags.push('bug');
    if (text.includes('feature') || text.includes('enhancement')) tags.push('feature');
    if (text.includes('meeting') || text.includes('discussion')) tags.push('discussion');
    if (content.codeBlocks.length > 0) tags.push('technical');
    if (content.links.length > 0) tags.push('resources');
    
    // Add focus keywords as tags
    if (focusKeywords) {
      tags.push(...focusKeywords.filter(keyword => 
        text.includes(keyword.toLowerCase())
      ));
    }

    return [...new Set(tags)].slice(0, 5);
  }

  async validate(args: any): Promise<ToolValidationResult> {
    const errors: string[] = [];

    if (!args.thread_ts) {
      errors.push('thread_ts is required');
    } else if (!/^\d+\.\d+$/.test(args.thread_ts)) {
      errors.push('thread_ts must be in format "1234567890.123456"');
    }

    if (!args.channel_id) {
      errors.push('channel_id is required');
    } else if (!/^[CDG][A-Z0-9]+$/.test(args.channel_id)) {
      errors.push('channel_id must be a valid Slack channel ID');
    }

    if (args.summary_style && !['brief', 'detailed', 'action_items'].includes(args.summary_style)) {
      errors.push('summary_style must be one of: brief, detailed, action_items');
    }

    if (args.max_length !== undefined) {
      if (typeof args.max_length !== 'number' || args.max_length < 100 || args.max_length > 2000) {
        errors.push('max_length must be a number between 100 and 2000');
      }
    }

    if (args.focus_keywords !== undefined) {
      if (!Array.isArray(args.focus_keywords)) {
        errors.push('focus_keywords must be an array of strings');
      } else if (args.focus_keywords.some((k: any) => typeof k !== 'string')) {
        errors.push('all focus_keywords must be strings');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Tool 7: Get Thread Participants
 * Analyzes thread participants và their contributions
 */
export class GetThreadParticipantsTool extends BaseThreadTool {
  
  async execute(args: GetThreadParticipantsArgs, context: ToolContext): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    logger.info('Executing get_thread_participants', { 
      thread_ts: args.thread_ts,
      channel_id: args.channel_id,
      include_stats: args.include_stats,
      sort_by: args.sort_by
    });

    try {
      // Validate input parameters
      const validationError = this.validateThreadParams(args);
      if (validationError) {
        return {
          success: false,
          error: validationError.message,
          errorCode: validationError.code,
          metadata: {
            processingTimeMs: Date.now() - startTime,
            apiCallsUsed: 0
          }
        };
      }

      // Get complete thread content
      const threadResult = await this.getThreadReplies(args.channel_id, args.thread_ts, 200);
      if (!threadResult.success || !threadResult.data) {
        return {
          success: false,
          error: threadResult.error?.message || 'Failed to fetch thread content',
          errorCode: threadResult.error?.code || 'THREAD_FETCH_FAILED',
          metadata: {
            processingTimeMs: Date.now() - startTime,
            apiCallsUsed: threadResult.api_calls_made
          }
        };
      }

      const messages = threadResult.data;
      const minMessages = args.min_messages || 1;
      
      // Analyze participants
      const participantAnalysis = await this.analyzeParticipants(
        messages, 
        minMessages,
        args.include_stats || true
      );

      // Get user information for participants
      const enrichedParticipants = await this.enrichParticipantData(
        participantAnalysis.participants
      );

      // Sort participants based on criteria
      const sortedParticipants = this.sortParticipants(
        enrichedParticipants,
        args.sort_by || 'messages'
      );

      const result: ThreadParticipantsResult = {
        thread_ts: args.thread_ts,
        total_participants: participantAnalysis.totalParticipants,
        active_participants: participantAnalysis.activeParticipants,
        participants: sortedParticipants,
        engagement_stats: participantAnalysis.engagementStats,
        analysis_generated_at: new Date().toISOString()
      };

      logger.info('Thread participants analyzed successfully', {
        thread_ts: args.thread_ts,
        total_participants: participantAnalysis.totalParticipants,
        active_participants: participantAnalysis.activeParticipants,
        processing_time_ms: Date.now() - startTime
      });

      return {
        success: true,
        data: result,
        metadata: {
          processingTimeMs: Date.now() - startTime,
          apiCallsUsed: threadResult.api_calls_made,
          cached: false
        }
      };

    } catch (error) {
      logger.error('Error in get_thread_participants execution', { 
        error,
        thread_ts: args.thread_ts,
        channel_id: args.channel_id
      });

      return {
        success: false,
        error: `Thread participant analysis failed: ${error}`,
        errorCode: 'EXECUTION_ERROR',
        metadata: {
          processingTimeMs: Date.now() - startTime,
          apiCallsUsed: 0
        }
      };
    }
  }

  /**
   * Analyze participant contributions và engagement
   */
  private async analyzeParticipants(messages: SlackMessage[], minMessages: number, includeStats: boolean): Promise<{
    totalParticipants: number;
    activeParticipants: number;
    participants: ThreadParticipant[];
    engagementStats: any;
  }> {
    const participantMap = new Map<string, {
      messages: SlackMessage[];
      messageCount: number;
      wordCount: number;
      firstReplyTs: string;
      lastReplyTs: string;
    }>();

    // Group messages by participant
    for (const message of messages) {
      if (!message.user) continue;
      
      if (!participantMap.has(message.user)) {
        participantMap.set(message.user, {
          messages: [],
          messageCount: 0,
          wordCount: 0,
          firstReplyTs: message.ts,
          lastReplyTs: message.ts
        });
      }

      const participant = participantMap.get(message.user)!;
      participant.messages.push(message);
      participant.messageCount++;
      participant.wordCount += (message.text || '').split(/\s+/).length;
      participant.lastReplyTs = message.ts;
    }

    // Convert to ThreadParticipant objects
    const participants: ThreadParticipant[] = [];
    let activeCount = 0;

    for (const [userId, data] of participantMap) {
      if (data.messageCount < minMessages) continue;
      
      if (data.messageCount > 1) activeCount++;

      const participant: ThreadParticipant = {
        user_id: userId,
        user_name: userId, // Will be enriched later
        message_count: data.messageCount,
        first_reply_ts: data.firstReplyTs,
        last_reply_ts: data.lastReplyTs,
        engagement_score: this.calculateEngagementScore(data, messages.length),
        role: this.determineParticipantRole(data, messages[0]?.user === userId),
        word_count: data.wordCount,
        avg_response_time_minutes: includeStats ? 
          this.calculateAvgResponseTime(data.messages) : undefined
      };

      participants.push(participant);
    }

    // Calculate engagement statistics
    const engagementStats = {
      avg_messages_per_user: Math.round(
        participants.reduce((sum, p) => sum + p.message_count, 0) / participants.length * 100
      ) / 100,
      most_active_user: participants.reduce((max, p) => 
        p.message_count > max.message_count ? p : max
      ).user_id,
      participation_distribution: {
        starters: participants.filter(p => p.role === 'starter').length,
        active: participants.filter(p => p.role === 'active').length,
        casual: participants.filter(p => p.role === 'casual').length,
        observers: participants.filter(p => p.role === 'observer').length
      }
    };

    return {
      totalParticipants: participantMap.size,
      activeParticipants: activeCount,
      participants,
      engagementStats
    };
  }

  /**
   * Calculate engagement score for participant
   */
  private calculateEngagementScore(participantData: any, totalMessages: number): number {
    const messageRatio = participantData.messageCount / totalMessages;
    const avgWordsPerMessage = participantData.wordCount / participantData.messageCount;
    
    let score = 0;
    
    // Message frequency component (0-40 points)
    score += Math.min(messageRatio * 100, 40);
    
    // Message quality component (0-30 points)  
    score += Math.min(avgWordsPerMessage * 2, 30);
    
    // Consistency component (0-30 points)
    if (participantData.messageCount > 1) {
      score += 20; // Bonus for multiple messages
      if (participantData.messageCount > 3) score += 10; // Extra bonus for high participation
    }

    return Math.min(Math.round(score), 100);
  }

  /**
   * Determine participant role based on activity
   */
  private determineParticipantRole(participantData: any, isStarter: boolean): 'starter' | 'active' | 'casual' | 'observer' {
    if (isStarter) return 'starter';
    if (participantData.messageCount >= 3) return 'active';
    if (participantData.messageCount >= 1) return 'casual';
    return 'observer';
  }

  /**
   * Calculate average response time between messages
   */
  private calculateAvgResponseTime(messages: SlackMessage[]): number | undefined {
    if (messages.length < 2) return undefined;

    const intervals: number[] = [];
    for (let i = 1; i < messages.length; i++) {
      const prevTime = parseFloat(messages[i - 1].ts) * 1000;
      const currentTime = parseFloat(messages[i].ts) * 1000;
      intervals.push(currentTime - prevTime);
    }

    const avgMs = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    return Math.round(avgMs / (1000 * 60) * 100) / 100; // Convert to minutes
  }

  /**
   * Enrich participant data với user information
   */
  private async enrichParticipantData(participants: ThreadParticipant[]): Promise<ThreadParticipant[]> {
    // For now, we'll use user_id as display name
    // In a full implementation, you'd fetch user profiles from Slack API
    return participants.map(participant => ({
      ...participant,
      user_name: `User ${participant.user_id.substring(0, 8)}`, // Placeholder
      real_name: undefined // Would be fetched from API
    }));
  }

  /**
   * Sort participants based on criteria
   */
  private sortParticipants(participants: ThreadParticipant[], sortBy: string): ThreadParticipant[] {
    const sortedParticipants = [...participants];

    switch (sortBy) {
      case 'engagement':
        return sortedParticipants.sort((a, b) => b.engagement_score - a.engagement_score);
      case 'chronological':
        return sortedParticipants.sort((a, b) => 
          parseFloat(a.first_reply_ts) - parseFloat(b.first_reply_ts)
        );
      case 'messages':
      default:
        return sortedParticipants.sort((a, b) => b.message_count - a.message_count);
    }
  }

  async validate(args: any): Promise<ToolValidationResult> {
    const errors: string[] = [];

    if (!args.thread_ts) {
      errors.push('thread_ts is required');
    } else if (!/^\d+\.\d+$/.test(args.thread_ts)) {
      errors.push('thread_ts must be in format "1234567890.123456"');
    }

    if (!args.channel_id) {
      errors.push('channel_id is required');
    } else if (!/^[CDG][A-Z0-9]+$/.test(args.channel_id)) {
      errors.push('channel_id must be a valid Slack channel ID');
    }

    if (args.include_stats !== undefined && typeof args.include_stats !== 'boolean') {
      errors.push('include_stats must be a boolean');
    }

    if (args.min_messages !== undefined) {
      if (typeof args.min_messages !== 'number' || args.min_messages < 1) {
        errors.push('min_messages must be a positive number');
      }
    }

    if (args.sort_by && !['messages', 'engagement', 'chronological'].includes(args.sort_by)) {
      errors.push('sort_by must be one of: messages, engagement, chronological');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}