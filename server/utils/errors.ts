import { Response } from 'express';
import { ERROR_CODES, ErrorCode } from '../constants';

// Base application error class
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: Record<string, string>;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details?: Record<string, string>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

// Specific error classes
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, string>) {
    super(400, ERROR_CODES.VALIDATION_ERROR, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(401, ERROR_CODES.UNAUTHORIZED, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(403, ERROR_CODES.FORBIDDEN, message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(404, ERROR_CODES.NOT_FOUND, `${resource} not found`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, ERROR_CODES.CONFLICT, message);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests, please try again later') {
    super(429, ERROR_CODES.RATE_LIMITED, message);
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'An unexpected error occurred') {
    super(500, ERROR_CODES.INTERNAL_ERROR, message);
  }
}

export class FeatureDisabledError extends AppError {
  constructor(feature: string) {
    super(403, ERROR_CODES.FEATURE_DISABLED, `${feature} is not enabled for your organization`);
  }
}

// Standardized response helpers
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  pagination?: PaginationMeta;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

export interface PaginationMeta {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

// Response helper functions
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  pagination?: PaginationMeta,
  message?: string
): Response {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    ...(pagination && { pagination }),
    ...(message && { message }),
  };
  return res.status(statusCode).json(response);
}

export function sendError(res: Response, error: AppError | Error): Response {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json(error.toJSON());
  }

  // For unexpected errors, log and return generic message
  console.error('Unexpected error:', error);
  return res.status(500).json({
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
    },
  });
}

// Async handler wrapper to catch errors
export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      if (error instanceof AppError) {
        return sendError(res, error);
      }
      next(error);
    });
  };
}

// Zod validation error formatter
export function formatZodError(error: any): Record<string, string> {
  const details: Record<string, string> = {};
  if (error.errors) {
    for (const err of error.errors) {
      const path = err.path.join('.');
      details[path] = err.message;
    }
  }
  return details;
}
