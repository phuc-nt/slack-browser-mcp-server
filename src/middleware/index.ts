// Export all middleware
export { LoggingMiddleware, PerformanceMiddleware, MemoryMiddleware } from './logging.js';
export { ValidationMiddleware, ErrorHandlingMiddleware, DevelopmentMiddleware } from './validation.js';

// Export convenience function to create default middleware stack
import { ToolMiddleware } from '../types/tools.js';
import { LoggingMiddleware, PerformanceMiddleware, MemoryMiddleware } from './logging.js';
import { ValidationMiddleware, ErrorHandlingMiddleware, DevelopmentMiddleware } from './validation.js';

/**
 * Create default middleware stack for development
 */
export function createDevelopmentMiddleware(): ToolMiddleware[] {
  return [
    new ValidationMiddleware(),
    new LoggingMiddleware(),
    new PerformanceMiddleware(),
    new MemoryMiddleware(),
    new DevelopmentMiddleware(),
    new ErrorHandlingMiddleware()
  ];
}

/**
 * Create production middleware stack
 */
export function createProductionMiddleware(): ToolMiddleware[] {
  return [
    new ValidationMiddleware(),
    new LoggingMiddleware(),
    new PerformanceMiddleware(),
    new ErrorHandlingMiddleware()
  ];
}

/**
 * Create minimal middleware stack for testing
 */
export function createTestingMiddleware(): ToolMiddleware[] {
  return [
    new ValidationMiddleware(),
    new ErrorHandlingMiddleware()
  ];
}