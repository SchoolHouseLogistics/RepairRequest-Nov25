import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage as dbStorage } from "./storage";
import { isAuthenticated } from "./subAuth.js";
import { sendRequestNotificationEmails, sendLaborRequestNotificationEmails } from "./emailService";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import z from "zod"
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { sendEmail } from "./emailService";
import { sendContactFormEmails, isZeptoMailConfigured } from "./zeptoMailService";
import { ObjectStorageService } from "./replit_integrations/object_storage";

// Extend session interface to include user property
declare module "express-session" {
  interface SessionData {
    user?: {
      id: string;
      email: string;
      role: string;
      firstName: string;
      lastName: string;
      organizationId?: number;
    };
  }
}
import {
  insertRequestSchema,
  insertRequestItemsSchema,
  insertBuildingRequestSchema,
  insertMessageSchema,
  insertAssignmentSchema,
  insertStatusUpdateSchema,
  insertRequestPhotoSchema,
  insertContactMessageSchema,
  users,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { db, contactMessages } from "./db";
import { requests } from "@shared/schema";
import bcrypt from "bcryptjs";

// Fix error with multer types
declare module "express-serve-static-core" {
  interface Request {
    file?: Express.Multer.File;
    files?: {
      [fieldname: string]: Express.Multer.File[];
    };
  }
}

// Authentication middleware using Google OAuth
const authMiddleware = (req: any, res: any, next: any) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // ✅ Set req.user from session
  req.user = req.session.user;
  next();
};

// Type for authenticated user from session
type AuthenticatedUser = {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  organizationId?: number;
};

const bulkSchema = z.array(
  z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    role: z.enum(["requester", "maintenance", "admin", "super_admin"]),
    organizationId: z.number().nullable().optional(),
  })
);

// Building validation schemas
const createBuildingSchema = z.object({
  organizationId: z.number({ required_error: "Organization ID is required" }),
  name: z.string().min(1, "Building name is required").max(255),
  address: z.string().max(500).optional(),
  description: z.string().max(1000).optional(),
  roomNumbers: z.union([
    z.array(z.string()),
    z.string().transform(s => s ? s.split(',').map(r => r.trim()).filter(Boolean) : [])
  ]).optional().default([]),
}).strict();

const updateBuildingSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  address: z.string().max(500).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  roomNumbers: z.union([
    z.array(z.string()),
    z.string().transform(s => s ? s.split(',').map(r => r.trim()).filter(Boolean) : [])
  ]).optional(),
  isActive: z.boolean().optional(),
}).strict();

// Facility validation schemas
const createFacilitySchema = z.object({
  organizationId: z.number({ required_error: "Organization ID is required" }),
  name: z.string().min(1, "Facility name is required").max(255),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  availableItems: z.any().optional(), // JSON field
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().optional(),
}).strict();

const updateFacilitySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  category: z.string().max(100).nullable().optional(),
  availableItems: z.any().optional(), // JSON field
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
}).strict();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

/**
 * Get the default organization ID for new user signups.
 * Uses environment variable DEFAULT_ORGANIZATION_ID if set,
 * otherwise falls back to the first active organization.
 * Returns undefined if no organizations exist (requires manual assignment).
 */
async function getDefaultOrganizationId(): Promise<number | undefined> {
  // Check environment variable first
  const envOrgId = process.env.DEFAULT_ORGANIZATION_ID;
  if (envOrgId) {
    const orgId = parseInt(envOrgId, 10);
    if (!isNaN(orgId)) {
      // Verify the organization exists
      const org = await dbStorage.getOrganization(orgId);
      if (org) {
        return orgId;
      }
      console.warn(`DEFAULT_ORGANIZATION_ID ${orgId} not found in database, falling back to first org`);
    }
  }

  // Fallback: get the first organization
  const orgs = await dbStorage.getAllOrganizations();
  if (orgs && orgs.length > 0) {
    return orgs[0].id;
  }

  // No organizations exist - new users will need manual org assignment
  console.warn("No organizations found in database - new users will have no organization assigned");
  return undefined;
}

export async function registerRoutes(app: Express): Promise<Server> {

  // Forgot password - request password reset
  app.post("/api/forgot-password", async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ status: "error", error: { message: "Email is required" } });
    }

    try {
      const user = await dbStorage.getUserByEmail(email);

      // Always return success to prevent email enumeration attacks
      if (!user) {
        console.log(`Password reset requested for non-existent email: ${email}`);
        return res.json({ status: "success", message: "If an account exists with this email, a reset link has been sent." });
      }

      // Generate password reset token
      const { token, expiresAt } = await dbStorage.createPasswordResetToken(user.id);

      // Build the reset URL
      const host = req.get('host') || process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
      const protocol = req.get('x-forwarded-proto') || 'https';
      const resetUrl = `${protocol}://${host}/reset-password?token=${token}`;

      // Send the email
      const emailSent = await sendEmail({
        to: user.email!,
        from: process.env.FROM_EMAIL || "noreply@schoolhouselogistics.com",
        subject: "Password Reset Request - RepairRequest",
        text: `Hello ${user.firstName || ''},\n\nYou requested a password reset for your RepairRequest account.\n\nClick the link below to reset your password (valid for 1 hour):\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.\n\nBest regards,\nThe RepairRequest Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hello ${user.firstName || ''},</p>
            <p>You requested a password reset for your RepairRequest account.</p>
            <p>Click the button below to reset your password (valid for 1 hour):</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">If you didn't request this password reset, you can safely ignore this email.</p>
          </div>
        `
      });

      if (!emailSent) {
        console.error("Failed to send password reset email to:", user.email);
        return res.status(500).json({ status: "error", error: { message: "Failed to send reset email. Please try again later." } });
      }

      console.log(`Password reset email sent to ${user.email}, expires at ${expiresAt}`);
      return res.json({ status: "success", message: "If an account exists with this email, a reset link has been sent." });
    } catch (err) {
      console.error("Password reset error:", err);
      return res.status(500).json({ status: "error", error: { message: "Internal server error" } });
    }
  });

  // Validate password reset token
  app.get("/api/reset-password/validate", async (req, res) => {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ valid: false, error: "Token is required" });
    }

    try {
      const { valid } = await dbStorage.validatePasswordResetToken(token);
      return res.json({ valid });
    } catch (err) {
      console.error("Token validation error:", err);
      return res.status(500).json({ valid: false, error: "Internal server error" });
    }
  });

  // Reset password with token
  app.post("/api/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ status: "error", error: { message: "Token and new password are required" } });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ status: "error", error: { message: "Password must be at least 8 characters long" } });
    }

    try {
      // Validate the token
      const { valid, userId } = await dbStorage.validatePasswordResetToken(token);

      if (!valid || !userId) {
        return res.status(400).json({ status: "error", error: { message: "Invalid or expired reset token" } });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the user's password
      const updated = await dbStorage.updateUserPassword(userId, hashedPassword);

      if (!updated) {
        return res.status(500).json({ status: "error", error: { message: "Failed to update password" } });
      }

      // Mark the token as used
      await dbStorage.usePasswordResetToken(token);

      console.log(`Password successfully reset for user ${userId}`);
      return res.json({ status: "success", message: "Password has been reset successfully" });
    } catch (err) {
      console.error("Password reset error:", err);
      return res.status(500).json({ status: "error", error: { message: "Internal server error" } });
    }
  });

  app.post("/api/admin/users/bulk", isAuthenticated, async (req: any, res) => {
    try {
      // Extract user ID from session authentication
      const currentUserId = req.user?.id || req.user?.claims?.sub;

      if (!currentUserId) {
        return res.status(401).json({ message: "User ID not found in session" });
      }

      const currentUser = await dbStorage.getUser(currentUserId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found in database" });
      }

      if (currentUser.role !== "super_admin") {
        return res.status(403).json({ message: "Super admin access required" });
      }

      if (!req.body.users) {
        return res.status(400).json({ message: "No users array provided" });
      }

      const result = bulkSchema.safeParse(req.body.users);
      if (!result.success) {
        return res.status(400).json({ message: result.error.flatten().fieldErrors });
      }

      let created = 0;
      let failed = 0;

      for (const u of result.data) {
        try {
          // skip duplicates
          if (await dbStorage.getUserByEmail(u.email)) {
            failed++;
            continue;
          }
          // Generate a random password for the user
          const tempPassword = crypto.randomBytes(8).toString('hex');
          const hashedPassword = await bcrypt.hash(tempPassword, 10);

          await dbStorage.upsertUser({
            id: crypto.randomUUID(),
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            password: hashedPassword,
            role: u.role,
            organizationId: u.role === "super_admin" ? null : u.organizationId ?? null,
            profileImageUrl: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          created++;
        } catch (e) {
          console.error("Failed to create user:", u.email, e);
          failed++;
        }
      }
      res.json({
        created,
        failed,
        message: `Successfully imported ${created} users. ${failed} users were skipped (likely duplicates). Temporary passwords have been generated for new users.`
      });
    } catch (e: any) {
      console.error("Bulk import error:", e);
      res.status(500).json({ message: "Bulk import failed", error: e.message });
    }
  });
  // CRITICAL: Set up Google authentication FIRST with explicit route registration
  // try {
  //   await setupAuth(app);
  //   console.log("Google authentication successfully configured");
  // } catch (error) {
  //   console.error("Failed to set up Google authentication:", error);
  // }

  // PRIORITY OAUTH ROUTES: Register before all other middleware
  const passport = await import('passport')

  // OAuth callback handler that bypasses middleware conflicts
  app.get("/api/auth/callback/google", async (req, res) => {
    try {
      // Check for OAuth errors from Google
      if (req.query.error) {
        return res.redirect("/?error=oauth_error");
      }

      // Check for authorization code
      if (!req.query.code) {
        return res.redirect("/?error=no_code");
      }

      // Get redirect URI using same logic as login route
      const host = req.get('host') || process.env.REPLIT_DOMAINS?.split(',')[0];
      const protocol = req.get('x-forwarded-proto') || 'https';
      const redirectUri = `${protocol}://${host}/api/auth/callback/google`;

      // Exchange authorization code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code: req.query.code as string,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token) {
        return res.redirect("/?error=token_failed");
      }

      // Get user profile from Google
      const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      const profile = await profileResponse.json();

      if (!profile.email) {
        return res.redirect("/?error=no_email");
      }

      // Find or create user
      let user = await dbStorage.getUserByEmail(profile.email);
      if (!user) {
        // Get default organization for new users
        const defaultOrgId = await getDefaultOrganizationId();

        // Create new user using upsertUser
        const userData = {
          id: profile.id,
          email: profile.email,
          firstName: profile.given_name || '',
          lastName: profile.family_name || '',
          role: 'requester' as const,
          organizationId: defaultOrgId,
          profileImageUrl: profile.picture || null,
        };
        user = await dbStorage.upsertUser(userData);
      }

      // Set session
      req.session!.user = {
        id: user.id,
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role || 'requester',
        organizationId: user.organizationId ?? undefined,
      };

      res.redirect("/dashboard");

    } catch (error) {
      return res.redirect("/?error=callback_failed");
    }
  });

  // Helper to get the correct host for OAuth redirect
  const getOAuthRedirectUri = (req: any) => {
    // Use the request host to support both dev and production domains
    const host = req.get('host') || process.env.REPLIT_DOMAINS?.split(',')[0];
    const protocol = req.get('x-forwarded-proto') || 'https';
    return `${protocol}://${host}/api/auth/callback/google`;
  };

  // Login route with priority registration
  app.get("/api/login", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = getOAuthRedirectUri(req);
    const scope = "profile email";
    const state = req.sessionID;

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${state}`;

    res.redirect(googleAuthUrl);
  });

  // Alias route for /api/auth/google (some pages use this URL)
  app.get("/api/auth/google", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = getOAuthRedirectUri(req);
    const scope = "profile email";
    const state = req.sessionID;

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${state}`;

    res.redirect(googleAuthUrl);
  });

  // PRIORITY ROUTES: Register before Vite middleware to avoid conflicts

  // Priority facilities request creation route (FACILITIES ONLY - building requests go to /api/building-requests)
  app.post("/api/requests", authMiddleware, async (req: any, res) => {
    try {
      const user = req.user as AuthenticatedUser;
      const userId = user?.id;

      // Redirect building requests to proper endpoint
      if (req.body.requestType === "building" || req.body["building.description"]) {
        return res.status(400).json({
          message: "Building requests must use /api/building-requests endpoint",
          redirect: "/api/building-requests"
        });
      }

      // Check required fields before validation
      const requiredFields = ['facility', 'event', 'eventDate'];
      const missingFields = requiredFields.filter(field => !req.body[field]);
      if (missingFields.length > 0) {
        return res.status(400).json({
          message: "Missing required fields",
          missingFields
        });
      }

      // Prepare data for validation (FACILITIES REQUESTS ONLY)
      const dataForValidation = {
        organizationId: user.organizationId,
        requestType: "facilities", // FORCE FACILITIES ONLY
        facility: req.body.facility,
        event: req.body.event,
        eventDate: req.body.eventDate,
        priority: req.body.priority || "medium",
        setupTime: req.body.setupTime || null,
        startTime: req.body.startTime || null,
        endTime: req.body.endTime || null,
        requestorId: userId
      };

      // Validate request data
      let requestData;
      try {
        requestData = insertRequestSchema.parse(dataForValidation);
      } catch (validationError) {
        return res.status(400).json({
          message: "Validation error",
          error: validationError.message || validationError
        });
      }

      // Create the basic request
      let createdRequest;
      try {
        createdRequest = await dbStorage.createRequest(requestData);
      } catch (dbError) {
        console.error("Database error creating request:", dbError);
        return res.status(500).json({
          message: "Database error during request creation",
          error: dbError.message || dbError
        });
      }

      // Store selected items and notes as part of the status update
      const itemsNote = req.body.selectedItems?.length > 0 || req.body.otherNeeds
        ? `Selected items: ${(req.body.selectedItems || []).join(', ')}. Additional notes: ${req.body.otherNeeds || 'None'}`
        : "Labor request submitted";

      // Create initial status update
      try {
        await dbStorage.createStatusUpdate({
          requestId: createdRequest.id,
          status: "pending",
          updatedById: userId,
          note: itemsNote
        });
      } catch (statusError) {
        console.error("Error creating status update:", statusError);
      }

      // Send email notifications
      try {
        const organization = user.organizationId !== undefined
          ? await dbStorage.getOrganization(user.organizationId)
          : undefined;
        const adminEmails = user.organizationId !== undefined
          ? await dbStorage.getOrganizationAdminEmails(user.organizationId)
          : [];

        if (organization && adminEmails.length > 0) {
          await sendLaborRequestNotificationEmails({
            requestId: createdRequest.id,
            title: req.body.event,
            facility: req.body.facility,
            dateReported: req.body.eventDate,
            dateNeeded: req.body.dateNeeded || '',
            priority: req.body.priority || 'medium',
            setupTime: req.body.setupTime || '',
            startTime: req.body.startTime || '',
            endTime: req.body.endTime || '',
            selectedItems: req.body.selectedItems || [],
            otherNeeds: req.body.otherNeeds || '',
            requesterName: `${user.firstName} ${user.lastName}`,
            requesterEmail: user.email,
            organizationName: organization.name,
            createdAt: new Date(createdRequest.createdAt)
          }, adminEmails);
        }
      } catch (emailError) {
        console.error("Email notification error:", emailError);
      }

      res.status(201).json(createdRequest);
    } catch (error) {
      console.error("Error creating labor request:", error);
      res.status(500).json({
        message: "Failed to create labor request",
        error: error?.message || "Unknown error"
      });
    }
  });

  // Priority facilities endpoint
  app.get("/api/facilities", authMiddleware, async (req: any, res) => {
    try {
      const user = req.user as AuthenticatedUser;
      const facilities = await dbStorage.getFacilitiesByOrganization(user.organizationId);
      res.json(facilities);
    } catch (error) {
      console.error("Error fetching facilities:", error);
      res.status(500).json({ message: "Failed to fetch facilities" });
    }
  });

  // PRIORITY DASHBOARD ROUTES: Register before Vite middleware
  app.get("/api/dashboard/stats", authMiddleware, async (req: any, res) => {
    try {
      const user = req.user;
      const userId = user.id;

      let stats;
      if (user.role === 'super_admin') {
        stats = await dbStorage.getAdminDashboardStats();
      } else if (user.role === 'admin' || user.role === 'maintenance') {
        stats = await dbStorage.getAdminDashboardStats(user.organizationId);
      } else {
        stats = await dbStorage.getUserDashboardStats(userId);
      }

      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/requests/recent", authMiddleware, async (req: any, res) => {
    try {
      const user = req.user;
      const userId = user.id;

      let requests;
      if (user.role === 'super_admin') {
        requests = await dbStorage.getRecentRequests(10);
      } else if (user.role === 'admin' || user.role === 'maintenance') {
        requests = await dbStorage.getRecentRequests(10, user.organizationId);
      } else {
        requests = await dbStorage.getUserRequests(userId, 10);
      }

      res.json(requests);
    } catch (error) {
      console.error("Error fetching recent requests:", error);
      res.status(500).json({ message: "Failed to fetch recent requests" });
    }
  });

  // Create building (super admin only)
  app.post("/api/admin/buildings", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await dbStorage.getUser(userId);

      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      // Validate input with Zod schema
      const parseResult = createBuildingSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          message: "Invalid building data",
          errors: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }

      const validatedData = parseResult.data;
      const buildingData = {
        organizationId: validatedData.organizationId,
        name: validatedData.name,
        address: validatedData.address,
        description: validatedData.description,
        roomNumbers: validatedData.roomNumbers,
        isActive: true,
      };

      const building = await dbStorage.createBuilding(buildingData);
      const result = {
        ...building,
        roomNumbers: building.roomNumbers ?? [],
      };
      res.json(result);
    } catch (error) {
      console.error("Error creating building:", error);
      res.status(500).json({ message: "Failed to create building" });
    }
  });

  // Update building (super admin only)
  app.patch("/api/admin/buildings/:id", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await dbStorage.getUser(userId);

      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      const buildingId = parseInt(req.params.id);
      if (isNaN(buildingId)) {
        return res.status(400).json({ message: "Invalid building ID" });
      }

      // Validate input with Zod schema
      const parseResult = updateBuildingSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          message: "Invalid update data",
          errors: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }

      const validatedData = parseResult.data;
      const updates: Record<string, any> = {};

      // Only include fields that were provided
      if (validatedData.name !== undefined) updates.name = validatedData.name;
      if (validatedData.address !== undefined) updates.address = validatedData.address;
      if (validatedData.description !== undefined) updates.description = validatedData.description;
      if (validatedData.roomNumbers !== undefined) updates.roomNumbers = validatedData.roomNumbers;
      if (validatedData.isActive !== undefined) updates.isActive = validatedData.isActive;

      const building = await dbStorage.updateBuilding(buildingId, updates);
      const result = {
        ...building,
        roomNumbers: building.roomNumbers ?? [],
      };
      res.json(result);
    } catch (error) {
      console.error("Error updating building:", error);
      res.status(500).json({ message: "Failed to update building" });
    }
  });

  // Delete building (super admin only)
  app.delete("/api/admin/buildings/:id", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await dbStorage.getUser(userId);

      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      const buildingId = parseInt(req.params.id);
      await dbStorage.deleteBuilding(buildingId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting building:", error);
      res.status(500).json({ message: "Failed to delete building" });
    }
  });

  // Create facility (super admin only)
  app.post("/api/admin/facilities", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await dbStorage.getUser(userId);

      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      // Validate input with Zod schema
      const parseResult = createFacilitySchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          message: "Invalid facility data",
          errors: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }

      const facility = await dbStorage.createFacility(parseResult.data);
      res.json(facility);
    } catch (error) {
      console.error("Error creating facility:", error);
      res.status(500).json({ message: "Failed to create facility" });
    }
  });

  // Update facility (super admin only)
  app.patch("/api/admin/facilities/:id", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await dbStorage.getUser(userId);

      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      const facilityId = parseInt(req.params.id);
      if (isNaN(facilityId)) {
        return res.status(400).json({ message: "Invalid facility ID" });
      }

      // Validate input with Zod schema
      const parseResult = updateFacilitySchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          message: "Invalid update data",
          errors: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }

      const validatedData = parseResult.data;
      const updates: Record<string, any> = {};

      // Only include fields that were provided
      if (validatedData.name !== undefined) updates.name = validatedData.name;
      if (validatedData.description !== undefined) updates.description = validatedData.description;
      if (validatedData.category !== undefined) updates.category = validatedData.category;
      if (validatedData.availableItems !== undefined) updates.availableItems = validatedData.availableItems;
      if (validatedData.isActive !== undefined) updates.isActive = validatedData.isActive;
      if (validatedData.sortOrder !== undefined) updates.sortOrder = validatedData.sortOrder;

      const facility = await dbStorage.updateFacility(facilityId, updates);
      res.json(facility);
    } catch (error) {
      console.error("Error updating facility:", error);
      res.status(500).json({ message: "Failed to update facility" });
    }
  });

  // Delete facility (super admin only)
  app.delete("/api/admin/facilities/:id", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await dbStorage.getUser(userId);

      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      const facilityId = parseInt(req.params.id);
      await dbStorage.deleteFacility(facilityId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting facility:", error);
      res.status(500).json({ message: "Failed to delete facility" });
    }
  });

  // Set up multer storage configuration
  const uploadDir = path.resolve(process.cwd(), 'uploads/photos');

  // Ensure directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  console.log(`Upload directory resolved to: ${uploadDir}`);

  // Import path module for file path manipulation
  const express = await import('express');

  // Note: Uploads directory is already served statically in server/index.ts

  const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      } catch (error: any) {
        console.error("Upload directory creation failed:", error);
        cb(error, uploadDir);
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const filename = `photo-${uniqueSuffix}${ext}`;
      cb(null, filename);
    }
  });

  // File filter to accept only images
  const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(null, false);
  };

  // Configure multer upload with error handling
  const upload = multer({
    storage: multerStorage,
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB size limit
    }
  });

  // Allow all emails - Google OAuth will manage user access
  function isAllowedEmail(email: string): boolean {
    return true;
  }

  // The development login endpoint has been removed
  // Users will now be authenticated exclusively through Google login via Replit Auth





  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    // Prevent caching of auth state
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      return res.json(req.session.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });



  // Helper function to get user info from Google auth
  const getUserInfo = async (req: any) => {
    if (!req.session.user || !req.user) {
      return { userId: undefined, user: undefined };
    }

    return { userId: req.user.id, user: req.user };
  };

  // Custom middleware for authentication
  const checkAuth = (req: any, res: any, next: any) => {
    // Check if user is authenticated
    if (req.session.user && req.user) {
      return next();
    }

    // No auth found
    return res.status(401).json({ message: "Unauthorized" });
  };

  // Get all maintenance staff
  app.get("/api/users/maintenance", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.userId;
      const user = req.user;

      if (!userId || !user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (user.role !== 'admin' && user.role !== 'maintenance') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Only show maintenance staff from the same organization
      const maintenanceStaff = await dbStorage.getMaintenanceStaff(user.organizationId!);
      res.json(maintenanceStaff);
    } catch (error) {
      console.error("Error fetching maintenance staff:", error);
      res.status(500).json({ message: "Failed to fetch maintenance staff" });
    }
  });



  // Create a new building request with photo upload
  app.post("/api/building-requests", authMiddleware, (req: any, res, next) => {
    // Process file upload after auth
    upload.array('photos', 5)(req, res, (err) => {
      if (err) {
        console.error("File upload error:", err);
        return res.status(400).json({ message: "File upload error", error: err.message });
      }
      next();
    });
  }, async (req: any, res) => {
    try {
      const user = req.user;
      const userId = user?.id;

      if (!userId || !user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Parse form data - handle multiple input formats
      let facility = req.body.facility || req.body.building;
      let event = req.body.event || req.body.requestTitle;
      let eventDate = req.body.eventDate || new Date().toISOString().split('T')[0];
      let priority = req.body.priority || "medium";
      let buildingName = facility;
      let roomNumber = req.body.roomNumber || req.body["building.roomNumber"];
      let description = req.body.description || req.body["building.description"];

      // Handle nested JSON object format (from form submissions)
      if (req.body.building && typeof req.body.building === 'object') {
        const buildingData = req.body.building;
        roomNumber = roomNumber || buildingData.roomNumber;
        description = description || buildingData.description;
        facility = facility || buildingData.building;
        buildingName = buildingName || buildingData.building;
      }

      // Validate required fields
      if (!facility || !roomNumber || !description) {
        return res.status(400).json({ message: "Missing required fields: facility, roomNumber, description" });
      }

      // Validate request data
      const requestData = insertRequestSchema.parse({
        requestType: "building",
        facility,
        event,
        eventDate,
        priority,
        requestorId: userId,
        organizationId: user.organizationId
      });

      // Create the request
      const createdRequest = await dbStorage.createRequest(requestData);

      // Validate building request data with the request ID
      const buildingRequestData = insertBuildingRequestSchema.parse({
        requestId: createdRequest.id,
        building: buildingName || facility,
        roomNumber,
        description
      });

      // Create building request record
      await dbStorage.createBuildingRequest(buildingRequestData);

      // If photos were uploaded, save them to the database
      if (req.files && req.files.length > 0) {
        try {
          for (const file of req.files) {
            const fileBuffer = file.buffer || (file.path ? fs.readFileSync(file.path) : undefined);
            if (!fileBuffer) {
              continue;
            }
            const photoData = {
              requestId: createdRequest.id,
              filename: file.filename,
              originalFilename: file.originalname,
              filePath: undefined,
              mimeType: file.mimetype,
              size: file.size,
              caption: `Building request photo - ${file.originalname}`,
              uploadedById: userId,
              photoUrl: undefined,
              fileBuffer
            };
            await dbStorage.saveRequestPhoto(photoData);
            // Delete local file after upload
            if (file.path) {
              try { require('fs').unlinkSync(file.path); } catch (e) { /* ignore */ }
            }
          }
        } catch (error) {
          console.error("Error saving photos:", error);
        }
      }

      // Create initial status update
      await dbStorage.createStatusUpdate({
        requestId: createdRequest.id,
        status: "pending",
        updatedById: userId,
        note: "Building request submitted"
      });

      // Send email notifications
      try {
        // Get organization and admin emails
        const organization = user.organizationId !== undefined
          ? await dbStorage.getOrganization(user.organizationId)
          : undefined;
        const adminEmails = user.organizationId !== undefined
          ? await dbStorage.getOrganizationAdminEmails(user.organizationId)
          : [];

        if (organization && adminEmails.length > 0) {
          await sendRequestNotificationEmails({
            requestId: createdRequest.id,
            requestType: 'building',
            title: event,
            description: description,
            priority: priority,
            location: facility,
            building: buildingName || facility,
            roomNumber: roomNumber,
            requesterName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
            requesterEmail: user.email,
            organizationName: organization.name,
            createdAt: new Date()
          }, adminEmails);
        }
      } catch (emailError) {
        console.error("Email notification error:", emailError);
      }

      res.status(201).json(createdRequest);
    } catch (error) {
      console.error("Error creating building request:", error);
      res.status(500).json({
        message: "Failed to create building request",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get user's requests by status
  app.get("/api/requests/my", authMiddleware, async (req: any, res) => {
    try {
      const { userId, user } = await getUserInfo(req);

      if (!userId || !user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const status = req.query.status as string | undefined;

      const requests = await dbStorage.getUserRequestsByStatus(userId, status);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching user requests:", error);
      res.status(500).json({ message: "Failed to fetch user requests" });
    }
  });

  // Get requests assigned to maintenance staff
  app.get("/api/requests/assigned", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.userId;
      const user = req.user;

      if (!userId || !user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (user.role !== 'maintenance' && user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const requests = await dbStorage.getAssignedRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching assigned requests:", error);
      res.status(500).json({ message: "Failed to fetch assigned requests" });
    }
  });

  // Get all requests (admin/maintenance only)
  app.get("/api/requests/all", authMiddleware, async (req: any, res) => {
    try {
      const { userId, user } = await getUserInfo(req);

      if (!userId || !user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const status = req.query.status as string | undefined;
      const organizationId = req.query.organizationId as string | undefined;

      if (user.role !== 'admin' && user.role !== 'maintenance' && user.role !== 'super_admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      let requests;
      if (user.role === 'super_admin') {
        // Super admins can filter by organization or see all data
        const orgId = organizationId ? parseInt(organizationId) : undefined;
        requests = await dbStorage.getAllRequestsByStatus(status, orgId);
      } else {
        // Regular admins see only their organization's data
        requests = await dbStorage.getAllRequestsByStatus(status, user.organizationId!);
      }
      res.json(requests);
    } catch (error) {
      console.error("Error fetching all requests:", error);
      res.status(500).json({ message: "Failed to fetch all requests" });
    }
  });

  // Get request details
  app.get("/api/requests/:id", authMiddleware, async (req: any, res) => {
    try {
      const { userId, user } = await getUserInfo(req);
      const requestId = parseInt(req.params.id);

      if (!userId || !user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Verify user can access this request (includes org verification)
      const canAccess = await dbStorage.canAccessRequest(userId, requestId);
      if (!canAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const request = await dbStorage.getRequestDetails(requestId);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      res.json(request);
    } catch (error) {
      console.error("Error fetching request details:", error);
      res.status(500).json({ message: "Failed to fetch request details" });
    }
  });

  // Get request timeline
  app.get("/api/requests/:id/timeline", authMiddleware, async (req: any, res) => {
    try {
      const { userId, user } = await getUserInfo(req);
      const requestId = parseInt(req.params.id);

      if (!userId || !user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Verify user has access to this request (includes org verification)
      const canAccess = await dbStorage.canAccessRequest(userId, requestId);
      if (!canAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const timeline = await dbStorage.getRequestTimeline(requestId);
      res.json(timeline);
    } catch (error) {
      console.error("Error fetching request timeline:", error);
      res.status(500).json({ message: "Failed to fetch request timeline" });
    }
  });

  // Get request messages
  app.get("/api/requests/:id/messages", authMiddleware, async (req: any, res) => {
    try {
      const { userId, user } = await getUserInfo(req);
      const requestId = parseInt(req.params.id);

      if (!userId || !user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Verify user has access to this request (includes org verification)
      const canAccess = await dbStorage.canAccessRequest(userId, requestId);
      if (!canAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const messages = await dbStorage.getRequestMessages(requestId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching request messages:", error);
      res.status(500).json({ message: "Failed to fetch request messages" });
    }
  });

  // Add a message to a request
  app.post("/api/requests/:id/messages", authMiddleware, async (req: any, res) => {
    try {
      const { userId, user } = await getUserInfo(req);
      const requestId = parseInt(req.params.id);

      if (!userId || !user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Check if user has access to this request
      const canAccess = await dbStorage.canAccessRequest(userId, requestId);
      if (!canAccess) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Validate message data
      const messageData = insertMessageSchema.parse({
        requestId,
        senderId: userId,
        content: req.body.content
      });

      const message = await dbStorage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Assign request to maintenance staff
  app.post("/api/requests/:id/assign", authMiddleware, async (req: any, res) => {
    try {
      // User is already authenticated by authMiddleware
      const userId = req.userId;
      const user = req.user;
      const requestId = parseInt(req.params.id);

      // Check role permission
      if (user?.role !== 'admin' && user?.role !== 'maintenance' && user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Verify user can access this request (includes org verification)
      const canAccess = await dbStorage.canAccessRequest(userId, requestId);
      if (!canAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Validate assignment data
      const assignmentData = insertAssignmentSchema.parse({
        requestId,
        assigneeId: req.body.assigneeId,
        assignerId: userId,
        internalNotes: req.body.internalNotes || ""
      });

      // Create assignment
      const assignment = await dbStorage.assignRequest(assignmentData);

      // Update request status to approved if it's pending
      const request = await dbStorage.getRequestById(requestId);
      if (request && request.status === 'pending') {
        await dbStorage.updateRequestStatus({
          requestId,
          status: 'approved',
          updatedById: userId,
          note: `Request approved and assigned to staff`
        });
      }

      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error assigning request:", error);
      res.status(500).json({ message: "Failed to assign request" });
    }
  });

  // Update request status
  app.post("/api/requests/:id/status", authMiddleware, async (req: any, res) => {
    try {
      // User is already authenticated by authMiddleware
      const userId = req.userId;
      const user = req.user;
      const requestId = parseInt(req.params.id);

      // Verify user can access this request (includes org verification)
      const canAccess = await dbStorage.canAccessRequest(userId, requestId);
      if (!canAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if user has proper permissions to update status
      const canUpdateStatus = user?.role === 'admin' || user?.role === 'maintenance' || user?.role === 'super_admin' ||
        (req.body.status === 'cancelled' && await dbStorage.isRequestor(userId, requestId));

      if (!canUpdateStatus) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Validate status update data
      const statusUpdateData = insertStatusUpdateSchema.parse({
        requestId,
        status: req.body.status,
        updatedById: userId,
        note: req.body.note
      });

      // Update request status and priority if provided
      await dbStorage.updateRequestStatus(statusUpdateData);

      // Update priority if provided
      if (req.body.priority) {
        await dbStorage.updateRequestPriority(requestId, req.body.priority);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating request status:", error);
      res.status(500).json({
        message: "Failed to update request status",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get organization buildings
  app.get("/api/buildings", authMiddleware, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.organizationId === undefined) {
        return res.status(400).json({ message: "No organization assigned to user." });
      }
      const buildings = await dbStorage.getBuildingsByOrganization(user.organizationId);
      res.json(buildings);
    } catch (error) {
      console.error("Error fetching buildings:", error);
      res.status(500).json({ message: "Failed to fetch buildings" });
    }
  });



  // Super Admin API routes for managing buildings and facilities

  // Get buildings for a specific organization (super admin only)
  app.get("/api/admin/buildings/:orgId", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await dbStorage.getUser(userId);

      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      const orgId = parseInt(req.params.orgId);
      const buildings = await dbStorage.getBuildingsByOrganization(orgId);
      res.json(buildings);
    } catch (error) {
      console.error("Error fetching buildings:", error);
      res.status(500).json({ message: "Failed to fetch buildings" });
    }
  });

  // Upload building image (super admin only) - uses appropriate storage based on environment
  app.post("/api/admin/buildings/:id/image", authMiddleware, (req: any, res) => {
    upload.single('image')(req, res, async (err: any) => {
      if (err) {
        console.error("Building image upload error:", err);
        return res.status(400).json({ message: err.message || "Upload failed" });
      }

      try {
        const userId = req.user.id;
        const user = await dbStorage.getUser(userId);

        if (user?.role !== 'super_admin') {
          return res.status(403).json({ message: "Super admin access required" });
        }

        const buildingId = parseInt(req.params.id);
        
        if (!req.file) {
          return res.status(400).json({ message: "No image file provided" });
        }

        // Read file from disk (multer uses diskStorage)
        const fileBuffer = fs.readFileSync(req.file.path);
        const safeFilename = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const objectId = `buildings-${buildingId}-${Date.now()}-${safeFilename}`;
        
        let imageUrl: string;
        
        // Check if we're in Replit environment (has Object Storage sidecar)
        if (process.env.REPL_ID && process.env.PRIVATE_OBJECT_DIR) {
          console.log("Using Replit Object Storage for building image");
          try {
            const objectStorage = new ObjectStorageService();
            const privateDir = objectStorage.getPrivateObjectDir();
            const fullPath = `${privateDir}/uploads/${objectId}`;
            
            const pathParts = fullPath.split("/").filter(Boolean);
            const bucketName = pathParts[0];
            const objectName = pathParts.slice(1).join("/");
            
            const { objectStorageClient } = await import("./replit_integrations/object_storage");
            const bucket = objectStorageClient.bucket(bucketName);
            const gcsFile = bucket.file(objectName);
            
            await gcsFile.save(fileBuffer, {
              contentType: req.file.mimetype,
            });
            
            imageUrl = `/objects/uploads/${objectId}`;
          } catch (storageError) {
            console.error("Object Storage failed, falling back to local:", storageError);
            const uploadsDir = path.join(process.cwd(), 'uploads', 'photos');
            if (!fs.existsSync(uploadsDir)) {
              fs.mkdirSync(uploadsDir, { recursive: true });
            }
            const localPath = path.join(uploadsDir, objectId);
            fs.writeFileSync(localPath, fileBuffer);
            imageUrl = `/uploads/photos/${objectId}`;
          }
        } else if (process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID) {
          // Use AWS S3 for persistent storage (Railway deployment)
          console.log("Using AWS S3 for building image");
          try {
            const s3Key = `uploads/buildings/${objectId}`;
            const params = {
              Bucket: process.env.AWS_S3_BUCKET,
              Key: s3Key,
              Body: fileBuffer,
              ContentType: req.file.mimetype,
            };
            const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
            const s3Client = new S3Client({
              region: process.env.AWS_REGION || 'us-east-1',
              credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
              },
            });
            await s3Client.send(new PutObjectCommand(params));
            imageUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;
          } catch (s3Error) {
            console.error("S3 upload failed, falling back to local:", s3Error);
            const uploadsDir = path.join(process.cwd(), 'uploads', 'photos');
            if (!fs.existsSync(uploadsDir)) {
              fs.mkdirSync(uploadsDir, { recursive: true });
            }
            const localPath = path.join(uploadsDir, objectId);
            fs.writeFileSync(localPath, fileBuffer);
            imageUrl = `/uploads/photos/${objectId}`;
          }
        } else {
          // Use local filesystem as fallback
          console.log("Using local filesystem for building image");
          const uploadsDir = path.join(process.cwd(), 'uploads', 'photos');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          const localPath = path.join(uploadsDir, objectId);
          fs.writeFileSync(localPath, fileBuffer);
          imageUrl = `/uploads/photos/${objectId}`;
        }
        
        const building = await dbStorage.updateBuilding(buildingId, { imageUrl });

        // Clean up multer temp file
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        console.log(`Building image uploaded successfully: ${imageUrl}`);
        res.json({ 
          success: true, 
          imageUrl,
          building: {
            ...building,
            roomNumbers: building.roomNumbers ?? [],
          }
        });
      } catch (error) {
        console.error("Error uploading building image:", error);
        res.status(500).json({ message: "Failed to upload building image" });
      }
    });
  });

  // Delete building image (super admin only)
  app.delete("/api/admin/buildings/:id/image", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await dbStorage.getUser(userId);

      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      const buildingId = parseInt(req.params.id);
      const building = await dbStorage.updateBuilding(buildingId, { imageUrl: null });

      res.json({ 
        success: true, 
        building: {
          ...building,
          roomNumbers: building.roomNumbers ?? [],
        }
      });
    } catch (error) {
      console.error("Error removing building image:", error);
      res.status(500).json({ message: "Failed to remove building image" });
    }
  });

  // Get facilities for a specific organization (super admin only)
  app.get("/api/admin/facilities/:orgId", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await dbStorage.getUser(userId);

      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      const orgId = parseInt(req.params.orgId);
      const facilities = await dbStorage.getFacilitiesByOrganization(orgId);
      res.json(facilities);
    } catch (error) {
      console.error("Error fetching facilities:", error);
      res.status(500).json({ message: "Failed to fetch facilities" });
    }
  });

  // Get reports data (admin/super_admin only)
  app.get("/api/reports", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await dbStorage.getUser(userId);

      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const reportType = req.query.type || 'monthly';

      // Get organization ID for filtering (null for super_admin to get all)
      const orgId = user.role === 'super_admin' ? undefined : user.organizationId ?? undefined;

      const reports = await dbStorage.getReportsData(reportType, orgId);

      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports data:", error);
      res.status(500).json({ message: "Failed to fetch reports data" });
    }
  });

  // Upload photo to request
  app.post("/api/requests/:id/photos", authMiddleware, upload.single('photo'), async (req: any, res) => {
    try {
      const { userId } = await getUserInfo(req);
      const requestId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Verify the user has access to this request
      const canAccess = await dbStorage.canAccessRequest(userId, requestId);
      if (!canAccess) {
        return res.status(403).json({ message: "Unauthorized to add photos to this request" });
      }

      // Ensure a file was uploaded
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded or invalid file type" });
      }

      // Read file buffer for S3 upload
      const fileBuffer = req.file.buffer || (req.file.path ? require('fs').readFileSync(req.file.path) : undefined);
      if (!fileBuffer) {
        return res.status(400).json({ message: "Could not read file buffer for upload" });
      }
      // Save photo information to database, uploading to S3
      const photoData = {
        requestId,
        filename: req.file.filename,
        originalFilename: req.file.originalname,
        filePath: undefined,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedById: userId,
        photoUrl: undefined,
        fileBuffer
      };
      const photo = await dbStorage.saveRequestPhoto(photoData);
      if (req.file.path) {
        try { require('fs').unlinkSync(req.file.path); } catch (e) { /* ignore */ }
      }
      res.status(201).json(photo);
    } catch (error) {
      console.error("Error uploading photo:", error);
      res.status(500).json({ message: "Failed to upload and save photo" });
    }
  });

  // Get request photos
  app.get("/api/requests/:id/photos", authMiddleware, async (req: any, res) => {
    try {
      const { userId } = await getUserInfo(req);
      const requestId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Verify the user has access to this request
      const canAccess = await dbStorage.canAccessRequest(userId, requestId);
      if (!canAccess) {
        return res.status(403).json({ message: "Unauthorized to view photos for this request" });
      }

      // Get photos for this request
      const photos = await dbStorage.getRequestPhotos(requestId);

      res.json(photos);
    } catch (error) {
      console.error("Error fetching request photos:", error);
      res.status(500).json({ message: "Failed to fetch request photos" });
    }
  });

  // Serve uploaded files - public access, no auth required
  app.get("/api/uploads/:filename", (req: any, res) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(uploadDir, filename);

      // Basic security check to prevent directory traversal
      if (!filename || filename.includes('..') || filename.includes('/')) {
        return res.status(400).json({ message: "Invalid filename" });
      }

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }

      // Serve the file with correct mime type
      res.sendFile(path.resolve(filePath));
    } catch (error) {
      console.error("Error serving file:", error);
      res.status(500).json({ message: "Failed to serve file" });
    }
  });

  // Room History endpoints

  // Get all building names for room history dropdown
  app.get("/api/room-buildings", authMiddleware, async (req: any, res) => {
    try {
      const { userId } = await getUserInfo(req);
      const user = await dbStorage.getUser(userId);

      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get organization ID for filtering (null for super_admin to get all)
      const orgId = user.role === 'super_admin' ? undefined : user.organizationId ?? undefined;

      // Get building names from building_requests table filtered by org
      const buildingNames = await dbStorage.getAllBuildings(orgId);

      // If no building names found in building_requests, fall back to buildings table names
      if (!buildingNames || buildingNames.length === 0) {
        if (user.organizationId) {
          const buildings = await dbStorage.getBuildingsByOrganization(user.organizationId);
          res.json(buildings.map((building: any) => building.name));
        } else {
          res.json([]);
        }
      } else {
        res.json(buildingNames);
      }
    } catch (error) {
      console.error("Error fetching buildings:", error);
      res.status(500).json({ message: "Failed to fetch buildings" });
    }
  });

  // Get room history - requests by building and optionally room number
  app.get("/api/room-history", authMiddleware, async (req: any, res) => {
    try {
      const { userId } = await getUserInfo(req);

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await dbStorage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const building = req.query.building as string;
      const roomNumber = req.query.roomNumber as string | undefined;

      if (!building) {
        return res.status(400).json({ message: "Building parameter is required" });
      }

      // Get organization ID for filtering (null for super_admin to get all)
      const orgId = user.role === 'super_admin' ? undefined : user.organizationId ?? undefined;

      const requests = await dbStorage.getRequestsByBuilding(building, roomNumber, orgId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching room history:", error);
      res.status(500).json({ message: "Failed to fetch room history" });
    }
  });

  // Admin Organization Management endpoints
  app.get("/api/admin/organizations", authMiddleware, async (req, res) => {
    try {
      const user = req.user as any;

      // Only allow super admins to access this endpoint
      if (user.role !== 'super_admin') {
        return res.status(403).json({ error: "Access denied. Super admin required." });
      }

      const organizations = await dbStorage.getAllOrganizations();
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });

  app.post("/api/admin/organizations", authMiddleware, async (req, res) => {
    try {
      const user = req.user as any;

      // Only allow super admins to create organizations
      if (user.role !== 'super_admin') {
        return res.status(403).json({ error: "Access denied. Super admin required." });
      }

      const { name, slug, domain, logoUrl } = req.body;

      // Validate required fields
      if (!name || !slug) {
        return res.status(400).json({ error: "Name and slug are required" });
      }

      const organization = await dbStorage.createOrganization({
        name,
        slug,
        domain: domain || null,
        logoUrl: logoUrl || null,
        settings: {}
      });

      res.json(organization);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ error: "Failed to create organization" });
    }
  });

  app.patch("/api/admin/organizations/:id", authMiddleware, async (req, res) => {
    try {
      const user = req.user as any;

      // Only allow super admins to update organizations
      if (user.role !== 'super_admin') {
        return res.status(403).json({ error: "Access denied. Super admin required." });
      }

      const { id } = req.params;
      const { name, domain, logoUrl } = req.body;

      const organization = await dbStorage.updateOrganization(parseInt(id), {
        name,
        domain: domain || null,
        logoUrl: logoUrl || null
      });

      res.json(organization);
    } catch (error) {
      console.error("Error updating organization:", error);
      res.status(500).json({ error: "Failed to update organization" });
    }
  });

  // Delete organization (super admin only)
  app.delete("/api/admin/organizations/:id", authMiddleware, async (req: any, res) => {
    try {
      const user = req.user as any;

      // Only allow super admins to delete organizations
      if (user.role !== 'super_admin') {
        return res.status(403).json({ error: "Access denied. Super admin required." });
      }

      const id = parseInt(req.params.id);
      await dbStorage.deleteOrganization(id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting organization:", error);
      res.status(500).json({ error: "Failed to delete organization" });
    }
  });

  // USER MANAGEMENT API ENDPOINTS

  // Get all users (super admin only)
  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      // Extract user ID from session authentication
      const currentUserId = req.user?.id || req.user?.claims?.sub;

      if (!currentUserId) {
        return res.status(401).json({ message: "User ID not found in session" });
      }

      const currentUser = await dbStorage.getUser(currentUserId);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found in database" });
      }

      if (currentUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      const users = await dbStorage.getAllUsers();
      console.log("Returning users count:", users.length);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Create user manually (super admin only)
  app.post("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const currentUser = await dbStorage.getUser(currentUserId);

      if (currentUser?.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      const { email, firstName, lastName, role, organizationId } = req.body;

      // Validate required fields - organizationId is optional for super_admin
      if (!email || !firstName || !lastName || !role) {
        return res.status(400).json({ message: "Email, first name, last name, and role are required" });
      }

      // Super admins don't need an organization, others do
      if (role !== 'super_admin' && !organizationId) {
        return res.status(400).json({ message: "Organization is required for non-super admin users" });
      }

      // Check if user already exists
      const existingUser = await dbStorage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Create user data
      const userData = {
        id: crypto.randomUUID(),
        email,
        firstName,
        lastName,
        role,
        organizationId: role === 'super_admin' ? null : organizationId,
        profileImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newUser = await dbStorage.upsertUser(userData);
      res.json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Update user role (super admin only)
  app.patch("/api/admin/users/:userId/role", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user?.id || req.user?.claims?.sub;

      if (!currentUserId) {
        return res.status(401).json({ message: "User ID not found in session" });
      }

      const currentUser = await dbStorage.getUser(currentUserId);

      if (!currentUser || currentUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      const { userId } = req.params;
      const { role } = req.body;

      // Validate role
      const validRoles = ['requester', 'maintenance', 'admin', 'super_admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const updatedUser = await dbStorage.updateUserRole(userId, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Update user organization (super admin only)
  app.patch("/api/admin/users/:userId/organization", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user?.id || req.user?.claims?.sub;

      if (!currentUserId) {
        return res.status(401).json({ message: "User ID not found in session" });
      }

      const currentUser = await dbStorage.getUser(currentUserId);

      if (!currentUser || currentUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      const { userId } = req.params;
      const { organizationId } = req.body;

      const updatedUser = await dbStorage.updateUserOrganization(userId, organizationId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user organization:", error);
      res.status(500).json({ message: "Failed to update user organization" });
    }
  });

  // Delete user (super admin only)
  app.delete("/api/admin/users/:userId", isAuthenticated, async (req: any, res) => {
    try {
      // Extract user ID from session authentication
      const currentUserId = req.user?.id || req.user?.claims?.sub;

      if (!currentUserId) {
        return res.status(401).json({ message: "User ID not found in session" });
      }

      const currentUser = await dbStorage.getUser(currentUserId);

      if (!currentUser) {
        return res.status(404).json({ message: "Current user not found in database" });
      }

      if (currentUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      const { userId } = req.params;

      // Prevent user from deleting themselves
      if (userId === currentUserId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await dbStorage.deleteUser(userId);
      console.log(`User ${userId} deleted by ${currentUser.email}`);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Contact form submission endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      const parsed = insertContactMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input", details: parsed.error.errors });
      }

      // Save to database
      const [created] = await db.insert(contactMessages).values(parsed.data).returning();

      // Send emails via ZeptoMail
      if (isZeptoMailConfigured()) {
        const emailResult = await sendContactFormEmails({
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
          email: parsed.data.email,
          phone: parsed.data.phone || undefined,
          organization: parsed.data.organization,
          organizationType: parsed.data.organizationType || undefined,
          inquiry: parsed.data.inquiry || undefined,
          message: parsed.data.message,
        });

        if (!emailResult.success) {
          console.error("Contact form email sending failed:", emailResult.error);
        }
      }

      res.status(201).json({ success: true, message: "Message received", data: created });
    } catch (error) {
      console.error("Error processing contact form:", error);
      res.status(500).json({ error: "Failed to submit message" });
    }
  });

  // Neon DB Email/Password Signup
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if user exists
      const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
      if (existing) {
        return res.status(409).json({ message: "User with this email already exists" });
      }

      // Hash password
      const hashed = await bcrypt.hash(password, 10);

      // Get default organization for new users
      const defaultOrgId = await getDefaultOrganizationId();

      // Create user
      const id = crypto.randomUUID();
      const now = new Date();
      const [user] = await db.insert(users).values({
        id,
        email,
        firstName,
        lastName,
        password: hashed,
        role: "requester",
        organizationId: defaultOrgId,
        createdAt: now,
        updatedAt: now,
      }).returning();

      // Set session for user after signup
      req.session.user = {
        id: user.id,
        email: user.email || '',
        role: user.role,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        organizationId: user.organizationId ?? undefined
      };

      // Save session before sending response
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Failed to save session" });
        }

        return res.status(201).json({
          message: "Signup successful",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          },
        });
      });
    } catch (err: any) {
      console.error("Signup error:", err);
      return res.status(500).json({
        message: "Signup failed",
        error: err.message,
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      let { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Missing email or password" });
      }
      email = email.trim().toLowerCase();
      password = password.trim();

      // Find user by email
      const user = await db.query.users.findFirst({ where: eq(users.email, email) });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare password
      if (!user.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Set session for user (no Google Auth/passport)
      req.session.user = {
        id: user.id,
        email: user.email || '',
        role: user.role,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        organizationId: user.organizationId ?? undefined
      };

      // Save session before sending response
      req.session.save((err: any) => {
        if (err) {
          console.error("🔥 Session save error:", err);
          return res.status(500).json({ message: "Failed to save session" });
        }

        console.log("✅ Session saved with user:", req.session.user);

        return res.status(200).json({
          message: "Login successful",
          user: req.session.user,
        });
      });
    } catch (err: any) {
      console.error("🔥 Login error:", err);
      return res.status(500).json({
        message: "Login failed",
        error: err.message,
      });
    }
  });



  app.get('/api/logout', (req, res) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
      
      // Clear cookie with same options it was set with
      res.clearCookie('connect.sid', {
        path: '/',
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax'
      });
      
      // Set cache control headers to prevent caching
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      res.json({ message: "Logged out" });
    });
  });

  app.get('/get-presigned-url', async (req, res) => {
    const { key } = req.query;

    if (!key || typeof key !== 'string') {
      return res.status(400).json({ error: 'Key parameter is required' });
    }

    try {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET || 'repair-request-121905340783',
        Key: key,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });
      res.json({ url });
    } catch (err) {
      console.error('Error generating presigned URL:', err);
      res.status(500).json({ error: 'Failed to generate presigned URL' });
    }
  });

  // Proxy endpoint to serve S3 images (handles private bucket access)
  app.get('/api/s3-proxy', async (req, res) => {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
      // Parse S3 URL to get bucket and key
      const s3UrlMatch = url.match(/https:\/\/([^.]+)\.s3\.([^.]+)\.amazonaws\.com\/(.+)/);
      if (!s3UrlMatch) {
        return res.status(400).json({ error: 'Invalid S3 URL format' });
      }

      const [, bucket, region, key] = s3UrlMatch;
      
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: decodeURIComponent(key),
      });

      // Create S3 client with proper region
      const { S3Client } = await import('@aws-sdk/client-s3');
      const regionalS3Client = new S3Client({
        region: region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });

      const response = await regionalS3Client.send(command);
      
      // Set content type
      if (response.ContentType) {
        res.setHeader('Content-Type', response.ContentType);
      }
      res.setHeader('Cache-Control', 'public, max-age=3600');
      
      // Stream the body
      if (response.Body) {
        const stream = response.Body as NodeJS.ReadableStream;
        stream.pipe(res);
      } else {
        res.status(404).json({ error: 'Image not found' });
      }
    } catch (err) {
      console.error('Error proxying S3 image:', err);
      res.status(500).json({ error: 'Failed to fetch image' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
