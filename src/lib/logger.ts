import pino from 'pino';
import config from '../config/index.js';

/**
 * Structured Logger
 * Uses Pino for fast, structured logging
 */

// Determine log level from environment
const logLevel = config.DEBUG ? 'debug' : 'info';

// Create logger instance
export const logger = pino({
  level: logLevel,
  transport: config.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined, // Use default JSON in production
  base: {
    env: config.NODE_ENV,
  },
});

/**
 * Helper function to log errors with context
 */
export function logError(error: Error, context?: Record<string, unknown>) {
  const errorContext = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...context,
  };

  // If it's our custom AppError, include additional context
  if ('code' in error && 'statusCode' in error && 'context' in error) {
    const appError = error as {
      code: string;
      statusCode: number;
      context?: Record<string, unknown>;
    };
    errorContext.errorCode = appError.code;
    errorContext.statusCode = appError.statusCode;
    if (appError.context) {
      Object.assign(errorContext, appError.context);
    }
  }

  logger.error(errorContext, error.message);
}

/**
 * Helper function to log warnings
 */
export function logWarning(message: string, context?: Record<string, unknown>) {
  logger.warn(context || {}, message);
}

/**
 * Helper function to log info messages
 */
export function logInfo(message: string, context?: Record<string, unknown>) {
  logger.info(context || {}, message);
}

/**
 * Helper function to log debug messages
 */
export function logDebug(message: string, context?: Record<string, unknown>) {
  logger.debug(context || {}, message);
}

// Export default logger instance
export default logger;

