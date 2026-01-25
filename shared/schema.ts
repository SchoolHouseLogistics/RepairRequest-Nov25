import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  date,
  time,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Organizations table for multi-tenant support
export const organizations = pgTable(
  "organizations",
  {
    id: serial("id").primaryKey(),
    name: varchar("name").notNull(),
    slug: varchar("slug").unique().notNull(), // URL-friendly identifier
    domain: varchar("domain"), // Optional: auto-assign users by email domain
    logoUrl: varchar("logo_url"),
    settings: jsonb("settings"), // Custom settings per organization
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"), // Soft delete support
  },
  (table) => [
    index("IDX_organizations_domain").on(table.domain),
    index("IDX_organizations_deleted_at").on(table.deletedAt),
  ]
);

// User storage table.
export const users = pgTable(
  "users",
  {
    id: varchar("id").primaryKey().notNull(),
    email: varchar("email").unique(),
    firstName: varchar("first_name"),
    lastName: varchar("last_name"),
    profileImageUrl: varchar("profile_image_url"),
    password: varchar("password"),
    role: varchar("role").notNull().default("requester"), // requester, maintenance, admin
    organizationId: integer("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"), // Soft delete support
  },
  (table) => [
    index("IDX_users_organization_id").on(table.organizationId),
    index("IDX_users_role").on(table.role),
    index("IDX_users_deleted_at").on(table.deletedAt),
  ]
);

// Password reset tokens table
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 64 }).notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"), // Set when token is used
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_password_reset_tokens_user_id").on(table.userId),
    index("IDX_password_reset_tokens_expires_at").on(table.expiresAt),
  ]
);

// Buildings table for organization-specific building data
export const buildings = pgTable(
  "buildings",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name").notNull(),
    address: varchar("address"),
    description: text("description"),
    imageUrl: varchar("image_url", { length: 500 }), // Uploaded building photo
    roomNumbers: text("room_numbers").array(), // Array of room numbers for this building
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"), // Soft delete support
  },
  (table) => [
    index("IDX_buildings_organization_id").on(table.organizationId),
    index("IDX_buildings_is_active").on(table.isActive),
    index("IDX_buildings_deleted_at").on(table.deletedAt),
  ]
);

// Facilities table for organization-specific facility data
export const facilities = pgTable(
  "facilities",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name").notNull(),
    description: text("description"),
    category: varchar("category"),
    availableItems: jsonb("available_items"), // JSON array of available items for facilities requests
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"), // Soft delete support
  },
  (table) => [
    index("IDX_facilities_organization_id").on(table.organizationId),
    index("IDX_facilities_is_active").on(table.isActive),
    index("IDX_facilities_deleted_at").on(table.deletedAt),
  ]
);

// Maintenance requests table
export const requests = pgTable(
  "requests",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    requestType: varchar("request_type").notNull().default("facilities"), // facilities, building, or tech
    facility: varchar("facility").notNull(),
    event: varchar("event").notNull(),
    eventDate: date("event_date").notNull(),
    setupTime: time("setup_time"),
    startTime: time("start_time"),
    endTime: time("end_time"),
    requestorId: varchar("requestor_id").notNull().references(() => users.id),
    status: varchar("status").notNull().default("pending"), // pending, approved, in-progress, completed, cancelled
    priority: varchar("priority", { length: 10 }).notNull().default("medium"), // low, medium, high, urgent
    photoUrl: varchar("photo_url", { length: 2000 }), // URL to uploaded photo
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at"), // Soft delete support
  },
  (table) => [
    index("IDX_requests_organization_id").on(table.organizationId),
    index("IDX_requests_requestor_id").on(table.requestorId),
    index("IDX_requests_status").on(table.status),
    index("IDX_requests_priority").on(table.priority),
    index("IDX_requests_event_date").on(table.eventDate),
    index("IDX_requests_created_at").on(table.createdAt),
    index("IDX_requests_deleted_at").on(table.deletedAt),
    // Composite indexes for common query patterns
    index("IDX_requests_org_status").on(table.organizationId, table.status),
    index("IDX_requests_org_status_created").on(table.organizationId, table.status, table.createdAt),
    index("IDX_requests_requestor_status").on(table.requestorId, table.status),
    index("IDX_requests_org_deleted").on(table.organizationId, table.deletedAt),
  ]
);

// Request items table for facilities requests
export const requestItems = pgTable("request_items", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => requests.id),
  
  // Items from the form
  chairsAudience: boolean("chairs_audience").default(false),
  chairsAudienceQty: integer("chairs_audience_qty"),
  
  chairsStage: boolean("chairs_stage").default(false),
  chairsStageQty: integer("chairs_stage_qty"),
  
  podium: boolean("podium").default(false),
  podiumSound: boolean("podium_sound").default(false),
  podiumLocation: varchar("podium_location"),
  
  audioVisual: boolean("audio_visual").default(false),
  
  avOther: boolean("av_other").default(false),
  avOtherSpec: varchar("av_other_spec"),
  
  tables: boolean("tables").default(false),
  tablesQty: integer("tables_qty"),
  tablesLocation: varchar("tables_location"),
  
  lighting: boolean("lighting").default(false),
  food: boolean("food").default(false),
  cleanup: boolean("cleanup").default(false),
  otherNeeds: text("other_needs"),
});

// Building request details table
export const buildingRequests = pgTable(
  "building_requests",
  {
    id: serial("id").primaryKey(),
    requestId: integer("request_id").notNull().references(() => requests.id),
    building: varchar("building").notNull(),
    roomNumber: varchar("room_number").notNull(),
    description: text("description").notNull(),
  },
  (table) => [
    index("IDX_building_requests_request_id").on(table.requestId),
    index("IDX_building_requests_building").on(table.building),
    index("IDX_building_requests_building_room").on(table.building, table.roomNumber),
  ]
);

// Tech request details table
export const techRequests = pgTable(
  "tech_requests",
  {
    id: serial("id").primaryKey(),
    requestId: integer("request_id").notNull().references(() => requests.id),
    category: varchar("category").notNull(), // hardware, software, network, other
    deviceType: varchar("device_type"), // computer, printer, projector, phone, other
    deviceLocation: varchar("device_location"), // building/room where device is located
    assetTag: varchar("asset_tag"), // optional asset tracking number
    description: text("description").notNull(),
    errorMessage: text("error_message"), // any error messages displayed
    stepsToReproduce: text("steps_to_reproduce"), // how to reproduce the issue
    urgencyReason: text("urgency_reason"), // why this is urgent (if high/urgent priority)
  },
  (table) => [
    index("IDX_tech_requests_request_id").on(table.requestId),
    index("IDX_tech_requests_category").on(table.category),
  ]
);

// Organization feature flags table
export const organizationFeatures = pgTable(
  "organization_features",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }).unique(),
    techRequestsEnabled: boolean("tech_requests_enabled").default(false),
    buildingRequestsEnabled: boolean("building_requests_enabled").default(true),
    facilitiesRequestsEnabled: boolean("facilities_requests_enabled").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("IDX_organization_features_org_id").on(table.organizationId),
  ]
);

// Audit logs for tracking all changes (B2B compliance requirement)
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").references(() => organizations.id),
    userId: varchar("user_id").references(() => users.id),
    action: varchar("action").notNull(), // create, update, delete, login, logout, etc.
    resourceType: varchar("resource_type").notNull(), // request, user, organization, etc.
    resourceId: varchar("resource_id"), // ID of the affected resource
    changes: jsonb("changes"), // {field: {old: value, new: value}}
    metadata: jsonb("metadata"), // Additional context (IP, user agent, etc.)
    ipAddress: varchar("ip_address"),
    userAgent: text("user_agent"),
    timestamp: timestamp("timestamp").defaultNow(),
  },
  (table) => [
    index("IDX_audit_logs_org_id").on(table.organizationId),
    index("IDX_audit_logs_user_id").on(table.userId),
    index("IDX_audit_logs_timestamp").on(table.timestamp),
    index("IDX_audit_logs_resource").on(table.resourceType, table.resourceId),
    index("IDX_audit_logs_action").on(table.action),
  ]
);

// Webhooks for external integrations
export const webhooks = pgTable(
  "webhooks",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name").notNull(),
    url: varchar("url", { length: 2000 }).notNull(),
    secret: varchar("secret", { length: 64 }).notNull(), // HMAC signing secret
    events: jsonb("events").notNull(), // ['request.created', 'request.status_changed', etc.]
    active: boolean("active").default(true),
    createdById: varchar("created_by_id").references(() => users.id),
    lastTriggeredAt: timestamp("last_triggered_at"),
    failureCount: integer("failure_count").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("IDX_webhooks_org_id").on(table.organizationId),
    index("IDX_webhooks_active").on(table.active),
  ]
);

// Webhook delivery logs for debugging
export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: serial("id").primaryKey(),
    webhookId: integer("webhook_id").notNull().references(() => webhooks.id, { onDelete: "cascade" }),
    event: varchar("event").notNull(),
    payload: jsonb("payload").notNull(),
    responseStatus: integer("response_status"),
    responseBody: text("response_body"),
    success: boolean("success").default(false),
    attemptCount: integer("attempt_count").default(1),
    nextRetryAt: timestamp("next_retry_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_webhook_deliveries_webhook_id").on(table.webhookId),
    index("IDX_webhook_deliveries_created_at").on(table.createdAt),
    index("IDX_webhook_deliveries_success").on(table.success),
  ]
);

// API keys for programmatic access
export const apiKeys = pgTable(
  "api_keys",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name").notNull(),
    keyPrefix: varchar("key_prefix", { length: 8 }).notNull(), // First 8 chars for identification
    keyHash: varchar("key_hash").notNull(), // Hashed API key
    permissions: jsonb("permissions").notNull(), // ['requests:read', 'requests:write', etc.]
    createdById: varchar("created_by_id").references(() => users.id),
    lastUsedAt: timestamp("last_used_at"),
    expiresAt: timestamp("expires_at"),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_api_keys_org_id").on(table.organizationId),
    index("IDX_api_keys_key_prefix").on(table.keyPrefix),
    index("IDX_api_keys_expires_at").on(table.expiresAt),
  ]
);

// Request templates for common request types
export const requestTemplates = pgTable(
  "request_templates",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name").notNull(),
    description: text("description"),
    requestType: varchar("request_type").notNull(), // facilities, building, tech
    facility: varchar("facility"),
    defaultPriority: varchar("default_priority").default("medium"),
    fields: jsonb("fields"), // Pre-filled field values
    createdById: varchar("created_by_id").references(() => users.id),
    isActive: boolean("is_active").default(true),
    usageCount: integer("usage_count").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("IDX_request_templates_org_id").on(table.organizationId),
    index("IDX_request_templates_type").on(table.requestType),
    index("IDX_request_templates_active").on(table.isActive),
  ]
);

// Rate limiting tracking table
export const rateLimitRecords = pgTable(
  "rate_limit_records",
  {
    id: serial("id").primaryKey(),
    key: varchar("key").notNull(), // Could be IP, user ID, or combination
    endpoint: varchar("endpoint").notNull(),
    requestCount: integer("request_count").default(1),
    windowStart: timestamp("window_start").defaultNow(),
    windowEnd: timestamp("window_end").notNull(),
  },
  (table) => [
    index("IDX_rate_limit_key_endpoint").on(table.key, table.endpoint),
    index("IDX_rate_limit_window_end").on(table.windowEnd),
  ]
);

// Request assignments table
export const assignments = pgTable(
  "assignments",
  {
    id: serial("id").primaryKey(),
    requestId: integer("request_id").notNull().references(() => requests.id),
    assigneeId: varchar("assignee_id").notNull().references(() => users.id),
    assignerId: varchar("assigner_id").notNull().references(() => users.id),
    assignedAt: timestamp("assigned_at").defaultNow(),
    internalNotes: text("internal_notes"),
  },
  (table) => [
    index("IDX_assignments_request_id").on(table.requestId),
    index("IDX_assignments_assignee_id").on(table.assigneeId),
  ]
);

// Message threads for requests
export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    requestId: integer("request_id").notNull().references(() => requests.id),
    senderId: varchar("sender_id").notNull().references(() => users.id),
    content: text("content").notNull(),
    sentAt: timestamp("sent_at").defaultNow(),
  },
  (table) => [
    index("IDX_messages_request_id").on(table.requestId),
    index("IDX_messages_sent_at").on(table.sentAt),
  ]
);

// Request status updates for tracking
export const statusUpdates = pgTable(
  "status_updates",
  {
    id: serial("id").primaryKey(),
    requestId: integer("request_id").notNull().references(() => requests.id),
    status: varchar("status").notNull(),
    updatedById: varchar("updated_by_id").notNull().references(() => users.id),
    note: text("note"),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("IDX_status_updates_request_id").on(table.requestId),
    index("IDX_status_updates_updated_at").on(table.updatedAt),
  ]
);

// Request photos table for image attachments
export const requestPhotos = pgTable(
  "request_photos",
  {
    id: serial("id").primaryKey(),
    requestId: integer("request_id").notNull().references(() => requests.id),
    photoUrl: varchar("photo_url", { length: 2000 }).notNull(),
    filename: varchar("filename", { length: 500 }).notNull(),
    originalFilename: varchar("original_filename", { length: 500 }),
    filePath: varchar("file_path", { length: 2000 }),
    mimeType: varchar("mime_type", { length: 100 }),
    size: integer("size"),
    caption: text("caption"),
    uploadedById: varchar("uploaded_by_id").notNull().references(() => users.id),
    uploadedAt: timestamp("uploaded_at").defaultNow(),
  },
  (table) => [
    index("IDX_request_photos_request_id").on(table.requestId),
  ]
);

// Contact messages table for storing contact form submissions
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  organization: varchar("organization").notNull(),
  organizationType: varchar("organization_type"),
  inquiry: varchar("inquiry"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});



// Schemas for zod validation
export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
});

export const insertRequestSchema = createInsertSchema(requests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRequestItemsSchema = createInsertSchema(requestItems).omit({
  id: true,
});

export const insertBuildingRequestSchema = createInsertSchema(buildingRequests).omit({
  id: true,
});

export const insertTechRequestSchema = createInsertSchema(techRequests).omit({
  id: true,
});

export const insertOrganizationFeaturesSchema = createInsertSchema(organizationFeatures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
  assignedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  sentAt: true,
});

export const insertStatusUpdateSchema = createInsertSchema(statusUpdates).omit({
  id: true,
  updatedAt: true,
});

// Update the photo schema to include both old and new fields for compatibility
export const insertRequestPhotoSchema = z.object({
  requestId: z.number(),
  filename: z.string(),
  originalFilename: z.string().optional(),
  filePath: z.string().optional(),
  mimeType: z.string().optional(),
  size: z.number().optional(),
  caption: z.string().optional(),
  uploadedById: z.string(),
  photoUrl: z.string().optional(),
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  createdAt: true,
});


// Add organization and building schema types
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBuildingSchema = createInsertSchema(buildings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFacilitySchema = createInsertSchema(facilities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

export type InsertBuilding = z.infer<typeof insertBuildingSchema>;
export type Building = typeof buildings.$inferSelect;

export type InsertFacility = z.infer<typeof insertFacilitySchema>;
export type Facility = typeof facilities.$inferSelect;

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Request = typeof requests.$inferSelect;

export type InsertRequestItems = z.infer<typeof insertRequestItemsSchema>;
export type RequestItems = typeof requestItems.$inferSelect;

export type InsertBuildingRequest = z.infer<typeof insertBuildingRequestSchema>;
export type BuildingRequest = typeof buildingRequests.$inferSelect;

export type InsertTechRequest = z.infer<typeof insertTechRequestSchema>;
export type TechRequest = typeof techRequests.$inferSelect;

export type InsertOrganizationFeatures = z.infer<typeof insertOrganizationFeaturesSchema>;
export type OrganizationFeatures = typeof organizationFeatures.$inferSelect;

export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignments.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertStatusUpdate = z.infer<typeof insertStatusUpdateSchema>;
export type StatusUpdate = typeof statusUpdates.$inferSelect;

export type InsertRequestPhoto = z.infer<typeof insertRequestPhotoSchema>;
export type RequestPhoto = typeof requestPhotos.$inferSelect;

export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;

// Audit log schemas and types
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Webhook schemas and types
export const insertWebhookSchema = createInsertSchema(webhooks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastTriggeredAt: true,
  failureCount: true,
});
export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
export type Webhook = typeof webhooks.$inferSelect;

export const insertWebhookDeliverySchema = createInsertSchema(webhookDeliveries).omit({
  id: true,
  createdAt: true,
});
export type InsertWebhookDelivery = z.infer<typeof insertWebhookDeliverySchema>;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;

// API key schemas and types
export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true,
  revokedAt: true,
});
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

// Request template schemas and types
export const insertRequestTemplateSchema = createInsertSchema(requestTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
});
export type InsertRequestTemplate = z.infer<typeof insertRequestTemplateSchema>;
export type RequestTemplate = typeof requestTemplates.$inferSelect;

// Rate limit schemas and types
export const insertRateLimitRecordSchema = createInsertSchema(rateLimitRecords).omit({
  id: true,
});
export type InsertRateLimitRecord = z.infer<typeof insertRateLimitRecordSchema>;
export type RateLimitRecord = typeof rateLimitRecords.$inferSelect;



