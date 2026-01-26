import { db } from '../db';
import { auditLogs, InsertAuditLog } from '@shared/schema';
import { desc, eq, and, gte, lte, sql } from 'drizzle-orm';
import { AUDIT_ACTIONS, RESOURCE_TYPES, AuditAction, ResourceType } from '../constants';

export interface AuditContext {
  userId?: string;
  organizationId?: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogQuery {
  organizationId?: number;
  userId?: string;
  action?: AuditAction;
  resourceType?: ResourceType;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

class AuditService {
  /**
   * Log an audit event
   */
  async log(
    action: AuditAction,
    resourceType: ResourceType,
    context: AuditContext,
    resourceId?: string | number,
    changes?: Record<string, { old?: any; new?: any }>,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const auditEntry: InsertAuditLog = {
        action,
        resourceType,
        resourceId: resourceId?.toString(),
        userId: context.userId,
        organizationId: context.organizationId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        changes: changes || null,
        metadata: metadata || null,
      };

      await db.insert(auditLogs).values(auditEntry);
    } catch (error) {
      // Don't throw - audit logging should not break main operations
      console.error('Audit logging failed:', error);
    }
  }

  /**
   * Log a create action
   */
  async logCreate(
    resourceType: ResourceType,
    resourceId: string | number,
    context: AuditContext,
    newData?: Record<string, any>
  ): Promise<void> {
    const changes = newData ? { created: { new: newData } } : undefined;
    await this.log(AUDIT_ACTIONS.CREATE, resourceType, context, resourceId, changes);
  }

  /**
   * Log an update action with field-level changes
   */
  async logUpdate(
    resourceType: ResourceType,
    resourceId: string | number,
    context: AuditContext,
    oldData: Record<string, any>,
    newData: Record<string, any>
  ): Promise<void> {
    const changes: Record<string, { old?: any; new?: any }> = {};

    // Track only changed fields
    for (const key of Object.keys(newData)) {
      if (oldData[key] !== newData[key]) {
        changes[key] = { old: oldData[key], new: newData[key] };
      }
    }

    if (Object.keys(changes).length > 0) {
      await this.log(AUDIT_ACTIONS.UPDATE, resourceType, context, resourceId, changes);
    }
  }

  /**
   * Log a delete action
   */
  async logDelete(
    resourceType: ResourceType,
    resourceId: string | number,
    context: AuditContext,
    deletedData?: Record<string, any>
  ): Promise<void> {
    const changes = deletedData ? { deleted: { old: deletedData } } : undefined;
    await this.log(AUDIT_ACTIONS.DELETE, resourceType, context, resourceId, changes);
  }

  /**
   * Log a login event
   */
  async logLogin(userId: string, context: AuditContext, success: boolean): Promise<void> {
    await this.log(
      AUDIT_ACTIONS.LOGIN,
      RESOURCE_TYPES.USER,
      { ...context, userId },
      userId,
      undefined,
      { success }
    );
  }

  /**
   * Log a logout event
   */
  async logLogout(userId: string, context: AuditContext): Promise<void> {
    await this.log(AUDIT_ACTIONS.LOGOUT, RESOURCE_TYPES.USER, context, userId);
  }

  /**
   * Log a status change
   */
  async logStatusChange(
    resourceId: string | number,
    context: AuditContext,
    oldStatus: string,
    newStatus: string,
    note?: string
  ): Promise<void> {
    await this.log(
      AUDIT_ACTIONS.STATUS_CHANGE,
      RESOURCE_TYPES.REQUEST,
      context,
      resourceId,
      { status: { old: oldStatus, new: newStatus } },
      note ? { note } : undefined
    );
  }

  /**
   * Log a role change
   */
  async logRoleChange(
    targetUserId: string,
    context: AuditContext,
    oldRole: string,
    newRole: string
  ): Promise<void> {
    await this.log(
      AUDIT_ACTIONS.ROLE_CHANGE,
      RESOURCE_TYPES.USER,
      context,
      targetUserId,
      { role: { old: oldRole, new: newRole } }
    );
  }

  /**
   * Log an assignment
   */
  async logAssignment(
    requestId: number,
    assigneeId: string,
    context: AuditContext
  ): Promise<void> {
    await this.log(
      AUDIT_ACTIONS.ASSIGNMENT,
      RESOURCE_TYPES.REQUEST,
      context,
      requestId,
      undefined,
      { assigneeId }
    );
  }

  /**
   * Query audit logs with filters and pagination
   */
  async query(params: AuditLogQuery): Promise<{ logs: any[]; total: number }> {
    const { limit = 50, offset = 0 } = params;
    const conditions = [];

    if (params.organizationId) {
      conditions.push(eq(auditLogs.organizationId, params.organizationId));
    }
    if (params.userId) {
      conditions.push(eq(auditLogs.userId, params.userId));
    }
    if (params.action) {
      conditions.push(eq(auditLogs.action, params.action));
    }
    if (params.resourceType) {
      conditions.push(eq(auditLogs.resourceType, params.resourceType));
    }
    if (params.resourceId) {
      conditions.push(eq(auditLogs.resourceId, params.resourceId));
    }
    if (params.startDate) {
      conditions.push(gte(auditLogs.timestamp, params.startDate));
    }
    if (params.endDate) {
      conditions.push(lte(auditLogs.timestamp, params.endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(whereClause);

    // Get paginated results
    const logs = await db
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit)
      .offset(offset);

    return { logs, total: Number(count) };
  }

  /**
   * Get audit context from request
   */
  getContextFromRequest(req: any): AuditContext {
    return {
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
  }
}

export const auditService = new AuditService();
