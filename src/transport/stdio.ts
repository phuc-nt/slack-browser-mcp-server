import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { logger } from '../utils/logger.js';

export class StdioTransport {
  private transport: StdioServerTransport;

  constructor() {
    this.transport = new StdioServerTransport();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    process.on('SIGINT', this.handleShutdown.bind(this));
    process.on('SIGTERM', this.handleShutdown.bind(this));
    process.on('uncaughtException', this.handleError.bind(this));
    process.on('unhandledRejection', this.handleError.bind(this));
  }

  private handleShutdown(): void {
    logger.info('Received shutdown signal, closing transport');
    process.exit(0);
  }

  private handleError(error: Error): void {
    logger.error('Unhandled error in transport', { error: error.message, stack: error.stack });
    process.exit(1);
  }

  getTransport(): StdioServerTransport {
    return this.transport;
  }
}