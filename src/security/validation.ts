// Simple validation without external libraries for now
// TODO: Add proper Ajv validation in production
import { logger } from '../utils/logger.js';

/**
 * Input validation and sanitization utilities
 */
export class InputValidator {
  constructor() {
    // Simple validation without Ajv for now
  }

  /**
   * Validate input against JSON schema (simplified version)
   */
  validateInput(input: any, schema: any): { isValid: boolean; errors: string[]; sanitized: any } {
    try {
      const inputCopy = JSON.parse(JSON.stringify(input)); // Deep copy
      
      // Basic validation - check required fields
      if (schema.required && Array.isArray(schema.required)) {
        for (const field of schema.required) {
          if (!(field in inputCopy)) {
            return {
              isValid: false,
              errors: [`Required field missing: ${field}`],
              sanitized: inputCopy
            };
          }
        }
      }

      return {
        isValid: true,
        errors: [],
        sanitized: inputCopy
      };
    } catch (error) {
      logger.error('Input validation error', { error });
      return {
        isValid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        sanitized: input
      };
    }
  }

  /**
   * Sanitize string input to prevent XSS and injection attacks
   */
  sanitizeString(input: string, options: {
    maxLength?: number;
    allowHtml?: boolean;
    allowScripts?: boolean;
  } = {}): string {
    const {
      maxLength = 10000,
      allowHtml = false,
      allowScripts = false
    } = options;

    let sanitized = input;

    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
      logger.warn('String truncated due to length', {
        originalLength: input.length,
        maxLength
      });
    }

    // Remove script tags unless explicitly allowed
    if (!allowScripts) {
      sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }

    // Remove HTML tags unless explicitly allowed
    if (!allowHtml) {
      sanitized = sanitized.replace(/<[^>]*>?/gm, '');
    }

    // Remove potentially dangerous characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    return sanitized;
  }

  /**
   * Sanitize object recursively
   */
  sanitizeObject(input: any, options: {
    maxDepth?: number;
    maxKeys?: number;
    sanitizeStrings?: boolean;
  } = {}): any {
    const {
      maxDepth = 10,
      maxKeys = 100,
      sanitizeStrings = true
    } = options;

    return this.sanitizeObjectRecursive(input, maxDepth, maxKeys, sanitizeStrings, 0);
  }

  private sanitizeObjectRecursive(
    input: any, 
    maxDepth: number, 
    maxKeys: number, 
    sanitizeStrings: boolean, 
    currentDepth: number
  ): any {
    // Prevent deep recursion
    if (currentDepth >= maxDepth) {
      logger.warn('Object sanitization stopped due to max depth', { maxDepth, currentDepth });
      return '[Object: Max depth exceeded]';
    }

    if (input === null || input === undefined) {
      return input;
    }

    if (typeof input === 'string') {
      return sanitizeStrings ? this.sanitizeString(input) : input;
    }

    if (typeof input === 'number' || typeof input === 'boolean') {
      return input;
    }

    if (Array.isArray(input)) {
      // Limit array size
      const limitedArray = input.slice(0, maxKeys);
      if (input.length > maxKeys) {
        logger.warn('Array truncated due to size', {
          originalLength: input.length,
          maxKeys
        });
      }

      return limitedArray.map(item => 
        this.sanitizeObjectRecursive(item, maxDepth, maxKeys, sanitizeStrings, currentDepth + 1)
      );
    }

    if (typeof input === 'object') {
      const keys = Object.keys(input);
      
      // Limit object keys
      const limitedKeys = keys.slice(0, maxKeys);
      if (keys.length > maxKeys) {
        logger.warn('Object keys truncated due to count', {
          originalKeys: keys.length,
          maxKeys
        });
      }

      const sanitized: any = {};
      for (const key of limitedKeys) {
        // Sanitize key name
        const sanitizedKey = sanitizeStrings ? this.sanitizeString(key, { maxLength: 100 }) : key;
        sanitized[sanitizedKey] = this.sanitizeObjectRecursive(
          input[key], 
          maxDepth, 
          maxKeys, 
          sanitizeStrings, 
          currentDepth + 1
        );
      }

      return sanitized;
    }

    return input;
  }

  /**
   * Validate tool name
   */
  validateToolName(toolName: string): { isValid: boolean; error?: string } {
    if (!toolName || typeof toolName !== 'string') {
      return { isValid: false, error: 'Tool name must be a non-empty string' };
    }

    if (toolName.length > 100) {
      return { isValid: false, error: 'Tool name too long (max 100 characters)' };
    }

    // Only allow alphanumeric, underscore, hyphen
    if (!/^[a-zA-Z0-9_-]+$/.test(toolName)) {
      return { isValid: false, error: 'Tool name contains invalid characters' };
    }

    return { isValid: true };
  }

  /**
   * Validate resource URI
   */
  validateResourceUri(uri: string): { isValid: boolean; error?: string } {
    if (!uri || typeof uri !== 'string') {
      return { isValid: false, error: 'Resource URI must be a non-empty string' };
    }

    if (uri.length > 500) {
      return { isValid: false, error: 'Resource URI too long (max 500 characters)' };
    }

    // Must start with slack://
    if (!uri.startsWith('slack://')) {
      return { isValid: false, error: 'Resource URI must start with slack://' };
    }

    // Basic URI validation
    try {
      new URL(uri);
    } catch {
      return { isValid: false, error: 'Invalid URI format' };
    }

    return { isValid: true };
  }
}

/**
 * Rate limiting utilities
 */
export class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();

  /**
   * Check if request is within rate limit
   */
  checkRateLimit(key: string, maxRequests: number, windowMs: number): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const existing = this.requests.get(key);

    if (!existing || now > existing.resetTime) {
      // New window or expired window
      this.requests.set(key, {
        count: 1,
        resetTime: now + windowMs
      });

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: now + windowMs
      };
    }

    if (existing.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: existing.resetTime
      };
    }

    // Increment count
    existing.count++;
    this.requests.set(key, existing);

    return {
      allowed: true,
      remaining: maxRequests - existing.count,
      resetTime: existing.resetTime
    };
  }

  /**
   * Reset rate limit for a key
   */
  resetRateLimit(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.requests.entries()) {
      if (now > data.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * Get current stats
   */
  getStats(): { totalKeys: number; activeKeys: number } {
    const now = Date.now();
    let activeKeys = 0;

    for (const data of this.requests.values()) {
      if (now <= data.resetTime) {
        activeKeys++;
      }
    }

    return {
      totalKeys: this.requests.size,
      activeKeys
    };
  }
}

/**
 * Security utilities
 */
export class SecurityUtils {
  private static readonly SENSITIVE_PATTERNS = [
    /xoxc-[0-9]+-[0-9]+-[0-9]+-[a-f0-9]+/gi, // Slack user tokens
    /xoxd-[a-f0-9-]+/gi, // Slack workspace tokens
    /sk-[a-zA-Z0-9]+/gi, // OpenAI API keys
    /ghp_[a-zA-Z0-9]+/gi, // GitHub personal access tokens
    /glpat-[a-zA-Z0-9_-]+/gi, // GitLab personal access tokens
  ];

  /**
   * Check if text contains sensitive information
   */
  static containsSensitiveInfo(text: string): boolean {
    return this.SENSITIVE_PATTERNS.some(pattern => pattern.test(text));
  }

  /**
   * Redact sensitive information from text
   */
  static redactSensitiveInfo(text: string): string {
    let redacted = text;
    
    for (const pattern of this.SENSITIVE_PATTERNS) {
      redacted = redacted.replace(pattern, '[REDACTED]');
    }

    return redacted;
  }

  /**
   * Generate secure random string
   */
  static generateSecureId(length: number = 16): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * Hash string for logging/tracking purposes
   */
  static hashString(input: string): string {
    let hash = 0;
    if (input.length === 0) return hash.toString();
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(36);
  }

  /**
   * Validate environment variables are properly set
   */
  static validateEnvironment(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for development vs production settings
    const nodeEnv = process.env.NODE_ENV;
    if (!nodeEnv) {
      errors.push('NODE_ENV is not set');
    }

    // Check log level
    const logLevel = process.env.LOG_LEVEL;
    const validLogLevels = ['error', 'warn', 'info', 'debug'];
    if (logLevel && !validLogLevels.includes(logLevel)) {
      errors.push(`Invalid LOG_LEVEL: ${logLevel}. Must be one of: ${validLogLevels.join(', ')}`);
    }

    // In production, certain settings should be configured
    if (nodeEnv === 'production') {
      if (logLevel === 'debug') {
        errors.push('LOG_LEVEL should not be debug in production');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}