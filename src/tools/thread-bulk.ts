/**
 * Sprint 3.2: Bulk Operations Thread Tool Implementation
 * Tool 8: bulk_thread_actions - Perform actions on multiple threads efficiently
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
  BulkThreadActionsArgs,
  BulkActionResult,
  ThreadOperationResult
} from '../types/thread-tools.js';

// Import individual tool implementations for delegation
import { ResolveThreadTool } from './thread-actions.js';
import { ArchiveThreadTool } from './thread-actions.js';

/**
 * Tool 8: Bulk Thread Actions
 * Performs actions on multiple threads efficiently với rate limiting và batching
 */
export class BulkThreadActionsTool extends BaseThreadTool {
  
  private resolveThreadTool: ResolveThreadTool;
  private archiveThreadTool: ArchiveThreadTool;

  constructor(definition: any) {
    super(definition);
    
    // Initialize individual tools for delegation
    this.resolveThreadTool = new ResolveThreadTool({} as any);
    this.archiveThreadTool = new ArchiveThreadTool({} as any);
  }
  
  async execute(args: BulkThreadActionsArgs, context: ToolContext): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    logger.info('Executing bulk_thread_actions', { 
      action: args.action,
      thread_count: args.thread_list.length,
      batch_size: args.batch_size,
      dry_run: args.dry_run
    });

    try {
      // Validate input parameters
      const validationResult = await this.validate(args);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validationResult.errors.join(', ')}`,
          errorCode: 'VALIDATION_ERROR',
          metadata: {
            processingTimeMs: Date.now() - startTime,
            apiCallsUsed: 0
          }
        };
      }

      const batchSize = Math.min(args.batch_size || 5, 10);
      const threadList = args.thread_list;
      const totalThreads = threadList.length;

      // If dry run, return preview of what would be done
      if (args.dry_run) {
        const previewResult = await this.generatePreview(args);
        return {
          success: true,
          data: previewResult,
          metadata: {
            processingTimeMs: Date.now() - startTime,
            apiCallsUsed: 0,
            cached: false
          }
        };
      }

      // Initialize result tracking
      const result: BulkActionResult = {
        action: args.action,
        total_requested: totalThreads,
        processed: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        results: [],
        total_processing_time_ms: 0,
        batch_info: {
          batch_size: batchSize,
          total_batches: Math.ceil(totalThreads / batchSize),
          avg_batch_time_ms: 0
        }
      };

      // Process threads in batches với rate limiting
      const batches = this.createBatches(threadList, batchSize);
      const batchTimes: number[] = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchStartTime = Date.now();
        
        logger.info(`Processing batch ${i + 1}/${batches.length}`, {
          batch_size: batch.length,
          action: args.action
        });

        // Process batch concurrently but controlled
        const batchPromises = batch.map(thread => 
          this.processIndividualThread(thread, args, context)
        );

        const batchResults = await Promise.allSettled(batchPromises);
        
        // Process batch results
        for (let j = 0; j < batchResults.length; j++) {
          const promiseResult = batchResults[j];
          const thread = batch[j];
          
          result.processed++;
          
          if (promiseResult.status === 'fulfilled') {
            const threadResult = promiseResult.value;
            result.results.push({
              thread_ts: thread.thread_ts,
              channel_id: thread.channel_id,
              success: threadResult.success,
              result: threadResult.success ? threadResult.data : undefined,
              error: threadResult.success ? undefined : threadResult.error,
              processing_time_ms: threadResult.metadata?.processingTimeMs || 0
            });
            
            if (threadResult.success) {
              result.successful++;
            } else {
              result.failed++;
            }
          } else {
            result.results.push({
              thread_ts: thread.thread_ts,
              channel_id: thread.channel_id,
              success: false,
              error: `Batch processing failed: ${promiseResult.reason}`,
              processing_time_ms: 0
            });
            result.failed++;
          }
        }

        const batchTime = Date.now() - batchStartTime;
        batchTimes.push(batchTime);

        // Rate limiting: wait between batches
        if (i < batches.length - 1) {
          const delay = this.calculateDelayBetweenBatches(args.action);
          await this.sleep(delay);
        }
      }

      // Calculate final metrics
      result.total_processing_time_ms = Date.now() - startTime;
      result.batch_info.avg_batch_time_ms = Math.round(
        batchTimes.reduce((sum, time) => sum + time, 0) / batchTimes.length
      );

      logger.info('Bulk thread actions completed', {
        action: args.action,
        total_processed: result.processed,
        successful: result.successful,
        failed: result.failed,
        total_time_ms: result.total_processing_time_ms
      });

      return {
        success: true,
        data: result,
        metadata: {
          processingTimeMs: result.total_processing_time_ms,
          apiCallsUsed: this.estimateApiCallsUsed(args.action, result.successful),
          cached: false
        }
      };

    } catch (error) {
      logger.error('Error in bulk_thread_actions execution', { 
        error,
        action: args.action,
        thread_count: args.thread_list.length
      });

      return {
        success: false,
        error: `Bulk thread actions failed: ${error}`,
        errorCode: 'EXECUTION_ERROR',
        metadata: {
          processingTimeMs: Date.now() - startTime,
          apiCallsUsed: 0
        }
      };
    }
  }

  /**
   * Process single thread based on action type
   */
  private async processIndividualThread(
    thread: { thread_ts: string; channel_id: string },
    args: BulkThreadActionsArgs,
    context: ToolContext
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    
    try {
      switch (args.action) {
        case 'resolve':
          return await this.resolveThreadTool.execute({
            thread_ts: thread.thread_ts,
            channel_id: thread.channel_id,
            resolution_summary: args.parameters?.resolution_summary,
            mark_with_reaction: args.parameters?.mark_with_reaction !== false,
            notify_participants: args.parameters?.notify_participants || false
          }, context);

        case 'archive':
          return await this.archiveThreadTool.execute({
            thread_ts: thread.thread_ts,
            channel_id: thread.channel_id,
            archive_reason: args.parameters?.archive_reason,
            pin_thread: args.parameters?.pin_thread || false,
            add_to_bookmarks: args.parameters?.add_to_bookmarks || false
          }, context);

        case 'summarize':
        case 'analyze':
          return {
            success: false,
            error: `Action '${args.action}' is no longer supported (broken tool removed)`,
            errorCode: 'UNSUPPORTED_ACTION',
            metadata: {
              processingTimeMs: Date.now() - startTime,
              apiCallsUsed: 0
            }
          };

        default:
          return {
            success: false,
            error: `Unsupported action: ${args.action}`,
            errorCode: 'UNSUPPORTED_ACTION',
            metadata: {
              processingTimeMs: Date.now() - startTime,
              apiCallsUsed: 0
            }
          };
      }
    } catch (error) {
      return {
        success: false,
        error: `Individual thread processing failed: ${error}`,
        errorCode: 'INDIVIDUAL_PROCESSING_ERROR',
        metadata: {
          processingTimeMs: Date.now() - startTime,
          apiCallsUsed: 0
        }
      };
    }
  }

  /**
   * Generate preview of bulk operations
   */
  private async generatePreview(args: BulkThreadActionsArgs): Promise<BulkActionResult> {
    const preview: BulkActionResult = {
      action: args.action,
      total_requested: args.thread_list.length,
      processed: 0,
      successful: args.thread_list.length, // Assume all would succeed in preview
      failed: 0,
      skipped: 0,
      results: args.thread_list.map(thread => ({
        thread_ts: thread.thread_ts,
        channel_id: thread.channel_id,
        success: true,
        result: this.generatePreviewResult(args.action, thread, args.parameters),
        processing_time_ms: 0
      })),
      total_processing_time_ms: 0,
      batch_info: {
        batch_size: args.batch_size || 5,
        total_batches: Math.ceil(args.thread_list.length / (args.batch_size || 5)),
        avg_batch_time_ms: 0
      }
    };

    return preview;
  }

  /**
   * Generate preview result for specific action
   */
  private generatePreviewResult(action: string, thread: any, parameters?: any): any {
    switch (action) {
      case 'resolve':
        return {
          thread_ts: thread.thread_ts,
          channel_id: thread.channel_id,
          resolved: true,
          preview: true,
          would_add_reaction: parameters?.mark_with_reaction !== false,
          would_post_summary: !!parameters?.resolution_summary
        };

      case 'archive':
        return {
          thread_ts: thread.thread_ts,
          channel_id: thread.channel_id,
          archived: true,
          preview: true,
          would_pin: parameters?.pin_thread || false,
          would_add_reason: !!parameters?.archive_reason
        };

      case 'summarize':
      case 'analyze':
        return {
          thread_ts: thread.thread_ts,
          channel_id: thread.channel_id,
          preview: true,
          error: `Action '${action}' is no longer supported (broken tool removed)`
        };

      default:
        return { preview: true, action: action };
    }
  }

  /**
   * Create batches từ thread list
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Calculate delay between batches based on action type
   */
  private calculateDelayBetweenBatches(action: string): number {
    // Different actions have different Slack API rate limits
    switch (action) {
      case 'resolve':
      case 'archive':
        return 1000; // 1 second - posting messages and reactions
      case 'summarize':
      case 'analyze':
        return 500; // 0.5 seconds - mainly read operations
      default:
        return 750; // Default delay
    }
  }

  /**
   * Estimate API calls used based on action và success count
   */
  private estimateApiCallsUsed(action: string, successfulCount: number): number {
    switch (action) {
      case 'resolve':
        return successfulCount * 2; // Reaction + possible summary post
      case 'archive':
        return successfulCount * 3; // Reaction + pin + possible reason post
      case 'summarize':
        return successfulCount * 1; // Thread fetch only
      case 'analyze':
        return successfulCount * 1; // Thread fetch only
      default:
        return successfulCount;
    }
  }

  /**
   * Sleep utility for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async validate(args: any): Promise<ToolValidationResult> {
    const errors: string[] = [];

    if (!args.action) {
      errors.push('action is required');
    } else if (!['resolve', 'archive'].includes(args.action)) {
      errors.push('action must be one of: resolve, archive (summarize/analyze removed due to broken tools)');
    }

    if (!args.thread_list) {
      errors.push('thread_list is required');
    } else if (!Array.isArray(args.thread_list)) {
      errors.push('thread_list must be an array');
    } else if (args.thread_list.length === 0) {
      errors.push('thread_list cannot be empty');
    } else if (args.thread_list.length > 20) {
      errors.push('thread_list cannot contain more than 20 threads');
    } else {
      // Validate each thread in the list
      for (let i = 0; i < args.thread_list.length; i++) {
        const thread = args.thread_list[i];
        if (!thread.thread_ts) {
          errors.push(`thread_list[${i}].thread_ts is required`);
        } else if (!/^\d+\.\d+$/.test(thread.thread_ts)) {
          errors.push(`thread_list[${i}].thread_ts must be in format "1234567890.123456"`);
        }
        
        if (!thread.channel_id) {
          errors.push(`thread_list[${i}].channel_id is required`);
        } else if (!/^[CDG][A-Z0-9]+$/.test(thread.channel_id)) {
          errors.push(`thread_list[${i}].channel_id must be a valid Slack channel ID`);
        }
      }
    }

    if (args.batch_size !== undefined) {
      if (typeof args.batch_size !== 'number' || args.batch_size < 1 || args.batch_size > 10) {
        errors.push('batch_size must be a number between 1 and 10');
      }
    }

    if (args.dry_run !== undefined && typeof args.dry_run !== 'boolean') {
      errors.push('dry_run must be a boolean');
    }

    if (args.parameters !== undefined && typeof args.parameters !== 'object') {
      errors.push('parameters must be an object');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}