#!/usr/bin/env node

import 'dotenv/config';
import { SlackMCPServer } from './server.js';
import { logger } from './utils/logger.js';

async function main(): Promise<void> {
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

if (require.main === module) {
  main().catch((error) => {
    logger.error('Unhandled error in main', { error });
    process.exit(1);
  });
}