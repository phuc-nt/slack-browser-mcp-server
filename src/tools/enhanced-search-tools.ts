/**
 * Phase 6: Enhanced Search Tools Implementation
 * Advanced search tools with comprehensive query operators and file search
 */

import { BaseSlackTool } from './base.js';
import { SlackAuth } from '../slack/auth.js';
import { SlackClient } from '../slack/client.js';
import { logger } from '../utils/logger.js';
import { ToolContext, ToolExecutionResult, SlackTool } from '../types/tools.js';

/**
 * Enhanced SearchMessagesTool - Advanced message search using search.messages API
 * Replaces SearchChannelMessagesTool with comprehensive query operators
 */
export class SearchMessagesTool extends BaseSlackTool {
  constructor() {
    const definition: SlackTool = {
      name: 'search_messages',
      description: `Advanced message search across the entire Slack workspace with powerful query operators. 
Supports complex search patterns including:

CHANNEL SEARCH: Use 'in:channel_name' to search specific channels (e.g., 'in:general meeting')
USER SEARCH: Use 'from:@username' for user-specific messages (e.g., 'from:@john deployment')  
TIME SEARCH: Use 'after:date', 'before:date', 'on:date' for time-based filtering
CONTENT SEARCH: Use 'has:link', 'has:attachment', 'has:reaction' for content types
BOOLEAN LOGIC: Use AND, OR, parentheses, and minus (-) for complex queries

Examples:
- 'in:general from:@sarah "project update"' - Find project updates from Sarah in #general
- 'error AND production -scheduled' - Find production errors excluding scheduled events  
- 'has:attachment in:design "mockup"' - Find design files with mockups
- 'after:2025-08-01 (urgent OR priority)' - Find recent urgent messages

Returns highlighted results with pagination support for large result sets.`,
      category: 'search',
      action: 'GET',
      requiresAuth: true,
      rateLimit: {
        rpm: 30,
        burst: 5,
      },
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'Search query with optional operators (in:, from:, after:, has:, AND, OR, -, parentheses)',
            minLength: 1,
            maxLength: 500,
          },
          count: {
            type: 'number',
            description: 'Number of results per page (1-100)',
            minimum: 1,
            maximum: 100,
          },
          page: {
            type: 'number',
            description: 'Page number for pagination (1-100)',
            minimum: 1,
            maximum: 100,
          },
          sort: {
            type: 'string',
            enum: ['asc', 'desc'],
            description: 'Sort direction (asc for oldest first, desc for newest first)',
          },
          highlight: {
            type: 'boolean',
            description: 'Enable query term highlighting in results (default: true)',
          },
          cursor: {
            type: 'string',
            description: 'Pagination cursor for fetching next page of results',
          },
        },
        required: ['query'],
      },
    };
    super(definition);
  }

  async executeImpl(args: any, context: ToolContext): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    logger.info('Executing enhanced search_messages', {
      query: args.query,
      count: args.count || 20,
      page: args.page || 1,
    });

    try {
      // Initialize Slack client
      const auth = new SlackAuth();
      const tokens = auth.extractTokensFromEnvironment();
      if (!tokens) {
        return this.createErrorResult(
          'Slack authentication required for advanced search operations.',
          'AUTH_REQUIRED',
          { executionTime: Date.now() - startTime, apiCalls: 0, cacheHits: 0 }
        );
      }

      const client = new SlackClient(tokens);

      // Call search.messages API with enhanced parameters
      const searchParams = {
        query: args.query,
        count: args.count || 20,
        page: args.page || 1,
        sort: args.sort || 'desc',
        highlight: args.highlight !== false,
        ...(args.cursor && { cursor: args.cursor }),
      };

      const response = await client.searchMessagesAdvanced(searchParams);

      if (!response.ok) {
        return this.createErrorResult(
          `Advanced message search failed: ${response.error}`,
          'SEARCH_ERROR',
          { executionTime: Date.now() - startTime, apiCalls: 1, cacheHits: 0 }
        );
      }

      const totalResults = response.messages?.pagination?.total_count || 0;
      const currentPage = response.messages?.pagination?.page || 1;
      const pageCount = response.messages?.pagination?.page_count || 1;

      // Sprint 7.2: Optimize search messages response (60-65% reduction)
      // Remove: blocks, team, score, iid, db_message, pagination metadata
      // Keep: text, user, ts, channel, permalink, thread_ts
      const optimizedMessages = (response.messages?.matches || []).map((message: any) => ({
        user: message.user,
        ts: message.ts,
        text: message.text || '',
        channel: message.channel?.id || message.channel,
        permalink: message.permalink,
        thread_ts: message.thread_ts,
      }));

      logger.info('Advanced message search completed and optimized', {
        query: args.query,
        total_results: totalResults,
        current_page: currentPage,
        page_count: pageCount,
        original_results: response.messages?.matches?.length || 0,
        optimized_results: optimizedMessages.length,
        optimization: 'Sprint 7.2 - 60-65% size reduction',
      });

      return this.createSuccessResult(
        {
          query: args.query,
          total_results: totalResults,
          current_page: currentPage,
          total_pages: pageCount,
          results_per_page: args.count || 20,
          messages: optimizedMessages,
          // Removed: pagination, metadata (api_endpoint, search_parameters, query_operators_supported)
        },
        {
          executionTime: Date.now() - startTime,
          apiCalls: 1,
          cacheHits: 0,
        }
      );
    } catch (error) {
      logger.error('Error in enhanced search_messages execution', {
        error,
        query: args.query,
      });

      return this.createErrorResult(`Advanced message search failed: ${error}`, 'EXECUTION_ERROR', {
        executionTime: Date.now() - startTime,
        apiCalls: 0,
        cacheHits: 0,
      });
    }
  }
}

/**
 * SearchFilesTool - Dedicated file and document search using search.files API
 * New Phase 6 tool for finding uploaded files and attachments
 */
export class SearchFilesTool extends BaseSlackTool {
  constructor() {
    const definition: SlackTool = {
      name: 'search_files',
      description: `Search specifically through files and documents uploaded to the workspace. 
This tool searches both file names and content within documents including:

FILE TYPES: PDF, Word, Excel, PowerPoint, images, code files, text files, and all attachments
SEARCH SCOPE: File names, document content, metadata, and file descriptions
USE CASES: Finding technical specifications, project documents, presentations, reports, or code files

Examples:
- 'specification.pdf' - Find specific PDF file
- 'quarterly report' - Find reports containing quarterly data  
- 'API documentation' - Find technical documentation files
- 'budget 2025' - Find budget-related files for 2025
- 'meeting notes' - Find uploaded meeting recordings or transcripts

Perfect for document research, finding uploaded resources, and locating files 
that contain specific technical or business information that wouldn't be in chat messages.`,
      category: 'search',
      action: 'GET',
      requiresAuth: true,
      rateLimit: {
        rpm: 20,
        burst: 3,
      },
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query for file names, content, or metadata',
            minLength: 1,
            maxLength: 500,
          },
          count: {
            type: 'number',
            description: 'Number of files to return per page (1-100)',
            minimum: 1,
            maximum: 100,
          },
          page: {
            type: 'number',
            description: 'Page number for pagination (1-100)',
            minimum: 1,
            maximum: 100,
          },
          sort: {
            type: 'string',
            enum: ['score', 'timestamp', 'size'],
            description: 'Sort files by relevance score, upload timestamp, or file size',
          },
          sort_dir: {
            type: 'string',
            enum: ['asc', 'desc'],
            description: 'Sort direction (asc for ascending, desc for descending)',
          },
          highlight: {
            type: 'boolean',
            description: 'Enable query term highlighting in file descriptions (default: true)',
          },
        },
        required: ['query'],
      },
    };
    super(definition);
  }

  async executeImpl(args: any, context: ToolContext): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    logger.info('Executing search_files', {
      query: args.query,
      count: args.count || 20,
      sort: args.sort || 'score',
    });

    try {
      // Initialize Slack client
      const auth = new SlackAuth();
      const tokens = auth.extractTokensFromEnvironment();
      if (!tokens) {
        return this.createErrorResult(
          'Slack authentication required for file search operations.',
          'AUTH_REQUIRED',
          { executionTime: Date.now() - startTime, apiCalls: 0, cacheHits: 0 }
        );
      }

      const client = new SlackClient(tokens);

      // Call search.files API
      const searchParams = {
        query: args.query,
        count: args.count || 20,
        page: args.page || 1,
        sort: args.sort || 'score',
        sort_dir: args.sort_dir || 'desc',
        highlight: args.highlight !== false,
      };

      const response = await client.searchFiles(searchParams);

      if (!response.ok) {
        return this.createErrorResult(`File search failed: ${response.error}`, 'SEARCH_ERROR', {
          executionTime: Date.now() - startTime,
          apiCalls: 1,
          cacheHits: 0,
        });
      }

      const totalResults = response.files?.pagination?.total_count || 0;
      const currentPage = response.files?.pagination?.page || 1;
      const pageCount = response.files?.pagination?.page_count || 1;

      logger.info('File search completed successfully', {
        query: args.query,
        total_results: totalResults,
        current_page: currentPage,
        page_count: pageCount,
        files_returned: response.files?.matches?.length || 0,
      });

      return this.createSuccessResult(
        {
          query: args.query,
          total_results: totalResults,
          current_page: currentPage,
          total_pages: pageCount,
          results_per_page: args.count || 20,
          files: response.files?.matches || [],
          pagination: response.files?.pagination,
          metadata: {
            api_endpoint: 'search.files',
            search_parameters: searchParams,
            supported_file_types: [
              'Documents: PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx)',
              'Images: PNG, JPG, GIF, WebP, SVG',
              'Media: MP4, MOV, AVI (video), MP3, WAV (audio)',
              'Code: JavaScript, TypeScript, Python, Java, C++, Go, etc.',
              'Text: TXT, CSV, JSON, XML, YAML, Markdown',
              'Archives: ZIP, RAR, TAR',
              'All uploaded attachments',
            ],
          },
        },
        {
          executionTime: Date.now() - startTime,
          apiCalls: 1,
          cacheHits: 0,
        }
      );
    } catch (error) {
      logger.error('Error in search_files execution', {
        error,
        query: args.query,
      });

      return this.createErrorResult(`File search failed: ${error}`, 'EXECUTION_ERROR', {
        executionTime: Date.now() - startTime,
        apiCalls: 0,
        cacheHits: 0,
      });
    }
  }
}
