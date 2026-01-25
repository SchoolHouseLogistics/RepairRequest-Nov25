import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { apiKeys, users, organizations } from '@shared/schema';
import { eq, and, isNull, or, gte } from 'drizzle-orm';
import crypto from 'crypto';
import { ERROR_CODES } from '../constants';

export interface ApiKeyUser {
  id: string;
  apiKeyId: number;
  organizationId: number;
  organizationName: string;
  permissions: string[];
  isApiKey: true;
}

declare global {
  namespace Express {
    interface Request {
      apiUser?: ApiKeyUser;
    }
  }
}

const API_KEY_PREFIX = 'rr_'; // RepairRequest API key prefix
const KEY_LENGTH = 32; // Length of the random part

/**
 * Generate a new API key
 * Returns the full key (only shown once) and the hash to store
 */
export function generateApiKey(): { key: string; keyPrefix: string; keyHash: string } {
  const randomPart = crypto.randomBytes(KEY_LENGTH).toString('base64url');
  const key = `${API_KEY_PREFIX}${randomPart}`;
  const keyPrefix = key.substring(0, 12); // Store first 12 chars for identification
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');

  return { key, keyPrefix, keyHash };
}

/**
 * Hash an API key for comparison
 */
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Middleware to authenticate requests using API keys
 * Looks for API key in Authorization header: Bearer rr_xxxxx
 * Or in X-API-Key header
 */
export async function apiKeyAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract API key from headers
    let apiKey: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token.startsWith(API_KEY_PREFIX)) {
        apiKey = token;
      }
    }

    if (!apiKey) {
      apiKey = req.headers['x-api-key'] as string;
    }

    if (!apiKey) {
      // No API key provided, let other auth methods handle it
      return next();
    }

    // Validate API key format
    if (!apiKey.startsWith(API_KEY_PREFIX)) {
      res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Invalid API key format',
        },
      });
      return;
    }

    // Hash the key for lookup
    const keyHash = hashApiKey(apiKey);

    // Find the API key in database
    const [keyRecord] = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.keyHash, keyHash),
          isNull(apiKeys.revokedAt),
          or(isNull(apiKeys.expiresAt), gte(apiKeys.expiresAt, new Date()))
        )
      );

    if (!keyRecord) {
      res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Invalid or expired API key',
        },
      });
      return;
    }

    // Get organization info
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, keyRecord.organizationId));

    if (!org) {
      res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Organization not found',
        },
      });
      return;
    }

    // Update last used timestamp
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, keyRecord.id));

    // Set the API user on request
    req.apiUser = {
      id: `api:${keyRecord.id}`,
      apiKeyId: keyRecord.id,
      organizationId: keyRecord.organizationId,
      organizationName: org.name,
      permissions: keyRecord.permissions as string[],
      isApiKey: true,
    };

    next();
  } catch (error) {
    console.error('API key auth error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Authentication error',
      },
    });
  }
}

/**
 * Check if API user has required permission
 */
export function hasPermission(apiUser: ApiKeyUser | undefined, permission: string): boolean {
  if (!apiUser) return false;

  const permissions = apiUser.permissions;

  // Check for wildcard permission
  if (permissions.includes('*')) return true;

  // Check for exact permission
  if (permissions.includes(permission)) return true;

  // Check for category wildcard (e.g., 'requests:*' matches 'requests:read')
  const [category] = permission.split(':');
  if (permissions.includes(`${category}:*`)) return true;

  return false;
}

/**
 * Middleware to require specific API permission
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.apiUser) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'API key required',
        },
      });
    }

    if (!hasPermission(req.apiUser, permission)) {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.INSUFFICIENT_PERMISSIONS,
          message: `Missing required permission: ${permission}`,
        },
      });
    }

    next();
  };
}

/**
 * Combined auth middleware that accepts both session and API key auth
 */
export function combinedAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Check for API key first
  if (req.apiUser) {
    return next();
  }

  // Check for session auth
  if ((req as any).user) {
    return next();
  }

  res.status(401).json({
    success: false,
    error: {
      code: ERROR_CODES.UNAUTHORIZED,
      message: 'Authentication required',
    },
  });
}

// Available permissions
export const API_PERMISSIONS = {
  // Request permissions
  'requests:read': 'Read requests',
  'requests:write': 'Create and update requests',
  'requests:delete': 'Delete requests',

  // Building permissions
  'buildings:read': 'Read buildings',
  'buildings:write': 'Create and update buildings',

  // Facility permissions
  'facilities:read': 'Read facilities',
  'facilities:write': 'Create and update facilities',

  // User permissions
  'users:read': 'Read users',
  'users:write': 'Create and update users',

  // Report permissions
  'reports:read': 'Read reports and analytics',

  // Webhook permissions
  'webhooks:read': 'Read webhooks',
  'webhooks:write': 'Create and update webhooks',

  // Full access
  '*': 'Full access to all resources',
} as const;

export type ApiPermission = keyof typeof API_PERMISSIONS;
