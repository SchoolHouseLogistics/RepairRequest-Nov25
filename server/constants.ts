// Centralized constants for the application

export const REQUEST_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
} as const;

export type RequestStatus = typeof REQUEST_STATUSES[keyof typeof REQUEST_STATUSES];

export const USER_ROLES = {
  REQUESTER: 'requester',
  MAINTENANCE: 'maintenance',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const REQUEST_TYPES = {
  FACILITIES: 'facilities',
  BUILDING: 'building',
  TECH: 'tech',
} as const;

export type RequestType = typeof REQUEST_TYPES[keyof typeof REQUEST_TYPES];

export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type PriorityLevel = typeof PRIORITY_LEVELS[keyof typeof PRIORITY_LEVELS];

export const TECH_CATEGORIES = {
  HARDWARE: 'hardware',
  SOFTWARE: 'software',
  NETWORK: 'network',
  OTHER: 'other',
} as const;

export type TechCategory = typeof TECH_CATEGORIES[keyof typeof TECH_CATEGORIES];

export const AUDIT_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  PASSWORD_RESET: 'password_reset',
  ROLE_CHANGE: 'role_change',
  ASSIGNMENT: 'assignment',
  STATUS_CHANGE: 'status_change',
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];

export const RESOURCE_TYPES = {
  REQUEST: 'request',
  USER: 'user',
  ORGANIZATION: 'organization',
  BUILDING: 'building',
  FACILITY: 'facility',
  MESSAGE: 'message',
  ASSIGNMENT: 'assignment',
} as const;

export type ResourceType = typeof RESOURCE_TYPES[keyof typeof RESOURCE_TYPES];

// Pagination defaults
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_OFFSET: 0,
} as const;

// Rate limiting defaults (requests per window)
export const RATE_LIMITS = {
  PASSWORD_RESET: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  LOGIN: { maxRequests: 10, windowMs: 15 * 60 * 1000 }, // 10 per 15 minutes
  API_GENERAL: { maxRequests: 1000, windowMs: 60 * 60 * 1000 }, // 1000 per hour
  REQUEST_CREATE: { maxRequests: 100, windowMs: 24 * 60 * 60 * 1000 }, // 100 per day
} as const;

// File upload limits
export const FILE_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
} as const;

// Error codes for standardized responses
export const ERROR_CODES = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Authorization errors
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Rate limiting
  RATE_LIMITED: 'RATE_LIMITED',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

  // Feature errors
  FEATURE_DISABLED: 'FEATURE_DISABLED',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
