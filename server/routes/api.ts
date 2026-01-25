import { Router } from 'express';
import { authMiddleware, AuthenticatedUser } from '../middleware/auth';
import { webhookService, WebhookEvent } from '../services/webhookService';
import { exportService, ExportType, ExportFormat } from '../services/exportService';
import { templateService } from '../services/templateService';
import { auditService } from '../services/auditService';
import { generateApiKey, API_PERMISSIONS } from '../middleware/apiKeyAuth';
import { passwordResetLimiter, loginLimiter, requestCreateLimiter } from '../middleware/rateLimiter';
import { sendSuccess, sendError, ValidationError, NotFoundError, ForbiddenError } from '../utils/errors';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination';
import { AUDIT_ACTIONS, RESOURCE_TYPES, USER_ROLES } from '../constants';
import { db } from '../db';
import { apiKeys, webhooks } from '@shared/schema';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';

const router = Router();

// ============================================
// WEBHOOK ROUTES
// ============================================

/**
 * Get all webhooks for the organization
 */
router.get('/webhooks', authMiddleware, async (req: any, res) => {
  try {
    const user = req.user as AuthenticatedUser;

    if (!user.organizationId) {
      return sendError(res, new ValidationError('Organization not assigned'));
    }

    // Only admins can manage webhooks
    if (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.SUPER_ADMIN) {
      return sendError(res, new ForbiddenError('Admin access required'));
    }

    const webhookList = await webhookService.getWebhooks(user.organizationId);

    // Don't expose secrets in list view
    const sanitized = webhookList.map(({ secret, ...webhook }) => ({
      ...webhook,
      hasSecret: !!secret,
    }));

    return sendSuccess(res, sanitized);
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return sendError(res, error as Error);
  }
});

/**
 * Create a new webhook
 */
router.post('/webhooks', authMiddleware, async (req: any, res) => {
  try {
    const user = req.user as AuthenticatedUser;

    if (!user.organizationId) {
      return sendError(res, new ValidationError('Organization not assigned'));
    }

    if (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.SUPER_ADMIN) {
      return sendError(res, new ForbiddenError('Admin access required'));
    }

    const { name, url, events } = req.body;

    if (!name || !url || !events || !Array.isArray(events)) {
      return sendError(res, new ValidationError('Name, URL, and events are required'));
    }

    const webhook = await webhookService.createWebhook(
      { name, url, events, createdById: user.id },
      user.organizationId
    );

    // Log the action
    await auditService.logCreate(
      RESOURCE_TYPES.ORGANIZATION,
      webhook.id,
      auditService.getContextFromRequest(req),
      { name, url, events }
    );

    return sendSuccess(res, webhook, 201);
  } catch (error) {
    console.error('Error creating webhook:', error);
    return sendError(res, error as Error);
  }
});

/**
 * Update a webhook
 */
router.put('/webhooks/:id', authMiddleware, async (req: any, res) => {
  try {
    const user = req.user as AuthenticatedUser;
    const webhookId = parseInt(req.params.id);

    if (!user.organizationId) {
      return sendError(res, new ValidationError('Organization not assigned'));
    }

    if (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.SUPER_ADMIN) {
      return sendError(res, new ForbiddenError('Admin access required'));
    }

    const { name, url, events, active } = req.body;

    const webhook = await webhookService.updateWebhook(webhookId, user.organizationId, {
      name,
      url,
      events,
      active,
    });

    if (!webhook) {
      return sendError(res, new NotFoundError('Webhook'));
    }

    return sendSuccess(res, webhook);
  } catch (error) {
    console.error('Error updating webhook:', error);
    return sendError(res, error as Error);
  }
});

/**
 * Delete a webhook
 */
router.delete('/webhooks/:id', authMiddleware, async (req: any, res) => {
  try {
    const user = req.user as AuthenticatedUser;
    const webhookId = parseInt(req.params.id);

    if (!user.organizationId) {
      return sendError(res, new ValidationError('Organization not assigned'));
    }

    if (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.SUPER_ADMIN) {
      return sendError(res, new ForbiddenError('Admin access required'));
    }

    const deleted = await webhookService.deleteWebhook(webhookId, user.organizationId);

    if (!deleted) {
      return sendError(res, new NotFoundError('Webhook'));
    }

    return sendSuccess(res, { message: 'Webhook deleted' });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return sendError(res, error as Error);
  }
});

/**
 * Regenerate webhook secret
 */
router.post('/webhooks/:id/regenerate-secret', authMiddleware, async (req: any, res) => {
  try {
    const user = req.user as AuthenticatedUser;
    const webhookId = parseInt(req.params.id);

    if (!user.organizationId) {
      return sendError(res, new ValidationError('Organization not assigned'));
    }

    if (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.SUPER_ADMIN) {
      return sendError(res, new ForbiddenError('Admin access required'));
    }

    const secret = await webhookService.regenerateSecret(webhookId, user.organizationId);

    if (!secret) {
      return sendError(res, new NotFoundError('Webhook'));
    }

    return sendSuccess(res, { secret });
  } catch (error) {
    console.error('Error regenerating webhook secret:', error);
    return sendError(res, error as Error);
  }
});

/**
 * Get webhook delivery logs
 */
router.get('/webhooks/:id/deliveries', authMiddleware, async (req: any, res) => {
  try {
    const user = req.user as AuthenticatedUser;
    const webhookId = parseInt(req.params.id);

    if (!user.organizationId) {
      return sendError(res, new ValidationError('Organization not assigned'));
    }

    if (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.SUPER_ADMIN) {
      return sendError(res, new ForbiddenError('Admin access required'));
    }

    // Verify webhook belongs to organization
    const webhook = await webhookService.getWebhook(webhookId, user.organizationId);
    if (!webhook) {
      return sendError(res, new NotFoundError('Webhook'));
    }

    const deliveries = await webhookService.getDeliveryLogs(webhookId);

    return sendSuccess(res, deliveries);
  } catch (error) {
    console.error('Error fetching webhook deliveries:', error);
    return sendError(res, error as Error);
  }
});

// ============================================
// API KEY ROUTES
// ============================================

/**
 * Get all API keys for the organization
 */
router.get('/api-keys', authMiddleware, async (req: any, res) => {
  try {
    const user = req.user as AuthenticatedUser;

    if (!user.organizationId) {
      return sendError(res, new ValidationError('Organization not assigned'));
    }

    if (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.SUPER_ADMIN) {
      return sendError(res, new ForbiddenError('Admin access required'));
    }

    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        permissions: apiKeys.permissions,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.organizationId, user.organizationId),
          isNull(apiKeys.revokedAt)
        )
      )
      .orderBy(desc(apiKeys.createdAt));

    return sendSuccess(res, keys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return sendError(res, error as Error);
  }
});

/**
 * Create a new API key
 */
router.post('/api-keys', authMiddleware, async (req: any, res) => {
  try {
    const user = req.user as AuthenticatedUser;

    if (!user.organizationId) {
      return sendError(res, new ValidationError('Organization not assigned'));
    }

    if (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.SUPER_ADMIN) {
      return sendError(res, new ForbiddenError('Admin access required'));
    }

    const { name, permissions, expiresAt } = req.body;

    if (!name || !permissions || !Array.isArray(permissions)) {
      return sendError(res, new ValidationError('Name and permissions are required'));
    }

    // Validate permissions
    const validPermissions = Object.keys(API_PERMISSIONS);
    for (const perm of permissions) {
      if (!validPermissions.includes(perm)) {
        return sendError(res, new ValidationError(`Invalid permission: ${perm}`));
      }
    }

    const { key, keyPrefix, keyHash } = generateApiKey();

    const [apiKey] = await db
      .insert(apiKeys)
      .values({
        organizationId: user.organizationId,
        name,
        keyPrefix,
        keyHash,
        permissions,
        createdById: user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      })
      .returning();

    // Log the action
    await auditService.logCreate(
      RESOURCE_TYPES.ORGANIZATION,
      apiKey.id,
      auditService.getContextFromRequest(req),
      { name, permissions }
    );

    // Return the full key only on creation (never stored/shown again)
    return sendSuccess(res, {
      id: apiKey.id,
      name: apiKey.name,
      key, // Only shown once!
      keyPrefix: apiKey.keyPrefix,
      permissions: apiKey.permissions,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    }, 201);
  } catch (error) {
    console.error('Error creating API key:', error);
    return sendError(res, error as Error);
  }
});

/**
 * Revoke an API key
 */
router.delete('/api-keys/:id', authMiddleware, async (req: any, res) => {
  try {
    const user = req.user as AuthenticatedUser;
    const keyId = parseInt(req.params.id);

    if (!user.organizationId) {
      return sendError(res, new ValidationError('Organization not assigned'));
    }

    if (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.SUPER_ADMIN) {
      return sendError(res, new ForbiddenError('Admin access required'));
    }

    const [revoked] = await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(apiKeys.id, keyId),
          eq(apiKeys.organizationId, user.organizationId)
        )
      )
      .returning();

    if (!revoked) {
      return sendError(res, new NotFoundError('API key'));
    }

    // Log the action
    await auditService.logDelete(
      RESOURCE_TYPES.ORGANIZATION,
      keyId,
      auditService.getContextFromRequest(req)
    );

    return sendSuccess(res, { message: 'API key revoked' });
  } catch (error) {
    console.error('Error revoking API key:', error);
    return sendError(res, error as Error);
  }
});

/**
 * Get available permissions
 */
router.get('/api-keys/permissions', authMiddleware, async (req: any, res) => {
  return sendSuccess(res, API_PERMISSIONS);
});

// ============================================
// EXPORT ROUTES
// ============================================

/**
 * Export data
 */
router.get('/export', authMiddleware, async (req: any, res) => {
  try {
    const user = req.user as AuthenticatedUser;

    if (!user.organizationId) {
      return sendError(res, new ValidationError('Organization not assigned'));
    }

    if (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.SUPER_ADMIN) {
      return sendError(res, new ForbiddenError('Admin access required'));
    }

    const type = req.query.type as ExportType;
    const format = (req.query.format as ExportFormat) || 'json';
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const includeDeleted = req.query.includeDeleted === 'true';

    if (!type || !['requests', 'users', 'buildings', 'facilities'].includes(type)) {
      return sendError(res, new ValidationError('Valid type is required (requests, users, buildings, facilities)'));
    }

    if (!['json', 'csv'].includes(format)) {
      return sendError(res, new ValidationError('Format must be json or csv'));
    }

    const result = await exportService.export({
      organizationId: user.organizationId,
      type,
      format,
      startDate,
      endDate,
      includeDeleted,
    });

    // Log the export
    await auditService.log(
      AUDIT_ACTIONS.CREATE,
      RESOURCE_TYPES.ORGANIZATION,
      auditService.getContextFromRequest(req),
      undefined,
      undefined,
      { exportType: type, format, recordCount: result.recordCount }
    );

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  } catch (error) {
    console.error('Error exporting data:', error);
    return sendError(res, error as Error);
  }
});

// ============================================
// TEMPLATE ROUTES
// ============================================

/**
 * Get all templates for the organization
 */
router.get('/templates', authMiddleware, async (req: any, res) => {
  try {
    const user = req.user as AuthenticatedUser;

    if (!user.organizationId) {
      return sendError(res, new ValidationError('Organization not assigned'));
    }

    const requestType = req.query.requestType as string | undefined;
    const activeOnly = req.query.activeOnly !== 'false';

    const templates = await templateService.getTemplates(user.organizationId, {
      activeOnly,
      requestType,
    });

    return sendSuccess(res, templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return sendError(res, error as Error);
  }
});

/**
 * Get a single template
 */
router.get('/templates/:id', authMiddleware, async (req: any, res) => {
  try {
    const user = req.user as AuthenticatedUser;
    const templateId = parseInt(req.params.id);

    if (!user.organizationId) {
      return sendError(res, new ValidationError('Organization not assigned'));
    }

    const template = await templateService.getTemplate(templateId, user.organizationId);

    if (!template) {
      return sendError(res, new NotFoundError('Template'));
    }

    return sendSuccess(res, template);
  } catch (error) {
    console.error('Error fetching template:', error);
    return sendError(res, error as Error);
  }
});

/**
 * Create a new template
 */
router.post('/templates', authMiddleware, async (req: any, res) => {
  try {
    const user = req.user as AuthenticatedUser;

    if (!user.organizationId) {
      return sendError(res, new ValidationError('Organization not assigned'));
    }

    if (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.SUPER_ADMIN) {
      return sendError(res, new ForbiddenError('Admin access required'));
    }

    const { name, description, requestType, facility, defaultPriority, fields } = req.body;

    if (!name || !requestType) {
      return sendError(res, new ValidationError('Name and request type are required'));
    }

    const template = await templateService.createTemplate({
      organizationId: user.organizationId,
      name,
      description,
      requestType,
      facility,
      defaultPriority,
      fields,
      createdById: user.id,
    });

    return sendSuccess(res, template, 201);
  } catch (error) {
    console.error('Error creating template:', error);
    return sendError(res, error as Error);
  }
});

/**
 * Update a template
 */
router.put('/templates/:id', authMiddleware, async (req: any, res) => {
  try {
    const user = req.user as AuthenticatedUser;
    const templateId = parseInt(req.params.id);

    if (!user.organizationId) {
      return sendError(res, new ValidationError('Organization not assigned'));
    }

    if (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.SUPER_ADMIN) {
      return sendError(res, new ForbiddenError('Admin access required'));
    }

    const { name, description, requestType, facility, defaultPriority, fields, isActive } = req.body;

    const template = await templateService.updateTemplate(templateId, user.organizationId, {
      name,
      description,
      requestType,
      facility,
      defaultPriority,
      fields,
      isActive,
    });

    if (!template) {
      return sendError(res, new NotFoundError('Template'));
    }

    return sendSuccess(res, template);
  } catch (error) {
    console.error('Error updating template:', error);
    return sendError(res, error as Error);
  }
});

/**
 * Delete a template
 */
router.delete('/templates/:id', authMiddleware, async (req: any, res) => {
  try {
    const user = req.user as AuthenticatedUser;
    const templateId = parseInt(req.params.id);

    if (!user.organizationId) {
      return sendError(res, new ValidationError('Organization not assigned'));
    }

    if (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.SUPER_ADMIN) {
      return sendError(res, new ForbiddenError('Admin access required'));
    }

    const deleted = await templateService.deleteTemplate(templateId, user.organizationId);

    if (!deleted) {
      return sendError(res, new NotFoundError('Template'));
    }

    return sendSuccess(res, { message: 'Template deleted' });
  } catch (error) {
    console.error('Error deleting template:', error);
    return sendError(res, error as Error);
  }
});

/**
 * Record template usage
 */
router.post('/templates/:id/use', authMiddleware, async (req: any, res) => {
  try {
    const user = req.user as AuthenticatedUser;
    const templateId = parseInt(req.params.id);

    if (!user.organizationId) {
      return sendError(res, new ValidationError('Organization not assigned'));
    }

    // Verify template exists and belongs to organization
    const template = await templateService.getTemplate(templateId, user.organizationId);
    if (!template) {
      return sendError(res, new NotFoundError('Template'));
    }

    await templateService.incrementUsage(templateId);

    return sendSuccess(res, { message: 'Usage recorded' });
  } catch (error) {
    console.error('Error recording template usage:', error);
    return sendError(res, error as Error);
  }
});

// ============================================
// AUDIT LOG ROUTES
// ============================================

/**
 * Get audit logs (admin only)
 */
router.get('/audit-logs', authMiddleware, async (req: any, res) => {
  try {
    const user = req.user as AuthenticatedUser;

    if (!user.organizationId) {
      return sendError(res, new ValidationError('Organization not assigned'));
    }

    if (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.SUPER_ADMIN) {
      return sendError(res, new ForbiddenError('Admin access required'));
    }

    const { limit, offset } = getPaginationParams(req);
    const { action, resourceType, userId, startDate, endDate } = req.query;

    const result = await auditService.query({
      organizationId: user.organizationId,
      action: action as any,
      resourceType: resourceType as any,
      userId: userId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit,
      offset,
    });

    return sendSuccess(
      res,
      result.logs,
      200,
      buildPaginationMeta(result.total, limit, offset)
    );
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return sendError(res, error as Error);
  }
});

export default router;
