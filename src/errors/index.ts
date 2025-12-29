/**
 * Custom Error Classes
 * Provides typed error classes for better error handling and debugging
 */

/**
 * Base error class for all custom errors
 * Extends Error with additional context and metadata
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * User not found error
 * Thrown when a user lookup fails
 */
export class UserNotFoundError extends AppError {
  constructor(identifier: string | number, context?: Record<string, unknown>) {
    const message = typeof identifier === 'number'
      ? `User with ID ${identifier} not found`
      : `User with phone ${identifier} not found`;
    
    super(message, 'USER_NOT_FOUND', 404, true, {
      identifier,
      ...context,
    });
  }
}

/**
 * Validation error
 * Thrown when input validation fails
 */
export class ValidationError extends AppError {
  constructor(message: string, field?: string, value?: unknown, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, true, {
      field,
      value,
      ...context,
    });
  }
}

/**
 * Database error
 * Thrown when database operations fail
 */
export class DatabaseError extends AppError {
  constructor(message: string, operation?: string, context?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', 500, true, {
      operation,
      ...context,
    });
  }
}

/**
 * API error
 * Thrown when external API calls fail
 */
export class ApiError extends AppError {
  constructor(
    message: string,
    service: string,
    statusCode?: number,
    response?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message, 'API_ERROR', statusCode || 502, true, {
      service,
      response,
      ...context,
    });
    // Override statusCode if provided
    if (statusCode) {
      this.statusCode = statusCode;
    }
  }
}

/**
 * Configuration error
 * Thrown when configuration is invalid or missing
 */
export class ConfigurationError extends AppError {
  constructor(message: string, configKey?: string, context?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', 500, false, {
      configKey,
      ...context,
    });
  }
}

/**
 * Resource not found error
 * Generic error for when a resource is not found
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier: string | number, context?: Record<string, unknown>) {
    super(
      `${resource} with identifier ${identifier} not found`,
      'NOT_FOUND',
      404,
      true,
      {
        resource,
        identifier,
        ...context,
      }
    );
  }
}

/**
 * Unauthorized error
 * Thrown when authentication or authorization fails
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', context?: Record<string, unknown>) {
    super(message, 'UNAUTHORIZED', 401, true, context);
  }
}

/**
 * Forbidden error
 * Thrown when access is forbidden
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', context?: Record<string, unknown>) {
    super(message, 'FORBIDDEN', 403, true, context);
  }
}

