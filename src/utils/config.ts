import { logger } from './logger.js';

export interface Config {
  slack: {
    xoxcToken?: string;
    xoxdToken?: string;
  };
  logging: {
    level: string;
  };
  environment: string;
}

class ConfigManager {
  private config: Config;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): Config {
    return {
      slack: {
        xoxcToken: process.env.SLACK_XOXC_TOKEN,
        xoxdToken: process.env.SLACK_XOXD_TOKEN,
      },
      logging: {
        level: process.env.LOG_LEVEL || 'info',
      },
      environment: process.env.NODE_ENV || 'development',
    };
  }

  private validateConfig(): void {
    const errors: string[] = [];

    // Slack tokens validation will be added in Phase 2
    // For now, just validate basic config
    if (!['development', 'production', 'test'].includes(this.config.environment)) {
      errors.push('NODE_ENV must be development, production, or test');
    }

    if (!['error', 'warn', 'info', 'debug'].includes(this.config.logging.level)) {
      errors.push('LOG_LEVEL must be error, warn, info, or debug');
    }

    if (errors.length > 0) {
      logger.error('Configuration validation failed', { errors });
      throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }

    logger.info('Configuration loaded successfully', {
      environment: this.config.environment,
      logLevel: this.config.logging.level,
      hasSlackTokens: !!(this.config.slack.xoxcToken && this.config.slack.xoxdToken),
    });
  }

  get(): Config {
    return { ...this.config };
  }

  getSlackConfig() {
    return { ...this.config.slack };
  }

  getLoggingConfig() {
    return { ...this.config.logging };
  }

  isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  isProduction(): boolean {
    return this.config.environment === 'production';
  }
}

export const config = new ConfigManager();