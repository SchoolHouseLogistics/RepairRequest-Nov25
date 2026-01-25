import { z } from 'zod';
import { PRIORITY_LEVELS, REQUEST_TYPES, USER_ROLES, TECH_CATEGORIES } from '../constants';

// ============================================
// COMMON SCHEMAS
// ============================================

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// ============================================
// USER SCHEMAS
// ============================================

export const createUserSchema = z.object({
  email: z.string().email().max(255).transform(v => v.toLowerCase().trim()),
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  password: z.string().min(8).max(128).optional(),
  role: z.enum(['requester', 'maintenance', 'admin', 'super_admin']).default('requester'),
  organizationId: z.number().int().positive().optional().nullable(),
});

export const updateUserSchema = z.object({
  email: z.string().email().max(255).transform(v => v.toLowerCase().trim()).optional(),
  firstName: z.string().min(1).max(100).trim().optional(),
  lastName: z.string().min(1).max(100).trim().optional(),
  role: z.enum(['requester', 'maintenance', 'admin', 'super_admin']).optional(),
  organizationId: z.number().int().positive().optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().email().max(255).transform(v => v.toLowerCase().trim()),
  password: z.string().min(1).max(128),
});

export const signupSchema = z.object({
  email: z.string().email().max(255).transform(v => v.toLowerCase().trim()),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email().max(255).transform(v => v.toLowerCase().trim()),
});

export const passwordResetSchema = z.object({
  token: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});

// ============================================
// ORGANIZATION SCHEMAS
// ============================================

export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  domain: z.string().max(255).optional().nullable(),
  logoUrl: z.string().url().max(500).optional().nullable(),
  settings: z.record(z.any()).optional().nullable(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(255).trim().optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  domain: z.string().max(255).optional().nullable(),
  logoUrl: z.string().url().max(500).optional().nullable(),
  settings: z.record(z.any()).optional().nullable(),
});

// ============================================
// BUILDING SCHEMAS
// ============================================

export const createBuildingSchema = z.object({
  organizationId: z.number().int().positive(),
  name: z.string().min(1).max(255).trim(),
  address: z.string().max(500).trim().optional().nullable(),
  description: z.string().max(1000).trim().optional().nullable(),
  roomNumbers: z.union([
    z.array(z.string().max(50)),
    z.string().transform(s => s ? s.split(',').map(r => r.trim()).filter(Boolean) : [])
  ]).optional().default([]),
});

export const updateBuildingSchema = z.object({
  name: z.string().min(1).max(255).trim().optional(),
  address: z.string().max(500).trim().optional().nullable(),
  description: z.string().max(1000).trim().optional().nullable(),
  roomNumbers: z.union([
    z.array(z.string().max(50)),
    z.string().transform(s => s ? s.split(',').map(r => r.trim()).filter(Boolean) : [])
  ]).optional(),
});

// ============================================
// FACILITY SCHEMAS
// ============================================

export const createFacilitySchema = z.object({
  organizationId: z.number().int().positive(),
  name: z.string().min(1).max(255).trim(),
  description: z.string().max(1000).trim().optional().nullable(),
});

export const updateFacilitySchema = z.object({
  name: z.string().min(1).max(255).trim().optional(),
  description: z.string().max(1000).trim().optional().nullable(),
  isActive: z.boolean().optional(),
});

// ============================================
// REQUEST SCHEMAS
// ============================================

export const createRequestSchema = z.object({
  requestType: z.enum(['facilities', 'building', 'tech']),
  facility: z.string().min(1).max(255).trim(),
  event: z.string().max(500).trim().optional().nullable(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  organizationId: z.number().int().positive().optional(),
});

export const updateRequestStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'in-progress', 'completed', 'cancelled', 'rejected']),
  note: z.string().max(2000).trim().optional(),
});

export const createBuildingRequestSchema = z.object({
  building: z.string().min(1).max(255).trim(),
  roomNumber: z.string().min(1).max(50).trim(),
  description: z.string().min(5).max(5000).trim(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  event: z.string().max(500).trim().optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const createTechRequestSchema = z.object({
  category: z.enum(['hardware', 'software', 'network', 'other']),
  deviceType: z.string().max(100).trim().optional().nullable(),
  deviceLocation: z.string().max(255).trim().optional().nullable(),
  assetTag: z.string().max(50).trim().optional().nullable(),
  description: z.string().min(5).max(5000).trim(),
  errorMessage: z.string().max(1000).trim().optional().nullable(),
  stepsToReproduce: z.string().max(2000).trim().optional().nullable(),
  urgencyReason: z.string().max(500).trim().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  event: z.string().max(500).trim().optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// ============================================
// MESSAGE SCHEMAS
// ============================================

export const createMessageSchema = z.object({
  content: z.string().min(1).max(5000).trim(),
});

// ============================================
// ASSIGNMENT SCHEMAS
// ============================================

export const createAssignmentSchema = z.object({
  assigneeId: z.string().min(1).max(50),
  internalNotes: z.string().max(2000).trim().optional().nullable(),
});

// ============================================
// WEBHOOK SCHEMAS
// ============================================

export const createWebhookSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  url: z.string().url().max(2000),
  events: z.array(z.string().max(50)).min(1).max(20),
});

export const updateWebhookSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  url: z.string().url().max(2000).optional(),
  events: z.array(z.string().max(50)).min(1).max(20).optional(),
  active: z.boolean().optional(),
});

// ============================================
// API KEY SCHEMAS
// ============================================

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100).trim(),
  permissions: z.array(z.string().max(50)).min(1).max(20),
  expiresAt: z.string().datetime().optional().nullable(),
});

// ============================================
// TEMPLATE SCHEMAS
// ============================================

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).trim().optional().nullable(),
  requestType: z.enum(['facilities', 'building', 'tech']),
  facility: z.string().max(255).trim().optional().nullable(),
  defaultPriority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  fields: z.record(z.any()).optional().nullable(),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(500).trim().optional().nullable(),
  requestType: z.enum(['facilities', 'building', 'tech']).optional(),
  facility: z.string().max(255).trim().optional().nullable(),
  defaultPriority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  fields: z.record(z.any()).optional().nullable(),
  isActive: z.boolean().optional(),
});

// ============================================
// SLA SCHEMAS
// ============================================

export const updateSLAConfigSchema = z.object({
  responseHours: z.number().int().min(1).max(720).optional(), // Max 30 days
  resolutionHours: z.number().int().min(1).max(2160).optional(), // Max 90 days
  escalationEnabled: z.boolean().optional(),
  escalationEmail: z.string().email().max(255).optional().nullable(),
  priorityOverrides: z.record(
    z.object({
      response: z.number().int().min(1).max(720),
      resolution: z.number().int().min(1).max(2160),
    })
  ).optional(),
});

// ============================================
// EXPORT SCHEMAS
// ============================================

export const exportQuerySchema = z.object({
  type: z.enum(['requests', 'users', 'buildings', 'facilities']),
  format: z.enum(['json', 'csv']).default('json'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  includeDeleted: z.coerce.boolean().default(false),
});

// ============================================
// ORGANIZATION FEATURES SCHEMAS
// ============================================

export const updateOrganizationFeaturesSchema = z.object({
  techRequestsEnabled: z.boolean().optional(),
  buildingRequestsEnabled: z.boolean().optional(),
  facilitiesRequestsEnabled: z.boolean().optional(),
  slaResponseHours: z.number().int().min(1).max(720).optional(),
  slaResolutionHours: z.number().int().min(1).max(2160).optional(),
  slaEscalationEnabled: z.boolean().optional(),
  slaEscalationEmail: z.string().email().max(255).optional().nullable(),
  slaPriorityOverrides: z.record(
    z.object({
      response: z.number().int().min(1).max(720),
      resolution: z.number().int().min(1).max(2160),
    })
  ).optional(),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validate request body and return typed data or throw ValidationError
 */
export function validateBody<T extends z.ZodSchema>(
  schema: T,
  data: unknown
): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const error of result.error.errors) {
      const path = error.path.join('.');
      errors[path || 'body'] = error.message;
    }
    throw { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Validation failed', details: errors };
  }
  return result.data;
}

/**
 * Validate query parameters
 */
export function validateQuery<T extends z.ZodSchema>(
  schema: T,
  data: unknown
): z.infer<T> {
  return validateBody(schema, data);
}

/**
 * Validate URL parameters
 */
export function validateParams<T extends z.ZodSchema>(
  schema: T,
  data: unknown
): z.infer<T> {
  return validateBody(schema, data);
}
