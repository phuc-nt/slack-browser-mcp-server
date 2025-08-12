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
      description: `Advanced message search across the entire Slack workspace with comprehensive query operators and AI optimization.
Supports complex search patterns for information synthesis, thread discovery, and content analysis.

🔍 CORE SEARCH OPERATORS:
• CHANNEL: 'in:channel_name' - Search specific channels (in:general, in:engineering) 
• USER: 'from:@username' or 'to:@username' - Messages from/to specific users
• CONVERSATIONS: 'with:@username' - Find DMs and threads featuring specific users
• EXCLUSION: '-in:channel_name' - Exclude specific channels from results

📅 TIME-BASED OPERATORS:
• AFTER: 'after:2025-08-01' or 'after:yesterday' or 'after:last week'
• BEFORE: 'before:2025-08-15' or 'before:today' or 'before:this month'  
• ON: 'on:2025-08-12' or 'on:monday' - Specific dates
• DURING: 'during:august' or 'during:last month' - Time periods

📎 CONTENT-TYPE OPERATORS:
• FILES: 'has:attachment', 'has:file', 'has:image', 'has:document'
• LINKS: 'has:link' - Messages containing URLs
• REACTIONS: 'has:reaction' or 'has::emoji_name:' - Messages with reactions
• PINS: 'has:pin' or 'is:pinned' - Pinned messages
• THREADS: 'is:thread' - Messages in threads only
• SAVED: 'is:saved' - Your saved messages

🔧 ADVANCED QUERY PATTERNS:
• BOOLEAN: 'error AND production', 'bug OR issue', 'deployment NOT scheduled'
• GROUPING: '(urgent OR critical) AND production'  
• PHRASES: '"exact phrase"' - Exact text matching
• WILDCARDS: 'deploy*' - Prefix matching
• COMBINATIONS: 'in:incidents after:yesterday has:link from:@oncall'

💡 INFORMATION SYNTHESIS PATTERNS:
• Thread Discovery: 'in:support has:thread "customer issue" after:this week'
• Status Updates: 'from:@manager "status update" OR "progress report" during:last month'
• Decision Tracking: '"decision" OR "agreed" OR "approved" in:leadership after:last week'
• Issue Analysis: '(error OR bug OR failed) -from:@bot has:thread during:last 7 days'
• Knowledge Mining: 'has:file (documentation OR guide OR spec) in:engineering'

🔗 INTEGRATION WITH get_thread_replies:
Search_messages finds threads → Use thread_ts from results → get_thread_replies for full conversation
Example workflow: 
1. search_messages: 'incident response in:alerts has:thread after:yesterday'
2. Extract thread_ts from promising results  
3. get_thread_replies: Get complete thread conversations for detailed analysis

📊 OPTIMIZATION FOR AI SUMMARIZATION:
• Use time filters to focus on relevant periods
• Combine content-type filters to find rich information sources
• Search for decision keywords to find resolution patterns
• Use thread searches for comprehensive discussion context
• Exclude bot channels to focus on human conversations

Returns highlighted results with pagination support. Perfect for information gathering, 
trend analysis, decision tracking, and comprehensive workspace knowledge synthesis.`,
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
            description: `Search query with comprehensive operators and patterns:

BASIC: Simple keywords or "exact phrases"
CHANNEL: in:channel_name, -in:channel_name  
USER: from:@username, to:@username, with:@username
TIME: after:date, before:date, on:date, during:period
CONTENT: has:attachment, has:link, has:reaction, has:thread, is:pinned
BOOLEAN: AND, OR, NOT, parentheses for grouping
SYNTHESIS: Combine operators for information discovery

Examples:
• 'in:engineering "deployment" has:thread after:yesterday'
• '(bug OR error) -from:@bot has:reaction during:last week'  
• '"decision made" OR "approved" in:leadership after:monday'
• 'has:file (spec OR documentation) from:@senior-dev'`,
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
