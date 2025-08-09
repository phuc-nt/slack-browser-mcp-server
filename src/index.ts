#!/usr/bin/env node

import 'dotenv/config';
import { SlackMCPServer } from './server.js';
import { logger } from './utils/logger.js';

async function main(): Promise<void> {
  console.log('[DEBUG INDEX] ===== SLACK MCP SERVER STARTING =====');
  console.log('[DEBUG INDEX] This is the TOOL-ONLY architecture version');
  logger.info('Initializing Slack MCP Server');

  const server = new SlackMCPServer();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully');
    await server.stop();
    process.exit(0);
  });

  try {
    await server.run();
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Always run main function since this is the entry point
main().catch((error) => {
  console.error('[DEBUG INDEX] Main function error:', error);
  logger.error('Unhandled error in main', { error });
  process.exit(1);
});