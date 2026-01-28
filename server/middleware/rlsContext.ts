import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';

/**
 * Middleware to set RLS (Row Level Security) context for database queries.
 * This sets PostgreSQL session variables that the RLS policies use to filter data.
 *
 * Must be called AFTER authentication middleware so req.user is available.
 */
export async function setRLSContext(req: any, res: Response, next: NextFunction) {
  try {
    const user = req.user;

    if (user) {
      // Set organization context for RLS policies
      const orgId = user.organizationId || 0;
      const isSuperAdmin = user.role === 'super_admin';

      // Set PostgreSQL session variables
      await db.execute(sql`SELECT set_config('app.organization_id', ${String(orgId)}, true)`);
      await db.execute(sql`SELECT set_config('app.is_super_admin', ${String(isSuperAdmin)}, true)`);
    } else {
      // Clear context for unauthenticated requests
      await db.execute(sql`SELECT set_config('app.organization_id', '', true)`);
      await db.execute(sql`SELECT set_config('app.is_super_admin', 'false', true)`);
    }

    next();
  } catch (error) {
    console.error('Error setting RLS context:', error);
    // Don't block the request if RLS context fails
    next();
  }
}

/**
 * Helper to manually set RLS context (for background jobs, etc.)
 */
export async function setRLSContextManual(organizationId: number | null, isSuperAdmin: boolean = false) {
  await db.execute(sql`SELECT set_config('app.organization_id', ${String(organizationId || '')}, true)`);
  await db.execute(sql`SELECT set_config('app.is_super_admin', ${String(isSuperAdmin)}, true)`);
}

/**
 * Clear RLS context (for cleanup)
 */
export async function clearRLSContext() {
  await db.execute(sql`SELECT set_config('app.organization_id', '', true)`);
  await db.execute(sql`SELECT set_config('app.is_super_admin', 'false', true)`);
}
