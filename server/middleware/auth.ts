import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ERROR_CODES } from '../constants';

// Zod schema for session user validation
const sessionUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['requester', 'maintenance', 'admin', 'super_admin']),
  firstName: z.string(),
  lastName: z.string(),
  organizationId: z.number().optional(),
  organizationName: z.string().optional(),
});

// Type for authenticated user from session
export type AuthenticatedUser = z.infer<typeof sessionUserSchema>;

// Extended Request type with session
interface AuthenticatedRequest extends Request {
  session: Request['session'] & {
    user?: unknown;
  };
  user?: AuthenticatedUser;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Validates and sanitizes session user object
 * Returns null if validation fails
 */
function validateSessionUser(user: unknown): AuthenticatedUser | null {
  try {
    const result = sessionUserSchema.safeParse(user);
    if (result.success) {
      return result.data;
    }
    console.error('Session user validation failed:', result.error.message);
    return null;
  } catch (error) {
    console.error('Session user validation error:', error);
    return null;
  }
}

/**
 * Authentication middleware that checks for valid session
 */
export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Authentication required',
      },
    });
  }

  // Validate and sanitize session user
  const validatedUser = validateSessionUser(req.session.user);
  if (!validatedUser) {
    // Invalid session data - clear it and require re-authentication
    req.session.destroy((err) => {
      if (err) console.error('Error destroying invalid session:', err);
    });
    return res.status(401).json({
      success: false,
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Invalid session. Please log in again.',
      },
    });
  }

  // Set validated user on request
  req.user = validatedUser;
  next();
};

/**
 * Alias for authMiddleware for compatibility
 */
export const isAuthenticated = authMiddleware;

/**
 * Middleware to check if user has specific role(s)
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: `One of the following roles required: ${roles.join(', ')}`,
        },
      });
    }

    next();
  };
};

/**
 * Middleware to check if user belongs to an organization
 */
export const requireOrganization = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Authentication required',
      },
    });
  }

  if (!req.user.organizationId) {
    return res.status(403).json({
      success: false,
      error: {
        code: ERROR_CODES.FORBIDDEN,
        message: 'Organization membership required',
      },
    });
  }

  next();
};

/**
 * Get user info helper with proper error handling
 */
export async function getUserInfo(req: Request): Promise<{ userId: string | null; user: AuthenticatedUser | null }> {
  try {
    const session = req.session as Request['session'] & { user?: unknown };
    if (!session?.user) {
      return { userId: null, user: null };
    }

    // Validate session user before returning
    const validatedUser = validateSessionUser(session.user);
    if (!validatedUser) {
      return { userId: null, user: null };
    }

    return {
      userId: validatedUser.id,
      user: validatedUser,
    };
  } catch (error) {
    console.error('Error in getUserInfo:', error);
    return { userId: null, user: null };
  }
}
