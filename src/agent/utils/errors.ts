// ============================================================================
// ERROR UTILITIES - Custom error classes and error handling
// ============================================================================

import { AgentError, PrinterError, CloudError, SecurityError, ValidationError } from '../types/index.js';
import { logger } from './logger.js';

export class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle and log errors with appropriate context
   */
  handleError(error: Error, context?: string): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${context}]` : '';
    
    // Log the error
    logger.error(`Error${contextStr}: ${error.message}`, {
      name: error.name,
      stack: error.stack,
      timestamp,
    });

    // Handle specific error types
    if (error instanceof AgentError) {
      this.handleAgentError(error);
    } else if (error instanceof PrinterError) {
      this.handlePrinterError(error);
    } else if (error instanceof CloudError) {
      this.handleCloudError(error);
    } else if (error instanceof SecurityError) {
      this.handleSecurityError(error);
    } else if (error instanceof ValidationError) {
      this.handleValidationError(error);
    } else {
      this.handleGenericError(error);
    }
  }

  private handleAgentError(error: AgentError): void {
    logger.error(`Agent Error [${error.code}]: ${error.message}`, error.details);
    
    // Handle critical agent errors
    if (error.code === 'INITIALIZATION_FAILED') {
      logger.error('Critical: Agent initialization failed. Exiting...');
      process.exit(1);
    }
  }

  private handlePrinterError(error: PrinterError): void {
    logger.error(`Printer Error: ${error.message}`, error.details);
    
    // Notify cloud about printer issues
    // This would typically involve sending a status update
  }

  private handleCloudError(error: CloudError): void {
    logger.error(`Cloud Error: ${error.message}`, error.details);
    
    // Handle connection issues
    if (error.message.includes('ECONNREFUSED')) {
      logger.warn('Cloud server unreachable. Will retry...');
    } else if (error.message.includes('401')) {
      logger.error('Authentication failed. Please check API key.');
    } else if (error.message.includes('403')) {
      logger.error('Access forbidden. Please check permissions.');
    }
  }

  private handleSecurityError(error: SecurityError): void {
    logger.error(`Security Error: ${error.message}`, error.details);
    
    // Security errors are critical
    logger.error('Security violation detected. Shutting down agent...');
    process.exit(1);
  }

  private handleValidationError(error: ValidationError): void {
    logger.error(`Validation Error: ${error.message}`, error.details);
  }

  private handleGenericError(error: Error): void {
    logger.error(`Unexpected Error: ${error.message}`, {
      stack: error.stack,
    });
  }

  /**
   * Wrap async functions with error handling
   */
  wrapAsync<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: string
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handleError(error as Error, context);
        throw error;
      }
    };
  }

  /**
   * Wrap sync functions with error handling
   */
  wrapSync<T extends any[], R>(
    fn: (...args: T) => R,
    context?: string
  ): (...args: T) => R {
    return (...args: T): R => {
      try {
        return fn(...args);
      } catch (error) {
        this.handleError(error as Error, context);
        throw error;
      }
    };
  }
}

// Error factory functions
export function createAgentError(message: string, code: string, details?: any): AgentError {
  return new AgentError(message, code, details);
}

export function createPrinterError(message: string, details?: any): PrinterError {
  return new PrinterError(message, details);
}

export function createCloudError(message: string, details?: any): CloudError {
  return new CloudError(message, details);
}

export function createSecurityError(message: string, details?: any): SecurityError {
  return new SecurityError(message, details);
}

export function createValidationError(message: string, details?: any): ValidationError {
  return new ValidationError(message, details);
}

// Common error messages
export const ERROR_MESSAGES = {
  AGENT: {
    INIT_FAILED: 'Agent initialization failed',
    CONFIG_INVALID: 'Invalid configuration',
    ALREADY_RUNNING: 'Agent is already running',
    NOT_RUNNING: 'Agent is not running',
    SHUTDOWN_FAILED: 'Failed to shutdown agent',
  },
  PRINTER: {
    NOT_FOUND: 'Printer not found',
    OFFLINE: 'Printer is offline',
    BUSY: 'Printer is busy',
    INVALID_NAME: 'Invalid printer name',
    DISCOVERY_FAILED: 'Failed to discover printers',
    PRINT_FAILED: 'Print job failed',
  },
  CLOUD: {
    CONNECTION_FAILED: 'Failed to connect to cloud',
    AUTH_FAILED: 'Authentication failed',
    INVALID_RESPONSE: 'Invalid response from cloud',
    TIMEOUT: 'Request timeout',
    NETWORK_ERROR: 'Network error',
  },
  SECURITY: {
    TAMPER_DETECTED: 'Tampering detected',
    INVALID_CHECKSUM: 'Invalid file checksum',
    UNAUTHORIZED_ACCESS: 'Unauthorized access attempt',
    FILE_MODIFIED: 'Critical file modified',
  },
  VALIDATION: {
    INVALID_INPUT: 'Invalid input provided',
    MISSING_REQUIRED: 'Missing required field',
    INVALID_FORMAT: 'Invalid format',
    OUT_OF_RANGE: 'Value out of range',
  },
} as const;

// Error recovery strategies
export class ErrorRecovery {
  private static instance: ErrorRecovery;
  private retryCounts: Map<string, number> = new Map();
  private maxRetries = 3;

  private constructor() {}

  static getInstance(): ErrorRecovery {
    if (!ErrorRecovery.instance) {
      ErrorRecovery.instance = new ErrorRecovery();
    }
    return ErrorRecovery.instance;
  }

  /**
   * Attempt to recover from an error with retry logic
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries: number = this.maxRetries
  ): Promise<T> {
    const key = context;
    let retryCount = this.retryCounts.get(key) || 0;

    try {
      const result = await operation();
      // Reset retry count on success
      this.retryCounts.delete(key);
      return result;
    } catch (error) {
      retryCount++;
      this.retryCounts.set(key, retryCount);

      if (retryCount >= maxRetries) {
        logger.error(`Max retries (${maxRetries}) exceeded for ${context}`);
        this.retryCounts.delete(key);
        throw error;
      }

      const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 30000); // Exponential backoff, max 30s
      logger.warn(`Retry ${retryCount}/${maxRetries} for ${context} in ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.withRetry(operation, context, maxRetries);
    }
  }

  /**
   * Clear retry count for a context
   */
  clearRetryCount(context: string): void {
    this.retryCounts.delete(context);
  }

  /**
   * Get retry count for a context
   */
  getRetryCount(context: string): number {
    return this.retryCounts.get(context) || 0;
  }
}

// Export singleton instances
export const errorHandler = ErrorHandler.getInstance();
export const errorRecovery = ErrorRecovery.getInstance();
