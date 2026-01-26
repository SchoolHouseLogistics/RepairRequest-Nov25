import { Request, Response, NextFunction } from 'express';
import { ERROR_CODES } from '../constants';

// Type for authenticated user from session
export type AuthenticatedUser = {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  organizationId?: number;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Authentication middleware that checks for valid session
 */
export const authMiddleware = (req: any, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Authentication required',
      },
    });
  }

  // Set req.user from session
  req.user = req.session.user;
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
  return (req: any, res: Response, next: NextFunction) => {
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
export const requireOrganization = (req: any, res: Response, next: NextFunction) => {
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
 * Get user info helper
 */
export async function getUserInfo(req: any): Promise<{ userId: string | null; user: AuthenticatedUser | null }> {
  if (!req.session?.user) {
    return { userId: null, user: null };
  }

  return {
    userId: req.session.user.id,
    user: req.session.user as AuthenticatedUser,
  };
}
