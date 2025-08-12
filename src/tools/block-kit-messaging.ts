/**
 * Sprint 7.4: Block Kit Messaging Tools
 * Specialized tools for posting and updating messages with Block Kit elements
 */

import { BaseSlackTool } from './base.js';
import { SlackAuth } from '../slack/auth.js';
import { SlackClient } from '../slack/client.js';
import { logger } from '../utils/logger.js';
import { ToolContext, ToolExecutionResult, SlackTool } from '../types/tools.js';

/**
 * PostMessageBlocksTool - Dedicated Block Kit message posting
 * Designed specifically for posting messages with interactive blocks, buttons, sections, etc.
 */
export class PostMessageBlocksTool extends BaseSlackTool {
  constructor() {
    const definition: SlackTool = {
      name: 'post_message_blocks',
      description: `Post message with Block Kit elements - specialized for interactive and rich content.

BLOCK KIT FEATURES:
- Interactive buttons, select menus, date pickers
- Rich sections with text, images, and actions  
- Dividers, headers, and context blocks
- Forms with input elements
- Progress indicators and status dashboards

PERFECT FOR:
- Interactive workflows and forms ("Create approval request with buttons")
- Rich status updates ("Deployment status with progress indicator") 
- Dashboard-style information ("System metrics with formatted sections")
- Action-driven messages ("Task management with action buttons")
- Dynamic content updates ("Survey with interactive elements")

BLOCK KIT VALIDATION:
- Supports up to 50 blocks per message
- Validates block structure and required fields
- Handles all standard Block Kit block types
- Provides clear error messages for invalid blocks

EXAMPLE BLOCKS:
[
  {
    "type": "section",
    "text": {
      "type": "mrkdwn", 
      "text": "*Deployment Status*\nVersion 2.1.4 is now live"
    }
  },
  {
    "type": "actions",
    "elements": [
      {
        "type": "button",
        "text": {"type": "plain_text", "text": "View Logs"},
        "style": "primary",
        "action_id": "view_logs"
      }
    ]
  }
]

Returns message with timestamp for further operations (reactions, updates, threading).`,
      category: 'messaging',
      action: 'POST', 
      requiresAuth: true,
      rateLimit: {
        rpm: 30,
        burst: 5,
      },
      inputSchema: {
        type: 'object',
        properties: {
          channel: {
            type: 'string',
            description: 'Channel ID where the message should be posted (e.g., C1234567890)',
            pattern: '^C[A-Z0-9]+$',
          },
          blocks: {
            type: 'string',
            description: 'JSON string containing array of Block Kit block objects (max 50 blocks). Example: \'[{"type":"section","text":{"type":"mrkdwn","text":"Hello *world*!"}}]\'',
          },
          text: {
            type: 'string',
            description: 'Fallback text for notifications and accessibility (recommended but optional)',
          },
          thread_ts: {
            type: 'string',
            description: 'Message timestamp to reply to (creates thread reply)',
            pattern: '^[0-9]+\\.[0-9]+$',
          },
          reply_broadcast: {
            type: 'boolean',
            description: 'Make thread reply visible to all channel members (default: false)',
            default: false,
          },
          unfurl_links: {
            type: 'boolean',
            description: 'Enable/disable link unfurling (default: true)',
            default: true,
          },
        },
        required: ['channel', 'blocks'],
      },
    };
    super(definition);
  }

  async executeImpl(args: any, context: ToolContext): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    logger.info('Starting Block Kit message posting', {
      channel: args.channel,
      blocks_count: args.blocks?.length || 0,
      has_text: !!args.text,
      thread_ts: args.thread_ts,
      blocks_type: typeof args.blocks,
      is_array: Array.isArray(args.blocks),
      blocks_value: args.blocks,
    });

    try {
      // Initialize Slack client
      const auth = new SlackAuth();
      const tokens = auth.extractTokensFromEnvironment();
      if (!tokens) {
        return this.createErrorResult(
          'Slack authentication required for Block Kit messaging operations.',
          'AUTH_REQUIRED',
          { executionTime: Date.now() - startTime, apiCalls: 0, cacheHits: 0 }
        );
      }

      const client = new SlackClient(tokens);

      // Parse blocks from JSON string
      let blocks: any[];
      try {
        blocks = JSON.parse(args.blocks);
      } catch (error) {
        return this.createErrorResult(
          `Invalid JSON in blocks parameter: ${error}`,
          'INVALID_INPUT',
          { executionTime: Date.now() - startTime, apiCalls: 0, cacheHits: 0 }
        );
      }

      // Validate Block Kit blocks
      this.validateBlockKitBlocks(blocks);

      // Post message with Block Kit blocks
      const response = await client.postMessage(
        args.channel,
        args.text || 'Block Kit message', // Fallback text required
        args.thread_ts,
        blocks, // Parsed Block Kit blocks
        undefined, // attachments (deprecated, use blocks instead)
        args.unfurl_links !== false
      );

      logger.info('Block Kit message posted successfully', {
        channel: args.channel,
        message_ts: response.ts,
        blocks_count: blocks.length,
        thread_ts: args.thread_ts,
        execution_time: Date.now() - startTime,
      });

      // Sprint 7.2: Optimized response format (60-70% reduction)
      return this.createSuccessResult(
        {
          success: true,
          channel: response.channel,
          ts: response.ts,
          message_type: 'block_kit',
          blocks_count: blocks.length,
          // Removed: full message object, detailed metadata
        },
        {
          executionTime: Date.now() - startTime,
          apiCalls: 1,
          cacheHits: 0,
        }
      );
    } catch (error) {
      logger.error('Error posting Block Kit message', {
        error,
        channel: args.channel,
        blocks_count: args.blocks?.length || 0,
      });

      return this.createErrorResult(
        `Block Kit message posting failed: ${error}`,
        'EXECUTION_ERROR',
        { executionTime: Date.now() - startTime, apiCalls: 0, cacheHits: 0 }
      );
    }
  }

  /**
   * Validate Block Kit blocks structure and requirements
   */
  private validateBlockKitBlocks(blocks: any[]): void {
    if (!Array.isArray(blocks)) {
      throw new Error('Blocks must be an array of Block Kit block objects');
    }

    if (blocks.length === 0) {
      throw new Error('At least one block is required');
    }

    if (blocks.length > 50) {
      throw new Error('Maximum 50 blocks allowed per message');
    }

    const supportedBlockTypes = [
      'section', 'divider', 'actions', 'header', 'context', 
      'image', 'input', 'file', 'rich_text', 'markdown'
    ];

    blocks.forEach((block, index) => {
      if (!block || typeof block !== 'object') {
        throw new Error(`Block ${index} must be a valid object`);
      }

      if (!block.type) {
        throw new Error(`Block ${index} missing required 'type' field`);
      }

      if (!supportedBlockTypes.includes(block.type)) {
        throw new Error(
          `Block ${index} has unsupported type '${block.type}'. Supported types: ${supportedBlockTypes.join(', ')}`
        );
      }

      // Additional validation for specific block types
      this.validateSpecificBlockType(block, index);
    });

    logger.info('Block Kit validation passed', {
      blocks_count: blocks.length,
      block_types: blocks.map(b => b.type),
    });
  }

  /**
   * Validate specific block type requirements
   */
  private validateSpecificBlockType(block: any, index: number): void {
    switch (block.type) {
      case 'section':
        if (!block.text && !block.fields && !block.accessory) {
          throw new Error(`Section block ${index} must have text, fields, or accessory`);
        }
        break;

      case 'actions':
        if (!block.elements || !Array.isArray(block.elements) || block.elements.length === 0) {
          throw new Error(`Actions block ${index} must have elements array`);
        }
        if (block.elements.length > 25) {
          throw new Error(`Actions block ${index} can have maximum 25 elements`);
        }
        break;

      case 'header':
        if (!block.text || !block.text.text) {
          throw new Error(`Header block ${index} must have text object with text field`);
        }
        break;

      case 'context':
        if (!block.elements || !Array.isArray(block.elements) || block.elements.length === 0) {
          throw new Error(`Context block ${index} must have elements array`);
        }
        if (block.elements.length > 10) {
          throw new Error(`Context block ${index} can have maximum 10 elements`);
        }
        break;

      case 'image':
        if (!block.image_url) {
          throw new Error(`Image block ${index} must have image_url`);
        }
        if (!block.alt_text) {
          throw new Error(`Image block ${index} must have alt_text for accessibility`);
        }
        break;

      case 'input':
        if (!block.element) {
          throw new Error(`Input block ${index} must have element object`);
        }
        if (!block.label) {
          throw new Error(`Input block ${index} must have label object`);
        }
        break;

      case 'rich_text':
        if (!block.elements || !Array.isArray(block.elements) || block.elements.length === 0) {
          throw new Error(`Rich text block ${index} must have elements array`);
        }
        break;

      case 'markdown':
        if (!block.text) {
          throw new Error(`Markdown block ${index} must have text field`);
        }
        break;
    }
  }
}

/**
 * UpdateMessageBlocksTool - Update existing messages with Block Kit
 * Specialized for updating messages with new Block Kit content
 */
export class UpdateMessageBlocksTool extends BaseSlackTool {
  constructor() {
    const definition: SlackTool = {
      name: 'update_message_blocks',
      description: `Update existing message with Block Kit elements - specialized for dynamic content updates.

UPDATE BEHAVIOR:
- Completely replaces existing blocks with new blocks
- No "edited" indicator shown in Slack when using blocks
- Preserves message threading and reactions
- Maintains message timestamp and permalink

PERFECT FOR:
- Status dashboard updates ("Update deployment progress")
- Interactive form modifications ("Update survey options")
- Progress indicator updates ("Update task completion status")
- Dynamic workflow state changes ("Update approval request status")
- Real-time content refresh ("Update monitoring dashboard")

VALIDATION FEATURES:
- Validates message timestamp format and existence
- Ensures Block Kit compliance (max 50 blocks)
- Provides clear error messages for invalid updates
- Handles all standard Block Kit block types

UPDATE STRATEGIES:
1. Complete replacement: Provide entirely new blocks array
2. Partial modification: Get existing blocks, modify, then update
3. Status updates: Change specific elements while preserving structure

EXAMPLE UPDATE:
// Original message has approval buttons
// Update to show approval status
[
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": ":white_check_mark: *Approved* by John Doe"
    }
  },
  {
    "type": "context", 
    "elements": [
      {"type": "mrkdwn", "text": "Approved on <!date^1693526400^{date_short}|2023-08-31>"}
    ]
  }
]

Returns updated message confirmation with optimization for response size.`,
      category: 'messaging',
      action: 'PUT',
      requiresAuth: true,
      rateLimit: {
        rpm: 30,
        burst: 5,
      },
      inputSchema: {
        type: 'object',
        properties: {
          channel: {
            type: 'string',
            description: 'Channel ID containing the message to update (e.g., C1234567890)',
            pattern: '^C[A-Z0-9]+$',
          },
          ts: {
            type: 'string',
            description: 'Message timestamp to update (acts as message ID)',
            pattern: '^[0-9]+\\.[0-9]+$',
          },
          blocks: {
            type: 'string',
            description: 'JSON string containing new array of Block Kit block objects (max 50 blocks) - replaces all existing blocks. Example: \'[{"type":"header","text":{"type":"plain_text","text":"Updated"}}]\'',
          },
          text: {
            type: 'string', 
            description: 'Updated fallback text for notifications (optional but recommended)',
          },
        },
        required: ['channel', 'ts', 'blocks'],
      },
    };
    super(definition);
  }

  async executeImpl(args: any, context: ToolContext): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    logger.info('Starting Block Kit message update', {
      channel: args.channel,
      message_ts: args.ts,
      blocks_count: args.blocks?.length || 0,
      has_text: !!args.text,
    });

    try {
      // Initialize Slack client
      const auth = new SlackAuth();
      const tokens = auth.extractTokensFromEnvironment();
      if (!tokens) {
        return this.createErrorResult(
          'Slack authentication required for Block Kit message update operations.',
          'AUTH_REQUIRED',
          { executionTime: Date.now() - startTime, apiCalls: 0, cacheHits: 0 }
        );
      }

      const client = new SlackClient(tokens);

      // Parse blocks from JSON string
      let blocks: any[];
      try {
        blocks = JSON.parse(args.blocks);
      } catch (error) {
        return this.createErrorResult(
          `Invalid JSON in blocks parameter: ${error}`,
          'INVALID_INPUT',
          { executionTime: Date.now() - startTime, apiCalls: 0, cacheHits: 0 }
        );
      }

      // Validate Block Kit blocks
      this.validateBlockKitBlocks(blocks);

      // Update message with Block Kit blocks
      const response = await client.updateMessage(
        args.channel,
        args.ts,
        args.text || 'Updated Block Kit message', // Fallback text
        blocks // Parsed Block Kit blocks
      );

      logger.info('Block Kit message updated successfully', {
        channel: args.channel,
        message_ts: args.ts,
        blocks_count: blocks.length,
        execution_time: Date.now() - startTime,
      });

      // Sprint 7.2: Optimized response format (60-70% reduction)
      return this.createSuccessResult(
        {
          success: true,
          channel: response.channel,
          ts: response.ts,
          update_type: 'block_kit',
          blocks_count: blocks.length,
          // Removed: full message object, detailed metadata
        },
        {
          executionTime: Date.now() - startTime,
          apiCalls: 1,
          cacheHits: 0,
        }
      );
    } catch (error) {
      logger.error('Error updating Block Kit message', {
        error,
        channel: args.channel,
        message_ts: args.ts,
        blocks_count: args.blocks?.length || 0,
      });

      return this.createErrorResult(
        `Block Kit message update failed: ${error}`,
        'EXECUTION_ERROR',
        { executionTime: Date.now() - startTime, apiCalls: 0, cacheHits: 0 }
      );
    }
  }

  /**
   * Validate Block Kit blocks structure and requirements
   */
  private validateBlockKitBlocks(blocks: any[]): void {
    if (!Array.isArray(blocks)) {
      throw new Error('Blocks must be an array of Block Kit block objects');
    }

    if (blocks.length === 0) {
      throw new Error('At least one block is required');
    }

    if (blocks.length > 50) {
      throw new Error('Maximum 50 blocks allowed per message');
    }

    const supportedBlockTypes = [
      'section', 'divider', 'actions', 'header', 'context', 
      'image', 'input', 'file', 'rich_text', 'markdown'
    ];

    blocks.forEach((block, index) => {
      if (!block || typeof block !== 'object') {
        throw new Error(`Block ${index} must be a valid object`);
      }

      if (!block.type) {
        throw new Error(`Block ${index} missing required 'type' field`);
      }

      if (!supportedBlockTypes.includes(block.type)) {
        throw new Error(
          `Block ${index} has unsupported type '${block.type}'. Supported types: ${supportedBlockTypes.join(', ')}`
        );
      }

      // Additional validation for specific block types
      this.validateSpecificBlockType(block, index);
    });

    logger.info('Block Kit validation passed', {
      blocks_count: blocks.length,
      block_types: blocks.map(b => b.type),
    });
  }

  /**
   * Validate specific block type requirements
   */
  private validateSpecificBlockType(block: any, index: number): void {
    switch (block.type) {
      case 'section':
        if (!block.text && !block.fields && !block.accessory) {
          throw new Error(`Section block ${index} must have text, fields, or accessory`);
        }
        break;

      case 'actions':
        if (!block.elements || !Array.isArray(block.elements) || block.elements.length === 0) {
          throw new Error(`Actions block ${index} must have elements array`);
        }
        if (block.elements.length > 25) {
          throw new Error(`Actions block ${index} can have maximum 25 elements`);
        }
        break;

      case 'header':
        if (!block.text || !block.text.text) {
          throw new Error(`Header block ${index} must have text object with text field`);
        }
        break;

      case 'context':
        if (!block.elements || !Array.isArray(block.elements) || block.elements.length === 0) {
          throw new Error(`Context block ${index} must have elements array`);
        }
        if (block.elements.length > 10) {
          throw new Error(`Context block ${index} can have maximum 10 elements`);
        }
        break;

      case 'image':
        if (!block.image_url) {
          throw new Error(`Image block ${index} must have image_url`);
        }
        if (!block.alt_text) {
          throw new Error(`Image block ${index} must have alt_text for accessibility`);
        }
        break;

      case 'input':
        if (!block.element) {
          throw new Error(`Input block ${index} must have element object`);
        }
        if (!block.label) {
          throw new Error(`Input block ${index} must have label object`);
        }
        break;

      case 'rich_text':
        if (!block.elements || !Array.isArray(block.elements) || block.elements.length === 0) {
          throw new Error(`Rich text block ${index} must have elements array`);
        }
        break;

      case 'markdown':
        if (!block.text) {
          throw new Error(`Markdown block ${index} must have text field`);
        }
        break;
    }
  }
}