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
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  slug: varchar("slug").unique().notNull(), // URL-friendly identifier
  domain: varchar("domain"), // Optional: auto-assign users by email domain
  logoUrl: varchar("logo_url"),
  settings: jsonb("settings"), // Custom settings per organization
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User storage table.
export const users = pgTable("users", {
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
});

// Buildings table for organization-specific building data
export const buildings = pgTable("buildings", {
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
});

// Facilities table for organization-specific facility data
export const facilities = pgTable("facilities", {
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
});

// Maintenance requests table 
export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  requestType: varchar("request_type").notNull().default("facilities"), // facilities or building
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
});

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
export const buildingRequests = pgTable("building_requests", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => requests.id),
  building: varchar("building").notNull(),
  roomNumber: varchar("room_number").notNull(),
  description: text("description").notNull(),
});

// Request assignments table
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => requests.id),
  assigneeId: varchar("assignee_id").notNull().references(() => users.id),
  assignerId: varchar("assigner_id").notNull().references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  internalNotes: text("internal_notes"),
});

// Message threads for requests
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => requests.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
});

// Request status updates for tracking
export const statusUpdates = pgTable("status_updates", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => requests.id),
  status: varchar("status").notNull(),
  updatedById: varchar("updated_by_id").notNull().references(() => users.id),
  note: text("note"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Request photos table for image attachments
export const requestPhotos = pgTable("request_photos", {
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
});

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



