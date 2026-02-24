import {
  users,
  requests,
  requestItems,
  buildingRequests,
  techRequests,
  organizationFeatures,
  assignments,
  messages,
  statusUpdates,
  requestPhotos,
  organizations,
  buildings,
  facilities,
  passwordResetTokens,
  type User,
  type UpsertUser,
  type InsertRequest,
  type Request,
  type InsertRequestItems,
  type RequestItems,
  type InsertBuildingRequest,
  type BuildingRequest,
  type InsertTechRequest,
  type TechRequest,
  type InsertOrganizationFeatures,
  type OrganizationFeatures,
  type InsertMessage,
  type Message,
  type InsertAssignment,
  type Assignment,
  type InsertStatusUpdate,
  type StatusUpdate,
  type InsertRequestPhoto,
  type RequestPhoto,
  type Organization,
  type InsertOrganization,
  type Building,
  type InsertBuilding,
  type Facility,
  type InsertFacility,
} from "@shared/schema";
import crypto from 'crypto';
import { db } from "./db";
import { eq, and, desc, count, sql, or, isNull, asc } from "drizzle-orm";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { ObjectStorageService, objectStorageClient } from "./replit_integrations/object_storage";

// S3 client setup using env variables (kept for backward compatibility)
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
const S3_BUCKET = process.env.AWS_S3_BUCKET;

// Check if we're running in Replit environment (has sidecar for Object Storage)
function isReplitEnvironment(): boolean {
  return !!process.env.REPL_ID;
}

// Helper to upload to Replit Object Storage (only works in Replit environment)
async function uploadToObjectStorage(key: string, fileBuffer: Buffer, contentType: string): Promise<string> {
  try {
    const objectStorage = new ObjectStorageService();
    const privateDir = objectStorage.getPrivateObjectDir();
    const fullPath = `${privateDir}/uploads/${key}`;
    
    // Parse the path to get bucket and object name
    const pathParts = fullPath.split("/").filter(Boolean);
    const bucketName = pathParts[0];
    const objectName = pathParts.slice(1).join("/");
    
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    
    await file.save(fileBuffer, { contentType });
    
    // Return the path that will be served via /objects route
    return `/objects/uploads/${key}`;
  } catch (error) {
    console.error("Failed to upload to Object Storage:", error);
    throw error;
  }
}

// Helper to save file locally (works on Railway and other platforms)
function saveFileLocally(key: string, fileBuffer: Buffer): string {
  const uploadsDir = path.join(process.cwd(), 'uploads', 'photos');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const safeKey = key.replace(/\//g, '-');
  const localPath = path.join(uploadsDir, safeKey);
  fs.writeFileSync(localPath, fileBuffer);
  return `/uploads/photos/${safeKey}`;
}

// Helper to upload files - chooses storage based on environment
async function uploadFileToS3(key: string, fileBuffer: Buffer, contentType: string) {
  // Only use Replit Object Storage if we're actually in Replit
  if (isReplitEnvironment() && process.env.PRIVATE_OBJECT_DIR) {
    return uploadToObjectStorage(key, fileBuffer, contentType);
  }

  // Fall back to AWS S3 if configured
  if (S3_BUCKET && process.env.AWS_ACCESS_KEY_ID) {
    const params = {
      Bucket: S3_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    };
    await s3.send(new PutObjectCommand(params));
    return `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }
  
  // Use local filesystem (works on Railway)
  return saveFileLocally(key, fileBuffer);
}

// Interface for storage operations
export interface IStorage {
  // Organization operations
  createOrganization(orgData: InsertOrganization): Promise<Organization>;
  getOrganization(id: number): Promise<Organization | undefined>;
  getOrganizationBySlug(slug: string): Promise<Organization | undefined>;
  getOrganizationByDomain(domain: string): Promise<Organization | undefined>;
  updateOrganization(id: number, updates: Partial<InsertOrganization>): Promise<Organization>;
  getAllOrganizations(): Promise<any[]>;
  deleteOrganization(id: number): Promise<void>;
  softDeleteOrganization(id: number): Promise<void>;

  // Building operations
  createBuilding(buildingData: InsertBuilding): Promise<Building>;
  getBuildingsByOrganization(organizationId: number): Promise<Building[]>;
  updateBuilding(id: number, updates: Partial<InsertBuilding>): Promise<Building>;
  deleteBuilding(id: number): Promise<void>;
  softDeleteBuilding(id: number): Promise<void>;

  // Facility operations
  createFacility(facilityData: InsertFacility): Promise<Facility>;
  getFacilitiesByOrganization(organizationId: number): Promise<Facility[]>;
  updateFacility(id: number, updates: Partial<InsertFacility>): Promise<Facility>;
  deleteFacility(id: number): Promise<void>;
  softDeleteFacility(id: number): Promise<void>;

  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getMaintenanceStaff(organizationId: number): Promise<User[]>;
  getTechStaff(organizationId: number): Promise<User[]>;
  getAllUsers(): Promise<any[]>;
  updateUserRole(userId: string, role: string): Promise<User>;
  updateUserOrganization(userId: string, organizationId: number): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  softDeleteUser(userId: string): Promise<void>;
  
  // Request operations
  createRequest(requestData: InsertRequest, requestItemsData?: InsertRequestItems): Promise<Request>;
  createBuildingRequest(buildingRequestData: InsertBuildingRequest): Promise<BuildingRequest>;
  createTechRequest(techRequestData: InsertTechRequest): Promise<TechRequest>;
  getTechRequestByRequestId(requestId: number): Promise<TechRequest | undefined>;
  getRequestById(id: number): Promise<Request | undefined>;
  getRequestDetails(id: number): Promise<any>;

  // Organization features
  getOrganizationFeatures(organizationId: number): Promise<OrganizationFeatures | undefined>;
  upsertOrganizationFeatures(organizationId: number, features: Partial<InsertOrganizationFeatures>): Promise<OrganizationFeatures>;
  isTechRequestsEnabled(organizationId: number): Promise<boolean>;
  
  // Photo uploads
  saveRequestPhoto(photoData: InsertRequestPhoto & { fileBuffer?: Buffer }): Promise<RequestPhoto>;
  getRequestPhotos(requestId: number): Promise<RequestPhoto[]>;
  
  // Dashboard stats
  getUserDashboardStats(userId: string): Promise<any>;
  getAdminDashboardStats(organizationId?: number): Promise<any>;
  
  // Request listings
  getRecentRequests(limit: number, organizationId?: number): Promise<any[]>;
  getUserRequests(userId: string, limit: number): Promise<any[]>;
  getUserRequestsByStatus(userId: string, status?: string): Promise<any[]>;
  getAllRequestsByStatus(status?: string, organizationId?: number): Promise<any[]>;
  getAssignedRequests(userId: string): Promise<any[]>;
  
  // Room history
  getAllBuildings(organizationId?: number): Promise<string[]>;
  getRequestsByBuilding(building: string, roomNumber?: string, organizationId?: number): Promise<any[]>;
  
  // Request timeline and messaging
  getRequestTimeline(requestId: number): Promise<any[]>;
  getRequestMessages(requestId: number): Promise<any[]>;
  createMessage(messageData: InsertMessage): Promise<Message>;
  
  // Request assignment and status updates
  assignRequest(assignmentData: InsertAssignment): Promise<Assignment>;
  updateRequestStatus(statusUpdateData: InsertStatusUpdate): Promise<StatusUpdate>;
  updateRequestPriority(requestId: number, priority: string): Promise<void>;
  createStatusUpdate(statusUpdateData: InsertStatusUpdate): Promise<StatusUpdate>;
  
  // Access control
  canAccessRequest(userId: string, requestId: number): Promise<boolean>;
  isRequestor(userId: string, requestId: number): Promise<boolean>;
  softDeleteRequest(requestId: number): Promise<void>;

  // Reports
  getReportsData(reportType: string, organizationId?: number): Promise<any>;

  // Email notifications
  getOrganizationAdminEmails(organizationId: number): Promise<string[]>;

  // Password reset
  createPasswordResetToken(userId: string): Promise<{ token: string; expiresAt: Date }>;
  validatePasswordResetToken(token: string): Promise<{ valid: boolean; userId?: string }>;
  usePasswordResetToken(token: string): Promise<boolean>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Organization operations
  async createOrganization(orgData: InsertOrganization): Promise<Organization> {
    const [org] = await db.insert(organizations).values(orgData).returning();
    return org;
  }

  async getOrganization(id: number): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(
      and(eq(organizations.id, id), isNull(organizations.deletedAt))
    );
    return org;
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(
      and(eq(organizations.slug, slug), isNull(organizations.deletedAt))
    );
    return org;
  }

  async getOrganizationByDomain(domain: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(
      and(eq(organizations.domain, domain), isNull(organizations.deletedAt))
    );
    return org;
  }

  async updateOrganization(id: number, updates: Partial<InsertOrganization>): Promise<Organization> {
    const [org] = await db
      .update(organizations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return org;
  }

  async getAllOrganizations(): Promise<any[]> {
    try {
      const orgList = await db
        .select({
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
          domain: organizations.domain,
          logoUrl: organizations.logoUrl,
          settings: organizations.settings,
          createdAt: organizations.createdAt,
          updatedAt: organizations.updatedAt,
          userCount: sql<number>`(SELECT COUNT(*) FROM users WHERE users.organization_id = organizations.id AND users.deleted_at IS NULL)`,
          buildingCount: sql<number>`(SELECT COUNT(*) FROM buildings WHERE buildings.organization_id = organizations.id AND buildings.deleted_at IS NULL)`,
        })
        .from(organizations)
        .where(isNull(organizations.deletedAt))
        .orderBy(organizations.name);
      return orgList;
    } catch (error) {
      console.error("Storage: Error in getAllOrganizations:", error);
      throw error;
    }
  }

  async deleteOrganization(id: number): Promise<void> {
    // Hard delete - use softDeleteOrganization for soft deletes
    await db.delete(organizations).where(eq(organizations.id, id));
  }

  async softDeleteOrganization(id: number): Promise<void> {
    await db.update(organizations)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(organizations.id, id));
  }

  // Building operations
  async createBuilding(buildingData: InsertBuilding): Promise<Building> {
    const [building] = await db.insert(buildings).values(buildingData).returning();
    return building;
  }

  async getBuildingsByOrganization(organizationId: number): Promise<Building[]> {
    return db.select().from(buildings).where(
      and(eq(buildings.organizationId, organizationId), isNull(buildings.deletedAt))
    );
  }

  async updateBuilding(id: number, updates: Partial<InsertBuilding>): Promise<Building> {
    const [building] = await db
      .update(buildings)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(buildings.id, id), isNull(buildings.deletedAt)))
      .returning();
    return building;
  }

  async deleteBuilding(id: number): Promise<void> {
    // Hard delete - use softDeleteBuilding for soft deletes
    await db.delete(buildings).where(eq(buildings.id, id));
  }

  async softDeleteBuilding(id: number): Promise<void> {
    await db.update(buildings)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(buildings.id, id));
  }
  
  // Facility operations
  async createFacility(facilityData: InsertFacility): Promise<Facility> {
    const [facility] = await db.insert(facilities).values(facilityData).returning();
    return facility;
  }

  async getFacilitiesByOrganization(organizationId: number): Promise<Facility[]> {
    return db.select().from(facilities).where(
      and(eq(facilities.organizationId, organizationId), isNull(facilities.deletedAt))
    );
  }

  async updateFacility(id: number, updates: Partial<InsertFacility>): Promise<Facility> {
    const [facility] = await db
      .update(facilities)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(facilities.id, id), isNull(facilities.deletedAt)))
      .returning();
    return facility;
  }

  async deleteFacility(id: number): Promise<void> {
    // Hard delete - use softDeleteFacility for soft deletes
    await db.delete(facilities).where(eq(facilities.id, id));
  }

  async softDeleteFacility(id: number): Promise<void> {
    await db.update(facilities)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(facilities.id, id));
  }
  
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(eq(users.id, id), isNull(users.deletedAt))
    );
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(eq(users.email, email), isNull(users.deletedAt))
    );
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          role: userData.role,
          organizationId: userData.organizationId,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
  
  async getMaintenanceStaff(organizationId: number): Promise<User[]> {
    return db.select().from(users).where(and(
      or(
        eq(users.role, 'maintenance'),
        eq(users.role, 'admin')
      ),
      eq(users.organizationId, organizationId),
      isNull(users.deletedAt)
    ));
  }

  async getTechStaff(organizationId: number): Promise<User[]> {
    return db.select().from(users).where(and(
      or(eq(users.role, 'tech'), eq(users.role, 'admin')),
      eq(users.organizationId, organizationId),
      isNull(users.deletedAt)
    ));
  }

  async getAllUsers(): Promise<any[]> {
    return db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        organizationId: users.organizationId,
        organizationName: organizations.name,
        profileImageUrl: users.profileImageUrl,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .leftJoin(organizations, eq(users.organizationId, organizations.id))
      .where(isNull(users.deletedAt))
      .orderBy(users.email);
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .returning();
    return user;
  }

  async updateUserOrganization(userId: string, organizationId: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ organizationId, updatedAt: new Date() })
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .returning();
    return user;
  }

  async deleteUser(userId: string): Promise<void> {
    // Hard delete - use softDeleteUser for soft deletes
    await db.delete(users).where(eq(users.id, userId));
  }

  async softDeleteUser(userId: string): Promise<void> {
    await db.update(users)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userId));
  }
  
  // Request operations
  async createRequest(
    requestData: InsertRequest, 
    requestItemsData?: InsertRequestItems
  ): Promise<Request> {
    // Create the request
    const [request] = await db
      .insert(requests)
      .values(requestData)
      .returning();
    
    // If this is a facilities request and items are provided
    if (requestData.requestType === 'facilities' && requestItemsData) {
      // Create the facilities request items
      await db
        .insert(requestItems)
        .values({
          ...requestItemsData,
          requestId: request.id
        });
    }
    
    return request;
  }
  
  // Create building request separately
  async createBuildingRequest(buildingRequestData: InsertBuildingRequest): Promise<BuildingRequest> {
    const [buildingRequest] = await db
      .insert(buildingRequests)
      .values(buildingRequestData)
      .returning();

    return buildingRequest;
  }

  // Create tech request
  async createTechRequest(techRequestData: InsertTechRequest): Promise<TechRequest> {
    const [techRequest] = await db
      .insert(techRequests)
      .values(techRequestData)
      .returning();

    return techRequest;
  }

  // Get tech request by request ID
  async getTechRequestByRequestId(requestId: number): Promise<TechRequest | undefined> {
    const [techRequest] = await db
      .select()
      .from(techRequests)
      .where(eq(techRequests.requestId, requestId));
    return techRequest;
  }

  // Organization features methods
  async getOrganizationFeatures(organizationId: number): Promise<OrganizationFeatures | undefined> {
    const [features] = await db
      .select()
      .from(organizationFeatures)
      .where(eq(organizationFeatures.organizationId, organizationId));
    return features;
  }

  async upsertOrganizationFeatures(
    organizationId: number,
    features: Partial<InsertOrganizationFeatures>
  ): Promise<OrganizationFeatures> {
    const [result] = await db
      .insert(organizationFeatures)
      .values({
        organizationId,
        ...features,
      })
      .onConflictDoUpdate({
        target: organizationFeatures.organizationId,
        set: {
          ...features,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async isTechRequestsEnabled(organizationId: number): Promise<boolean> {
    const features = await this.getOrganizationFeatures(organizationId);
    return features?.techRequestsEnabled ?? false;
  }

  async getRequestById(id: number): Promise<Request | undefined> {
    const [request] = await db.select().from(requests).where(
      and(eq(requests.id, id), isNull(requests.deletedAt))
    );
    return request;
  }
  
  async getRequestDetails(id: number): Promise<any> {
    // Get request with its items (excluding soft-deleted)
    const [request] = await db.select().from(requests).where(
      and(eq(requests.id, id), isNull(requests.deletedAt))
    );

    if (!request) {
      return null;
    }
    
    let items = null;
    let buildingDetails = null;
    let techDetails = null;

    // Get details based on request type
    if (request.requestType === 'facilities') {
      [items] = await db.select().from(requestItems).where(eq(requestItems.requestId, id));
    } else if (request.requestType === 'building') {
      [buildingDetails] = await db.select().from(buildingRequests).where(eq(buildingRequests.requestId, id));
    } else if (request.requestType === 'tech') {
      [techDetails] = await db.select().from(techRequests).where(eq(techRequests.requestId, id));
    }
    
    // Get requestor info
    const [requestor] = await db.select().from(users).where(eq(users.id, request.requestorId));
    
    // Get assignment if any
    const [assignment] = await db
      .select({
        assignee: users,
        assignment: assignments
      })
      .from(assignments)
      .where(eq(assignments.requestId, id))
      .leftJoin(users, eq(users.id, assignments.assigneeId))
      .orderBy(desc(assignments.assignedAt))
      .limit(1);
    
    return {
      ...request,
      items,
      buildingDetails,
      techDetails,
      requestor: requestor ? {
        id: requestor.id,
        name: `${requestor.firstName || ''} ${requestor.lastName || ''}`.trim(),
        email: requestor.email,
        profileImageUrl: requestor.profileImageUrl
      } : null,
      assignee: assignment && assignment.assignee ? {
        id: assignment.assignee.id,
        name: `${assignment.assignee.firstName || ''} ${assignment.assignee.lastName || ''}`.trim(),
        profileImageUrl: assignment.assignee.profileImageUrl
      } : null
    };
  }
  
  // Dashboard stats
  async getUserDashboardStats(userId: string): Promise<any> {
    const notDeleted = isNull(requests.deletedAt);

    const total = await db
      .select({ count: count() })
      .from(requests)
      .where(and(eq(requests.requestorId, userId), notDeleted));

    const pending = await db
      .select({ count: count() })
      .from(requests)
      .where(and(
        eq(requests.requestorId, userId),
        eq(requests.status, 'pending'),
        notDeleted
      ));

    const inProgress = await db
      .select({ count: count() })
      .from(requests)
      .where(and(
        eq(requests.requestorId, userId),
        eq(requests.status, 'in-progress'),
        notDeleted
      ));

    const completed = await db
      .select({ count: count() })
      .from(requests)
      .where(and(
        eq(requests.requestorId, userId),
        eq(requests.status, 'completed'),
        notDeleted
      ));

    return {
      total: total[0].count,
      pending: pending[0].count,
      inProgress: inProgress[0].count,
      completed: completed[0].count
    };
  }
  
  async getAdminDashboardStats(organizationId?: number): Promise<any> {
    // If organizationId is provided, filter by organization (for regular admins)
    // If not provided, show all data (for super admins)
    // Always exclude soft-deleted requests
    const notDeleted = isNull(requests.deletedAt);
    const baseCondition = organizationId
      ? and(eq(requests.organizationId, organizationId), notDeleted)
      : notDeleted;

    const total = await db.select({ count: count() }).from(requests).where(baseCondition);

    const pending = await db
      .select({ count: count() })
      .from(requests)
      .where(organizationId
        ? and(eq(requests.status, 'pending'), eq(requests.organizationId, organizationId), notDeleted)
        : and(eq(requests.status, 'pending'), notDeleted));

    const inProgress = await db
      .select({ count: count() })
      .from(requests)
      .where(organizationId
        ? and(eq(requests.status, 'in-progress'), eq(requests.organizationId, organizationId), notDeleted)
        : and(eq(requests.status, 'in-progress'), notDeleted));

    const completed = await db
      .select({ count: count() })
      .from(requests)
      .where(organizationId
        ? and(eq(requests.status, 'completed'), eq(requests.organizationId, organizationId), notDeleted)
        : and(eq(requests.status, 'completed'), notDeleted));

    return {
      total: total[0].count,
      pending: pending[0].count,
      inProgress: inProgress[0].count,
      completed: completed[0].count
    };
  }
  
  // Request listings
  async getRecentRequests(limit: number, organizationId?: number): Promise<any[]> {
    // Build where condition: always exclude soft-deleted, optionally filter by org
    const notDeleted = isNull(requests.deletedAt);
    const whereCondition = organizationId
      ? and(eq(requests.organizationId, organizationId), notDeleted)
      : notDeleted;

    const requestList = await db
      .select({
        request: requests,
        requestor: users
      })
      .from(requests)
      .leftJoin(users, eq(users.id, requests.requestorId))
      .where(whereCondition)
      .orderBy(desc(requests.createdAt))
      .limit(limit);

    return requestList.map(item => ({
      ...item.request,
      requestor: item.requestor ? {
        id: item.requestor.id,
        name: `${item.requestor.firstName || ''} ${item.requestor.lastName || ''}`.trim(),
        email: item.requestor.email
      } : null
    }));
  }
  
  async getUserRequests(userId: string, limit: number): Promise<any[]> {
    const requestList = await db
      .select()
      .from(requests)
      .where(and(eq(requests.requestorId, userId), isNull(requests.deletedAt)))
      .orderBy(desc(requests.createdAt))
      .limit(limit);

    return requestList;
  }
  
  async getUserRequestsByStatus(userId: string, status?: string): Promise<any[]> {
    try {
      // Use a single query with LEFT JOINs to avoid N+1 queries
      // Join requests -> assignments -> assignee (users)
      const conditions = [eq(requests.requestorId, userId), isNull(requests.deletedAt)];
      if (status) {
        conditions.push(eq(requests.status, status));
      }

      const results = await db
        .select({
          request: requests,
          assigneeId: assignments.assigneeId,
          assigneeFirstName: sql<string>`assignee.first_name`,
          assigneeLastName: sql<string>`assignee.last_name`,
          assigneeProfileImage: sql<string>`assignee.profile_image_url`,
        })
        .from(requests)
        .leftJoin(assignments, eq(assignments.requestId, requests.id))
        .leftJoin(
          sql`users as assignee`,
          sql`assignee.id = ${assignments.assigneeId}`
        )
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .orderBy(desc(requests.updatedAt));

      // Format the results
      return results.map((item) => {
        const assigneeData = item.assigneeId
          ? {
              id: item.assigneeId,
              name: `${item.assigneeFirstName || ''} ${item.assigneeLastName || ''}`.trim(),
              profileImageUrl: item.assigneeProfileImage
            }
          : null;

        return {
          ...item.request,
          assignee: assigneeData
        };
      });
    } catch (error) {
      console.error("Error fetching user requests by status:", error);
      return [];
    }
  }
  
  async getAllRequestsByStatus(status?: string, organizationId?: number): Promise<any[]> {
    try {
      // Use a single query with LEFT JOINs to avoid N+1 queries
      // Join requests -> requestor (users) -> assignments -> assignee (users)
      // Always exclude soft-deleted requests
      const conditions = [isNull(requests.deletedAt)];
      if (status) {
        conditions.push(eq(requests.status, status));
      }
      if (organizationId) {
        conditions.push(eq(requests.organizationId, organizationId));
      }

      let query = db
        .select({
          request: requests,
          requestorId: users.id,
          requestorFirstName: users.firstName,
          requestorLastName: users.lastName,
          requestorEmail: users.email,
          assigneeId: assignments.assigneeId,
          assigneeFirstName: sql<string>`assignee.first_name`,
          assigneeLastName: sql<string>`assignee.last_name`,
          assigneeProfileImage: sql<string>`assignee.profile_image_url`,
        })
        .from(requests)
        .leftJoin(users, eq(users.id, requests.requestorId))
        .leftJoin(assignments, eq(assignments.requestId, requests.id))
        .leftJoin(
          sql`users as assignee`,
          sql`assignee.id = ${assignments.assigneeId}`
        );

      if (conditions.length > 0) {
        query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions)) as any;
      }

      const results = await query.orderBy(desc(requests.updatedAt));

      // Format the results
      return results.map((item) => {
        const requestorInfo = item.requestorId
          ? {
              id: item.requestorId,
              name: `${item.requestorFirstName || ''} ${item.requestorLastName || ''}`.trim(),
              email: item.requestorEmail
            }
          : null;

        const assigneeInfo = item.assigneeId
          ? {
              id: item.assigneeId,
              name: `${item.assigneeFirstName || ''} ${item.assigneeLastName || ''}`.trim(),
              profileImageUrl: item.assigneeProfileImage
            }
          : null;

        return {
          ...item.request,
          requestor: requestorInfo,
          assignee: assigneeInfo
        };
      });
    } catch (error) {
      console.error("Error fetching all requests by status:", error);
      return [];
    }
  }
  
  async getAssignedRequests(userId: string): Promise<any[]> {
    try {
      // Use a single query with JOINs to avoid N+1 queries
      // Join assignments -> requests -> requestor (users)
      // Exclude soft-deleted requests
      const results = await db
        .select({
          request: requests,
          requestorId: users.id,
          requestorFirstName: users.firstName,
          requestorLastName: users.lastName,
          requestorEmail: users.email,
          assignmentId: assignments.id,
          assignedAt: assignments.assignedAt,
          internalNotes: assignments.internalNotes,
        })
        .from(assignments)
        .innerJoin(requests, and(eq(requests.id, assignments.requestId), isNull(requests.deletedAt)))
        .leftJoin(users, eq(users.id, requests.requestorId))
        .where(eq(assignments.assigneeId, userId))
        .orderBy(desc(requests.updatedAt));

      // Format the results
      return results.map((item) => {
        const requestorInfo = item.requestorId
          ? {
              id: item.requestorId,
              name: `${item.requestorFirstName || ''} ${item.requestorLastName || ''}`.trim(),
              email: item.requestorEmail
            }
          : null;

        return {
          ...item.request,
          requestor: requestorInfo,
          assignment: {
            id: item.assignmentId,
            assignedAt: item.assignedAt,
            internalNotes: item.internalNotes,
          }
        };
      });
    } catch (error) {
      console.error("Error fetching assigned requests:", error);
      return [];
    }
  }
  
  // Request timeline and messaging
  async getRequestTimeline(requestId: number): Promise<any[]> {
    // Get request creation
    const [request] = await db.select().from(requests).where(eq(requests.id, requestId));
    
    if (!request) {
      return [];
    }
    
    // Get all status updates
    const statusItems = await db
      .select({
        update: statusUpdates,
        user: users
      })
      .from(statusUpdates)
      .leftJoin(users, eq(users.id, statusUpdates.updatedById))
      .where(eq(statusUpdates.requestId, requestId))
      .orderBy(asc(statusUpdates.updatedAt));
    
    // Get assignment if any
    const assignmentItems = await db
      .select({
        assignment: assignments,
        assignerId: assignments.assignerId,
        assigneeId: assignments.assigneeId
      })
      .from(assignments)
      .where(eq(assignments.requestId, requestId))
      .orderBy(asc(assignments.assignedAt));
    
    // Helper function to ensure valid date
    const safeDate = (date: Date | null | undefined): string => {
      if (!date || isNaN(new Date(date).getTime())) {
        return new Date().toISOString();
      }
      return new Date(date).toISOString();
    };
    
    // Combine and sort by date
    const timeline = [
      // Creation event
      {
        type: 'creation',
        date: safeDate(request.createdAt),
        status: 'created',
        user: {
          id: request.requestorId
        }
      },
      // Status update events
      ...statusItems.map(item => ({
        type: 'status',
        date: safeDate(item.update.updatedAt),
        status: item.update.status,
        note: item.update.note,
        user: item.user ? {
          id: item.user.id,
          name: `${item.user.firstName || ''} ${item.user.lastName || ''}`.trim(),
          profileImageUrl: item.user.profileImageUrl
        } : { id: request.requestorId }
      })),
      // Assignment events
      ...assignmentItems.map(item => ({
        type: 'assignment',
        date: safeDate(item.assignment.assignedAt),
        assignerId: item.assignerId,
        assigneeId: item.assigneeId,
        note: item.assignment.internalNotes
      }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return timeline;
  }
  
  async getRequestMessages(requestId: number): Promise<any[]> {
    const messageList = await db
      .select({
        message: messages,
        sender: users
      })
      .from(messages)
      .leftJoin(users, eq(users.id, messages.senderId))
      .where(eq(messages.requestId, requestId))
      .orderBy(asc(messages.sentAt));
    
    return messageList.map(item => ({
      ...item.message,
      sender: item.sender ? {
        id: item.sender.id,
        name: `${item.sender.firstName || ''} ${item.sender.lastName || ''}`.trim(),
        profileImageUrl: item.sender.profileImageUrl,
        role: item.sender.role
      } : {
        id: 'unknown',
        name: 'Unknown User',
        role: 'user'
      }
    }));
  }
  
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(messageData)
      .returning();
    
    return message;
  }
  
  // Request assignment and status updates
  async assignRequest(assignmentData: InsertAssignment): Promise<Assignment> {
    const [assignment] = await db
      .insert(assignments)
      .values(assignmentData)
      .returning();
    
    return assignment;
  }
  
  async updateRequestStatus(statusUpdateData: InsertStatusUpdate): Promise<StatusUpdate> {
    // Valid status values
    const VALID_STATUSES = ['pending', 'approved', 'in-progress', 'completed', 'cancelled'];

    // Valid status transitions state machine
    const VALID_TRANSITIONS: Record<string, string[]> = {
      'pending': ['approved', 'in-progress', 'cancelled'],
      'approved': ['in-progress', 'completed', 'cancelled'],
      'in-progress': ['completed', 'cancelled'],
      'completed': ['pending'],  // Allow reopen
      'cancelled': ['pending'],  // Allow reopen
    };

    // Validate the new status is a valid value
    if (!VALID_STATUSES.includes(statusUpdateData.status)) {
      throw new Error(`Invalid status value: ${statusUpdateData.status}. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    // Get current request status
    const [currentRequest] = await db.select().from(requests).where(eq(requests.id, statusUpdateData.requestId));

    if (!currentRequest) {
      throw new Error(`Request not found: ${statusUpdateData.requestId}`);
    }

    // Validate the status transition is allowed
    const allowedTransitions = VALID_TRANSITIONS[currentRequest.status] || [];
    if (!allowedTransitions.includes(statusUpdateData.status) && currentRequest.status !== statusUpdateData.status) {
      throw new Error(`Invalid status transition: ${currentRequest.status} → ${statusUpdateData.status}. Allowed transitions from ${currentRequest.status}: ${allowedTransitions.join(', ')}`);
    }

    // Create status update record
    const [statusUpdate] = await db
      .insert(statusUpdates)
      .values(statusUpdateData)
      .returning();

    // Update request status
    await db
      .update(requests)
      .set({
        status: statusUpdateData.status,
        updatedAt: new Date()
      })
      .where(eq(requests.id, statusUpdateData.requestId));

    return statusUpdate;
  }

  async updateRequestPriority(requestId: number, priority: string): Promise<void> {
    await db
      .update(requests)
      .set({ 
        priority: priority,
        updatedAt: new Date()
      })
      .where(eq(requests.id, requestId));
  }
  
  async createStatusUpdate(statusUpdateData: InsertStatusUpdate): Promise<StatusUpdate> {
    // Create status update record
    const [statusUpdate] = await db
      .insert(statusUpdates)
      .values(statusUpdateData)
      .returning();
    
    // Update request status
    await db
      .update(requests)
      .set({ 
        status: statusUpdateData.status,
        updatedAt: new Date()
      })
      .where(eq(requests.id, statusUpdateData.requestId));
    
    return statusUpdate;
  }
  
  // Access control
  async canAccessRequest(userId: string, requestId: number): Promise<boolean> {
    // Get user
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return false;
    }

    // Get the request to check organization
    const [request] = await db.select().from(requests).where(eq(requests.id, requestId));

    if (!request) {
      return false;
    }

    // Super admin can access all requests
    if (user.role === 'super_admin') {
      return true;
    }

    // Admin/maintenance/tech can access requests within their organization only
    if (user.role === 'admin' || user.role === 'maintenance' || user.role === 'tech') {
      return request.organizationId === user.organizationId;
    }

    // Regular users: Check if user is the requestor (and in same org)
    if (request.requestorId === userId && request.organizationId === user.organizationId) {
      return true;
    }

    // Check if user is assigned to this request (and in same org)
    const [assignment] = await db
      .select()
      .from(assignments)
      .where(and(
        eq(assignments.requestId, requestId),
        eq(assignments.assigneeId, userId)
      ));

    return !!assignment && request.organizationId === user.organizationId;
  }
  
  async isRequestor(userId: string, requestId: number): Promise<boolean> {
    const [request] = await db
      .select()
      .from(requests)
      .where(and(
        eq(requests.id, requestId),
        eq(requests.requestorId, userId)
      ));

    return !!request;
  }

  async softDeleteRequest(requestId: number): Promise<void> {
    await db.update(requests)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(requests.id, requestId));
  }

  // Photo uploads
  async saveRequestPhoto(photoData: InsertRequestPhoto & { fileBuffer?: Buffer }): Promise<RequestPhoto> {
    try {
      let photoUrl = photoData.photoUrl || `uploads/photos/${photoData.filename}`;
      let filePath = photoData.filePath;
      // If fileBuffer is provided, upload to S3
      if (photoData.fileBuffer) {
        const s3Key = `requests/${photoData.requestId}/${photoData.filename}`;
        photoUrl = await uploadFileToS3(s3Key, photoData.fileBuffer, photoData.mimeType || 'application/octet-stream');
        filePath = photoUrl; // Store S3 URL as filePath
      }
      // Map the data to match the database schema
      const photoToSave = {
        requestId: photoData.requestId,
        photoUrl,
        filename: photoData.filename,
        originalFilename: photoData.originalFilename,
        filePath,
        mimeType: photoData.mimeType,
        size: photoData.size,
        caption: photoData.caption,
        uploadedById: photoData.uploadedById
      };
      const [photo] = await db
        .insert(requestPhotos)
        .values(photoToSave)
        .returning();
      return photo;
    } catch (error) {
      console.error("Error saving request photo:", error);
      throw error;
    }
  }
  
  async getRequestPhotos(requestId: number): Promise<RequestPhoto[]> {
    try {
      const photos = await db
        .select()
        .from(requestPhotos)
        .where(eq(requestPhotos.requestId, requestId))
        .orderBy(desc(requestPhotos.uploadedAt));
      
      return photos;
    } catch (error) {
      console.error("Error fetching request photos:", error);
      throw error;
    }
  }
  
  // Room history
  async getAllBuildings(organizationId?: number): Promise<string[]> {
    try {
      let result;
      if (organizationId) {
        // Filter by organization
        result = await db.execute(sql`
          SELECT DISTINCT b.building
          FROM building_requests b
          JOIN requests r ON b.request_id = r.id
          WHERE b.building IS NOT NULL AND b.building != '' AND r.organization_id = ${organizationId}
          ORDER BY b.building
        `);
      } else {
        // Super admin - get all buildings
        result = await db.execute(sql`
          SELECT DISTINCT building
          FROM building_requests
          WHERE building IS NOT NULL AND building != ''
          ORDER BY building
        `);
      }

      // Extract the building names from the result
      return result.rows.map((row: any) => row.building);
    } catch (error) {
      console.error("Error fetching all buildings:", error);
      return [];
    }
  }
  
  async getRequestsByBuilding(building: string, roomNumber?: string, organizationId?: number): Promise<any[]> {
    try {
      let query;

      if (roomNumber && organizationId) {
        // Filter by building, room number, and organization
        query = sql`
          SELECT r.*, b.building, b.room_number, b.description as building_description,
                 u.id as requestor_id, u.first_name as requestor_first_name,
                 u.last_name as requestor_last_name, u.profile_image_url as requestor_image
          FROM requests r
          JOIN building_requests b ON r.id = b.request_id
          LEFT JOIN users u ON r.requestor_id = u.id
          WHERE b.building = ${building} AND b.room_number = ${roomNumber} AND r.organization_id = ${organizationId}
          ORDER BY r.created_at DESC
        `;
      } else if (roomNumber) {
        // Filter by building and room number only (super admin)
        query = sql`
          SELECT r.*, b.building, b.room_number, b.description as building_description,
                 u.id as requestor_id, u.first_name as requestor_first_name,
                 u.last_name as requestor_last_name, u.profile_image_url as requestor_image
          FROM requests r
          JOIN building_requests b ON r.id = b.request_id
          LEFT JOIN users u ON r.requestor_id = u.id
          WHERE b.building = ${building} AND b.room_number = ${roomNumber}
          ORDER BY r.created_at DESC
        `;
      } else if (organizationId) {
        // Filter by building and organization
        query = sql`
          SELECT r.*, b.building, b.room_number, b.description as building_description,
                 u.id as requestor_id, u.first_name as requestor_first_name,
                 u.last_name as requestor_last_name, u.profile_image_url as requestor_image
          FROM requests r
          JOIN building_requests b ON r.id = b.request_id
          LEFT JOIN users u ON r.requestor_id = u.id
          WHERE b.building = ${building} AND r.organization_id = ${organizationId}
          ORDER BY r.created_at DESC
        `;
      } else {
        // Filter by building only (super admin)
        query = sql`
          SELECT r.*, b.building, b.room_number, b.description as building_description,
                 u.id as requestor_id, u.first_name as requestor_first_name,
                 u.last_name as requestor_last_name, u.profile_image_url as requestor_image
          FROM requests r
          JOIN building_requests b ON r.id = b.request_id
          LEFT JOIN users u ON r.requestor_id = u.id
          WHERE b.building = ${building}
          ORDER BY r.created_at DESC
        `;
      }

      const result = await db.execute(query);

      // Format the results
      return result.rows.map((row: any) => {
        return {
          id: row.id,
          event: row.event,
          status: row.status,
          priority: row.priority,
          requestType: row.request_type,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          eventDate: row.event_date,
          organizationId: row.organization_id,
          buildingDetails: {
            building: row.building,
            roomNumber: row.room_number,
            description: row.building_description
          },
          requestor: {
            id: row.requestor_id,
            name: `${row.requestor_first_name || ''} ${row.requestor_last_name || ''}`.trim(),
            profileImageUrl: row.requestor_image
          }
        };
      });
    } catch (error) {
      console.error("Error fetching requests by building:", error);
      return [];
    }
  }
  
  // Reports
  async getReportsData(reportType: string, organizationId?: number): Promise<any> {
    // Build organization filter condition
    const orgFilter = organizationId ? eq(requests.organizationId, organizationId) : undefined;

    if (reportType === 'monthly') {
      // Get counts by month for the past 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const dateFilter = sql`requests.created_at >= ${sixMonthsAgo.toISOString()}`;
      const whereClause = orgFilter ? and(dateFilter, orgFilter) : dateFilter;

      const results = await db
        .select({
          month: sql`to_char(requests.created_at, 'YYYY-MM')`,
          count: count(),
          status: requests.status
        })
        .from(requests)
        .where(whereClause)
        .groupBy(sql`to_char(requests.created_at, 'YYYY-MM')`, requests.status)
        .orderBy(sql`to_char(requests.created_at, 'YYYY-MM')`);

      return {
        type: 'monthly',
        data: results
      };
    } else if (reportType === 'facility') {
      // Get counts by facility
      let query = db
        .select({
          facility: requests.facility,
          count: count()
        })
        .from(requests);

      if (orgFilter) {
        query = query.where(orgFilter) as any;
      }

      const results = await query
        .groupBy(requests.facility)
        .orderBy(desc(count()));

      return {
        type: 'facility',
        data: results
      };
    } else if (reportType === 'status') {
      // Get current counts by status
      let query = db
        .select({
          status: requests.status,
          count: count()
        })
        .from(requests);

      if (orgFilter) {
        query = query.where(orgFilter) as any;
      }

      const results = await query.groupBy(requests.status);

      return {
        type: 'status',
        data: results
      };
    } else {
      // Default to completion time report
      const completedFilter = eq(requests.status, 'completed');
      const whereClause = orgFilter ? and(completedFilter, orgFilter) : completedFilter;

      const results = await db
        .select({
          request: requests,
          created: statusUpdates.updatedAt,
          completed: sql`completed_status.updated_at`
        })
        .from(requests)
        .leftJoin(
          statusUpdates,
          and(
            eq(statusUpdates.requestId, requests.id),
            eq(statusUpdates.status, 'pending')
          )
        )
        .leftJoin(
          statusUpdates.as('completed_status'),
          and(
            eq(sql`completed_status.request_id`, requests.id),
            eq(sql`completed_status.status`, 'completed')
          )
        )
        .where(whereClause);

      return {
        type: 'completion',
        data: results.map(item => ({
          id: item.request.id,
          facility: item.request.facility,
          event: item.request.event,
          created: item.created,
          completed: item.completed,
          timeToComplete: item.completed && item.created
            ? Math.round((new Date(item.completed).getTime() - new Date(item.created).getTime()) / (1000 * 60 * 60 * 24))
            : null
        }))
      };
    }
  }

  async getOrganizationAdminEmails(organizationId: number): Promise<string[]> {
    try {
      const adminUsers = await db
        .select({ email: users.email })
        .from(users)
        .where(
          and(
            eq(users.organizationId, organizationId),
            or(
              eq(users.role, 'admin'),
              eq(users.role, 'super_admin')
            )
          )
        );

      return adminUsers.map(user => user.email).filter(email => email !== null);
    } catch (error) {
      console.error("Error getting organization admin emails:", error);
      return [];
    }
  }

  // Password reset functions
  async createPasswordResetToken(userId: string): Promise<{ token: string; expiresAt: Date }> {
    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Delete any existing tokens for this user
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));

    // Insert the new token
    await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
    });

    return { token, expiresAt };
  }

  async validatePasswordResetToken(token: string): Promise<{ valid: boolean; userId?: string }> {
    const [result] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          isNull(passwordResetTokens.usedAt)
        )
      )
      .limit(1);

    if (!result) {
      return { valid: false };
    }

    // Check if token has expired
    if (new Date() > result.expiresAt) {
      return { valid: false };
    }

    return { valid: true, userId: result.userId };
  }

  async usePasswordResetToken(token: string): Promise<boolean> {
    const result = await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(passwordResetTokens.token, token),
          isNull(passwordResetTokens.usedAt)
        )
      )
      .returning();

    return result.length > 0;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
