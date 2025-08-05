// Export all security utilities
export { InputValidator, RateLimiter, SecurityUtils } from './validation.js';

// Export security middleware
import { ToolMiddleware, ToolContext, ToolExecutionResult } from '../types/tools.js';
import { InputValidator, RateLimiter, SecurityUtils } from './validation.js';
import { logger } from '../utils/logger.js';

/**
 * Security middleware that combines validation, rate limiting, and sanitization
 */
export class SecurityMiddleware implements ToolMiddleware {
  name = 'SecurityMiddleware';
  priority = 300; // Highest priority - run first
  
  private validator: InputValidator;
  private rateLimiter: RateLimiter;

  constructor() {
    this.validator = new InputValidator();
    this.rateLimiter = new RateLimiter();
    
    // Cleanup rate limiter every 5 minutes
    setInterval(() => {
      this.rateLimiter.cleanup();
    }, 5 * 60 * 1000);
  }

  async before(context: ToolContext, args: any): Promise<void> {
    // 1. Validate tool name
    const toolNameValidation = this.validator.validateToolName(context.toolName);
    if (!toolNameValidation.isValid) {
      throw new Error(`Invalid tool name: ${toolNameValidation.error}`);
    }

    // 2. Check for sensitive information in args
    const argsString = JSON.stringify(args);
    if (SecurityUtils.containsSensitiveInfo(argsString)) {
      logger.warn('Sensitive information detected in tool arguments', {
        toolName: context.toolName,
        traceId: context.traceId
      });
    }

    // 3. Sanitize input args
    const sanitizedArgs = this.validator.sanitizeObject(args, {
      maxDepth: 5,
      maxKeys: 50,
      sanitizeStrings: true
    });

    // Replace original args with sanitized version
    Object.keys(args).forEach(key => delete args[key]);
    Object.assign(args, sanitizedArgs);

    // 4. Basic rate limiting (per tool)
    const rateLimitKey = `tool:${context.toolName}`;
    const rateLimit = this.rateLimiter.checkRateLimit(rateLimitKey, 60, 60000); // 60 requests per minute
    
    if (!rateLimit.allowed) {
      const resetTime = new Date(rateLimit.resetTime);
      throw new Error(`Rate limit exceeded for tool ${context.toolName}. Reset at ${resetTime.toISOString()}`);
    }

    // 5. Log security info
    logger.debug('Security middleware validation passed', {
      toolName: context.toolName,
      traceId: context.traceId,
      rateLimitRemaining: rateLimit.remaining,
      argsKeys: Object.keys(args)
    });
  }

  async after(context: ToolContext, result: ToolExecutionResult): Promise<void> {
    // Check result for sensitive information
    if (result.data) {
      const resultString = JSON.stringify(result.data);
      if (SecurityUtils.containsSensitiveInfo(resultString)) {
        logger.warn('Sensitive information detected in tool result', {
          toolName: context.toolName,
          traceId: context.traceId
        });
        
        // Redact sensitive info from result
        if (typeof result.data === 'string') {
          result.data = SecurityUtils.redactSensitiveInfo(result.data);
        } else if (typeof result.data === 'object') {
          const redactedString = SecurityUtils.redactSensitiveInfo(resultString);
          try {
            result.data = JSON.parse(redactedString);
          } catch {
            result.data = '[Data redacted due to sensitive content]';
          }
        }
      }
    }
  }

  /**
   * Get rate limiter stats
   */
  getRateLimiterStats() {
    return this.rateLimiter.getStats();
  }

  /**
   * Reset rate limit for a specific key
   */
  resetRateLimit(key: string): void {
    this.rateLimiter.resetRateLimit(key);
  }
}

/**
 * Resource security middleware for validating resource access
 */
export class ResourceSecurityMiddleware {
  private validator: InputValidator;

  constructor() {
    this.validator = new InputValidator();
  }

  /**
   * Validate resource URI before access
   */
  validateResourceAccess(uri: string, requiresAuth: boolean = false): void {
    // 1. Validate URI format
    const uriValidation = this.validator.validateResourceUri(uri);
    if (!uriValidation.isValid) {
      throw new Error(`Invalid resource URI: ${uriValidation.error}`);
    }

    // 2. Check authentication requirement
    if (requiresAuth) {
      // In Phase 2, this will check actual authentication
      logger.debug('Resource requires authentication (Phase 2 feature)', { uri });
    }

    // 3. Check for suspicious patterns
    if (uri.includes('..') || uri.includes('//')) {
      throw new Error('Resource URI contains suspicious patterns');
    }

    logger.debug('Resource access validation passed', { uri, requiresAuth });
  }

  /**
   * Sanitize resource content before returning
   */
  sanitizeResourceContent(content: string, mimeType: string): string {
    if (mimeType === 'application/json') {
      try {
        const parsed = JSON.parse(content);
        const sanitized = this.validator.sanitizeObject(parsed);
        return JSON.stringify(sanitized, null, 2);
      } catch {
        // If JSON parsing fails, treat as text
        return this.validator.sanitizeString(content, { allowHtml: false });
      }
    }

    if (mimeType === 'text/plain' || mimeType.startsWith('text/')) {
      return this.validator.sanitizeString(content, { allowHtml: false });
    }

    // For other types, check for sensitive info and redact
    if (SecurityUtils.containsSensitiveInfo(content)) {
      logger.warn('Sensitive information detected in resource content', { mimeType });
      return SecurityUtils.redactSensitiveInfo(content);
    }

    return content;
  }
}

/**
 * Create security middleware stack
 */
export function createSecurityMiddleware(): ToolMiddleware[] {
  return [
    new SecurityMiddleware()
  ];
}

/**
 * Initialize security system
 */
export function initializeSecurity(): {
  validator: InputValidator;
  rateLimiter: RateLimiter;
  resourceSecurity: ResourceSecurityMiddleware;
} {
  const validator = new InputValidator();
  const rateLimiter = new RateLimiter();
  const resourceSecurity = new ResourceSecurityMiddleware();

  // Validate environment
  const envValidation = SecurityUtils.validateEnvironment();
  if (!envValidation.isValid) {
    logger.warn('Environment validation issues detected', {
      errors: envValidation.errors
    });
  }

  logger.info('Security system initialized', {
    components: ['InputValidator', 'RateLimiter', 'ResourceSecurityMiddleware'],
    environmentValid: envValidation.isValid
  });

  return {
    validator,
    rateLimiter,
    resourceSecurity
  };
}