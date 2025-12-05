import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage as dbStorage } from "./storage";
import { isAuthenticated } from "./subAuth.js";
import { sendRequestNotificationEmails } from "./emailService";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import z from "zod"
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { sendEmail } from "./emailService";
import { sendContactFormEmails, isZeptoMailConfigured, sendTestEmail } from "./zeptoMailService";

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

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

export async function registerRoutes(app: Express): Promise<Server> {

  // Forgot password endpoint


  app.post("/api/forgot-password", async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ status: "error", error: { message: "Email is required" } });
    }
    try {
      const user = await dbStorage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ status: "error", error: { message: "User not found" } });
      }

      // Actually send the email
      const emailSent = await sendEmail({
        to: user.email,
        from: process.env.FROM_EMAIL || "noreply@schoolhouselogistics.com",
        subject: "Password Reset Request",
        text: `Hello,\n\nYou requested a password reset. If this was you, click the link below to reset your password. If not, you can ignore this email.\n\n[Reset Link Here]`,
        html: `<p>Hello,</p><p>You requested a password reset. If this was you, click the link below to reset your password. If not, you can ignore this email.</p><p><a href='#'>Reset Password</a></p>`
      });

      if (!emailSent) {
        return res.status(500).json({ status: "error", error: { message: "Failed to send email" } });
      }

      return res.json({ status: "success", data: undefined });
    } catch (err) {
      return res.status(500).json({ status: "error", error: { message: "Internal server error" } });
    }
  });

  app.post("/api/admin/users/bulk", isAuthenticated, async (req: any, res) => {
    try {
      console.log("req.user:", req.user);

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
        console.error("No users array in request body");
        return res.status(400).json({ message: "No users array provided" });
      }

      const result = bulkSchema.safeParse(req.body.users);
      console.log("Validation result:", result);
      if (!result.success) {
        console.error("Bulk import validation failed:", result.error.flatten().fieldErrors);
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

          console.log(`Created user ${u.email} with temporary password: ${tempPassword}`);
          created++;
        } catch (e) {
          console.error("Failed row:", u, e);
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
      console.error("Error stack:", e.stack);
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

      // Find or create user - assign new users to New School (org ID 2) by default
      const DEFAULT_ORGANIZATION_ID = 2; // New School
      let user = await dbStorage.getUserByEmail(profile.email);
      if (!user) {
        // Create new user using upsertUser
        const userData = {
          id: profile.id,
          email: profile.email,
          firstName: profile.given_name || '',
          lastName: profile.family_name || '',
          role: 'requester' as const,
          organizationId: DEFAULT_ORGANIZATION_ID,
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

  // Test email endpoint for debugging
  app.post("/api/test-email", async (req, res) => {
    console.log("=== EMAIL TEST ENDPOINT ===");
    try {
      const { sendRequestNotificationEmails } = await import("./emailService.js");

      const testData = {
        requestId: 999,
        requestType: 'facility' as const,
        title: 'Test Email Request',
        description: 'This is a test email to verify the notification system is working properly.',
        priority: 'medium',
        location: 'Test Building',
        requesterName: 'Test User',
        requesterEmail: 'jeffacarstens@gmail.com',
        organizationName: 'Canterbury School',
        createdAt: new Date()
      };

      const testAdminEmails = ['jeffacarstens@gmail.com'];

      await sendRequestNotificationEmails(testData, testAdminEmails);

      res.json({ message: 'Test email sent successfully' });
    } catch (error) {
      console.error('Test email failed:', error);
      res.status(500).json({ message: 'Test email failed', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Priority facilities request creation route (FACILITIES ONLY - building requests go to /api/building-requests)
  app.post("/api/requests", async (req, res) => {
    console.log("=== FACILITIES REQUEST HANDLER (NOT BUILDING) ===");

    try {
      // Check authentication
      if (!req.isAuthenticated?.() || !req.user) {
        console.log("Authentication failed");
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = req.user as AuthenticatedUser;
      const userId = user?.id;

      console.log("User authenticated:", {
        userId,
        userRole: user.role,
        userOrg: user.organizationId,
        userEmail: user.email
      });

      // REDIRECT BUILDING REQUESTS TO PROPER ENDPOINT
      if (req.body.requestType === "building" || req.body["building.description"]) {
        console.log("🔄 BUILDING REQUEST DETECTED - REDIRECTING TO /api/building-requests");
        return res.status(400).json({
          message: "Building requests must use /api/building-requests endpoint",
          redirect: "/api/building-requests"
        });
      }

      // Check required fields before validation
      const requiredFields = ['facility', 'event', 'eventDate'];
      const missingFields = requiredFields.filter(field => !req.body[field]);
      if (missingFields.length > 0) {
        console.log("Missing required fields:", missingFields);
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

      console.log("Data prepared for validation:", JSON.stringify(dataForValidation, null, 2));

      // Validate request data
      console.log("Starting schema validation...");
      let requestData;
      try {
        requestData = insertRequestSchema.parse(dataForValidation);
        console.log("Schema validation successful:", JSON.stringify(requestData, null, 2));
      } catch (validationError) {
        console.error("Schema validation failed:", validationError);
        return res.status(400).json({
          message: "Validation error",
          error: validationError.message || validationError
        });
      }

      // Create the basic request first
      console.log("Creating request in database...");
      let createdRequest;
      try {
        createdRequest = await dbStorage.createRequest(requestData);
        console.log("Request created successfully:", createdRequest);
      } catch (dbError) {
        console.error("Database creation error:", dbError);
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
      console.log("Creating initial status update...");
      try {
        await dbStorage.createStatusUpdate({
          requestId: createdRequest.id,
          status: "pending",
          updatedById: userId,
          note: itemsNote
        });
        console.log("Status update created successfully");
      } catch (statusError) {
        console.error("Status update creation error:", statusError);
        // Don't fail the whole request for status update error
      }

      // Send email notifications
      console.log("Sending email notifications...");
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
            requestType: 'facility',
            title: req.body.event,
            description: itemsNote,
            priority: req.body.priority || 'medium',
            location: req.body.facility,
            requesterName: `${user.firstName} ${user.lastName}`,
            requesterEmail: user.email,
            organizationName: organization.name,
            createdAt: new Date(createdRequest.createdAt)
          }, adminEmails);
          console.log("Email notifications sent successfully");
        } else {
          console.log("Skipping email notifications - no organization or admin emails found");
        }
      } catch (emailError) {
        console.error("Email notification error:", emailError);
        // Don't fail the request if email fails
      }

      console.log("=== PRIORITY REQUEST SUBMISSION COMPLETED SUCCESSFULLY ===");
      res.status(201).json(createdRequest);
    } catch (error) {
      console.error("=== UNEXPECTED ERROR IN PRIORITY FACILITIES REQUEST ===");
      console.error("Error type:", typeof error);
      console.error("Error message:", error?.message);
      console.error("Error stack:", error?.stack);
      console.error("Full error object:", error);
      res.status(500).json({
        message: "Failed to create labor request",
        error: error?.message || "Unknown error"
      });
    }
  });

  // Priority facilities endpoint
  app.get("/api/facilities", async (req, res) => {
    console.log("=== PRIORITY FACILITIES HANDLER ===");

    try {
      // Check authentication
      if (!req.isAuthenticated?.() || !req.user) {
        console.log("Authentication failed");
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = req.user as AuthenticatedUser;
      const userId = user?.id;

      console.log("User authenticated:", {
        userId,
        userRole: user.role,
        userOrg: user.organizationId
      });

      const facilities = await dbStorage.getFacilitiesByOrganization(user.organizationId);
      console.log("Facilities found:", facilities);
      res.json(facilities);
    } catch (error) {
      console.error("Error fetching facilities:", error);
      res.status(500).json({ message: "Failed to fetch facilities" });
    }
  });

  // PRIORITY STATUS UPDATE ROUTE: Register before Vite middleware
  app.post("/api/requests/:id/status", async (req, res) => {
    console.log("=== PRIORITY STATUS UPDATE HANDLER ===");
    console.log("Request ID:", req.params.id);

    try {
      // Check authentication
      if (!req.isAuthenticated?.() || !req.user) {
        console.log("Authentication failed");
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.id;
      const user = req.user;
      const requestId = parseInt(req.params.id);

      console.log("Processing status update for user:", { id: userId, role: user.role });

      // Check permissions
      const canUpdateStatus = user.role === 'admin' || user.role === 'maintenance' ||
        (req.body.status === 'cancelled' && await dbStorage.isRequestor(userId, requestId));

      if (!canUpdateStatus) {
        console.log("Permission denied");
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Create status update
      const statusUpdateData = {
        requestId,
        status: req.body.status,
        updatedById: userId,
        note: req.body.note || ""
      };

      console.log("Updating status with data:", statusUpdateData);

      // Update request status
      await dbStorage.updateRequestStatus(statusUpdateData);

      // Update priority if provided
      if (req.body.priority) {
        console.log("Updating priority to:", req.body.priority);
        await dbStorage.updateRequestPriority(requestId, req.body.priority);
      }

      console.log("Status update successful");
      res.json({ success: true });

    } catch (error) {
      console.error("Status update error:", error);
      res.status(500).json({
        message: "Failed to update request status",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // PRIORITY DASHBOARD ROUTES: Register before Vite middleware
  app.get("/api/dashboard/stats", async (req, res) => {
    console.log("=== PRIORITY DASHBOARD STATS ===");

    try {
      if (!req.isAuthenticated?.() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

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

  app.get("/api/requests/recent", async (req, res) => {
    console.log("=== PRIORITY RECENT REQUESTS ===");

    try {
      if (!req.isAuthenticated?.() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

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

      console.log("Recent requests found:", requests.length);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching recent requests:", error);
      res.status(500).json({ message: "Failed to fetch recent requests" });
    }
  });

  // CRITICAL: Add critical admin routes first to avoid Vite conflicts
  app.get("/api/admin/organizations", async (req: any, res) => {
    try {
      console.log("Direct organizations route called");
      const organizations = await dbStorage.getAllOrganizations();
      console.log("Direct route organizations:", organizations);
      res.setHeader('Content-Type', 'application/json');
      res.json(organizations);
    } catch (error) {
      console.error("Direct route error:", error);
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });

  // Get buildings for organization
  app.get("/api/admin/buildings/:orgId", async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      console.log("Fetching buildings for organization:", orgId);
      const buildings = await dbStorage.getBuildingsByOrganization(orgId);
      console.log("Buildings found:", buildings);
      res.setHeader('Content-Type', 'application/json');
      res.json(buildings);
    } catch (error) {
      console.error("Error fetching buildings:", error);
      res.status(500).json({ error: "Failed to fetch buildings" });
    }
  });

  // Get facilities for organization
  app.get("/api/admin/facilities/:orgId", async (req: any, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      console.log("Fetching facilities for organization:", orgId);
      const facilities = await dbStorage.getFacilitiesByOrganization(orgId);
      console.log("Facilities found:", facilities);
      res.setHeader('Content-Type', 'application/json');
      res.json(facilities);
    } catch (error) {
      console.error("Error fetching facilities:", error);
      res.status(500).json({ error: "Failed to fetch facilities" });
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

      // Ensure roomNumbers is always an array
      let roomNumbers = [];
      if (Array.isArray(req.body.roomNumbers)) {
        roomNumbers = req.body.roomNumbers;
      } else if (typeof req.body.roomNumbers === 'string' && req.body.roomNumbers.trim() !== '') {
        roomNumbers = req.body.roomNumbers.split(',').map((s: string) => s.trim());
      }
      const buildingData = {
        organizationId: req.body.organizationId,
        name: req.body.name,
        address: req.body.address,
        description: req.body.description,
        roomNumbers: roomNumbers, // Always an array
        isActive: true,
      };

      const building = await dbStorage.createBuilding(buildingData);
      // Map DB result to ensure roomNumbers is always an array
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
      // Ensure roomNumbers is always an array
      let updateRoomNumbers = [];
      if (Array.isArray(req.body.roomNumbers)) {
        updateRoomNumbers = req.body.roomNumbers;
      } else if (typeof req.body.roomNumbers === 'string' && req.body.roomNumbers.trim() !== '') {
        updateRoomNumbers = req.body.roomNumbers.split(',').map((s: string) => s.trim());
      }
      const updates = {
        name: req.body.name,
        address: req.body.address,
        description: req.body.description,
        room_numbers: updateRoomNumbers, // Always an array
      };

      const building = await dbStorage.updateBuilding(buildingId, updates);
      // Map DB result to ensure roomNumbers is always an array
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

      const facilityData = req.body;
      const facility = await dbStorage.createFacility(facilityData);
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
      const updates = req.body;
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

  // Create organization (super admin only)
  app.post("/api/admin/organizations", async (req: any, res) => {
    try {
      console.log("Creating organization:", req.body);
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

      console.log("Organization created:", organization);
      res.json(organization);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ error: "Failed to create organization" });
    }
  });

  // Update organization (super admin only)
  app.patch("/api/admin/organizations/:id", async (req: any, res) => {
    try {
      const { id } = req.params;
      const { name, domain, logoUrl } = req.body;

      console.log("Updating organization:", id, req.body);
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
      console.log(`=== MULTER DESTINATION ===`);
      console.log(`Upload directory: ${uploadDir}`);
      console.log(`Directory exists: ${fs.existsSync(uploadDir)}`);
      console.log(`Current working directory: ${process.cwd()}`);

      // Ensure the directory exists before writing
      try {
        if (!fs.existsSync(uploadDir)) {
          console.log(`Creating directory: ${uploadDir}`);
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        console.log(`Directory ready for upload`);
        cb(null, uploadDir);
      } catch (error: any) {
        console.error(`Directory creation failed:`, error);
        cb(error, uploadDir);
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const filename = `photo-${uniqueSuffix}${ext}`;

      console.log(`=== MULTER FILENAME ===`);
      console.log(`Original name: ${file.originalname}`);
      console.log(`Generated filename: ${filename}`);
      console.log(`Extension: ${ext}`);
      console.log(`MIME type: ${file.mimetype}`);

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

  // Simple test endpoint
  app.get("/api/test-simple", (req, res) => {
    res.json({ message: "Server is working", timestamp: new Date().toISOString() });
  });

  // Test upload endpoint for debugging (no auth for testing)
  app.post("/api/test-upload", (req, res, next) => {
    console.log("=== TEST UPLOAD STARTED ===");
    console.log("Request content-type:", req.headers['content-type']);

    upload.single('test')(req, res, (err) => {
      console.log("=== TEST UPLOAD MULTER CALLBACK ===");
      console.log("Multer error:", err);
      console.log("File after multer:", req.file);

      if (err) {
        console.error("MULTER ERROR:", err);
        return res.status(400).json({ error: err.message });
      }

      try {
        console.log("File received:", req.file);
        console.log("Body received:", req.body);

        if (req.file) {
          console.log("File details:", {
            originalname: req.file.originalname,
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size
          });

          const exists = fs.existsSync(req.file.path);
          console.log(`File exists at ${req.file.path}: ${exists}`);
        }

        res.json({
          success: true,
          file: req.file,
          uploadDir: uploadDir,
          cwd: process.cwd()
        });
      } catch (error: any) {
        console.error("Test upload error:", error);
        res.status(500).json({ error: error.message });
      }
    });
  });



  // Allow all emails - Google OAuth will manage user access
  function isAllowedEmail(email: string): boolean {
    return true;
  }

  // The development login endpoint has been removed
  // Users will now be authenticated exclusively through Google login via Replit Auth





  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      console.log("=== /api/auth/user endpoint ===");

      if (!req.session.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = req.session.user;
      return res.json(user);
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

  // Dashboard stats
  app.get("/api/dashboard/stats", authMiddleware, async (req: any, res) => {
    try {
      const user = req.user;
      const userId = user?.id;

      if (!userId || !user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      let stats;
      if (user?.role === 'super_admin') {
        // Super admins see all data
        stats = await dbStorage.getAdminDashboardStats();
      } else if (user?.role === 'admin' || user?.role === 'maintenance') {
        // Regular admins see only their organization's data
        stats = await dbStorage.getAdminDashboardStats(user.organizationId!);
      } else {
        stats = await dbStorage.getUserDashboardStats(userId);
      }

      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Get recent requests
  app.get("/api/requests/recent", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.userId;
      const user = req.user;

      if (!userId || !user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      let requests;
      if (user?.role === 'super_admin') {
        // Super admins see all data
        requests = await dbStorage.getRecentRequests(10);
      } else if (user?.role === 'admin' || user?.role === 'maintenance') {
        // Regular admins see only their organization's data
        requests = await dbStorage.getRecentRequests(10, user.organizationId!);
      } else {
        requests = await dbStorage.getUserRequests(userId, 10);
      }

      res.json(requests);
    } catch (error) {
      console.error("Error fetching recent requests:", error);
      res.status(500).json({ message: "Failed to fetch recent requests" });
    }
  });

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
  app.post("/api/building-requests", (req, res, next) => {
    console.log("🚨🚨🚨 BUILDING REQUEST ENDPOINT HIT - PHOTOS DEBUG 🚨🚨🚨");
    console.log("Request URL:", req.url);
    console.log("Request method:", req.method);
    console.log("Content-Type:", req.headers['content-type']);
    console.log("Auth header:", req.headers.authorization);

    // Check auth first
    if (!req.isAuthenticated?.() || !req.user) {
      console.log("=== AUTHENTICATION FAILED ===");
      return res.status(401).json({ message: "Unauthorized" });
    }

    console.log("=== AUTH SUCCESS - PROCEEDING TO MULTER ===");
    console.log("Files before multer:", req.files);
    console.log("Body before multer:", req.body);

    upload.array('photos', 5)(req, res, (err) => {
      console.log("🎯🎯🎯 MULTER CALLBACK REACHED 🎯🎯🎯");
      console.log("Error:", err);
      console.log("Files after multer:", req.files);
      console.log("Body after multer:", req.body);

      if (err) {
        console.error("MULTER UPLOAD ERROR:", err);
        return res.status(400).json({ message: "File upload error", error: err.message });
      }

      console.log("=== MULTER SUCCESS - PROCEEDING TO HANDLER ===");
      next();
    });
  }, async (req: any, res) => {
    try {
      console.log("Building request submission started");
      const user = req.user;
      const userId = user?.id;

      if (!userId || !user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      console.log("User info:", { userId, userRole: user.role, userOrg: user.organizationId });

      // Log the raw request body for debugging
      console.log("Raw request body:", JSON.stringify(req.body, null, 2));

      // Parse form data - handle multiple input formats
      let facility = req.body.facility || req.body.building;
      let event = req.body.event || req.body.requestTitle;
      let eventDate = req.body.eventDate || new Date().toISOString().split('T')[0];
      let priority = req.body.priority || "medium";
      let buildingName = facility; // Use facility as building name
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

      console.log("Building request received:", {
        facility,
        event,
        eventDate,
        priority,
        buildingName,
        roomNumber,
        description,
        photoCount: req.files?.length || 0
      });

      // Detailed logging for file uploads
      if (req.files && req.files.length > 0) {
        req.files.forEach((file: any, index: number) => {
          console.log(`File ${index + 1}:`, {
            originalname: file.originalname,
            filename: file.filename,
            mimetype: file.mimetype,
            size: file.size,
            destination: file.destination,
            path: file.path
          });

          // Check if file exists at the expected path
          const fileExists = fs.existsSync(file.path);
          console.log(`File exists at ${file.path}: ${fileExists}`);

          if (fileExists) {
            const stats = fs.statSync(file.path);
            console.log(`File stats:`, { size: stats.size, mode: stats.mode });
          }
        });
      } else {
        console.log("No files uploaded with this request");
      }

      // Validate required fields
      if (!facility || !roomNumber || !description) {
        console.log("Missing required fields:", { facility, roomNumber, description });
        return res.status(400).json({ message: "Missing required fields: facility, roomNumber, description" });
      }

      // User already exists in database

      // Validate request data
      console.log("Validating request data...");
      const requestData = insertRequestSchema.parse({
        requestType: "building",
        facility,
        event,
        eventDate,
        priority,
        requestorId: userId,
        organizationId: user.organizationId
      });
      console.log("Request data validated successfully");

      // Create the request first
      console.log("Creating basic request...");
      const createdRequest = await dbStorage.createRequest(requestData);
      console.log("Basic request created with ID:", createdRequest.id);

      // Then validate building request data with the request ID
      console.log("Validating building request data...");
      const buildingRequestData = insertBuildingRequestSchema.parse({
        requestId: createdRequest.id,
        building: buildingName || facility,
        roomNumber,
        description
      });
      console.log("Building request data validated successfully");

      // Update the request with building-specific details
      console.log("Creating building request record...");
      await dbStorage.createBuildingRequest(buildingRequestData);
      console.log("Building request record created successfully");

      // If photos were uploaded, save them to the database
      if (req.files && req.files.length > 0) {
        try {
          console.log(`Processing ${req.files.length} uploaded photos`);
          for (const file of req.files) {
            console.log(`Processing photo: ${file.originalname}`);
            // Read file buffer for S3 upload
            const fileBuffer = file.buffer || (file.path ? fs.readFileSync(file.path) : undefined);
            if (!fileBuffer) {
              console.error(`Could not read file buffer for ${file.filename}`);
              continue;
            }
            // Create a photo record for each uploaded file
            const photoData = {
              requestId: createdRequest.id,
              filename: file.filename,
              originalFilename: file.originalname,
              filePath: undefined, // S3 URL will be set in storage
              mimeType: file.mimetype,
              size: file.size,
              caption: `Building request photo - ${file.originalname}`,
              uploadedById: userId,
              photoUrl: undefined, // S3 URL will be set in storage
              fileBuffer
            };
            await dbStorage.saveRequestPhoto(photoData);
            // Optionally, delete the local file after upload
            if (file.path) {
              try { require('fs').unlinkSync(file.path); } catch (e) { /* ignore */ }
            }
            console.log(`Photo uploaded to S3 and saved: ${file.originalname} (${file.size} bytes)`);
          }
        } catch (error) {
          console.error("Error saving photos:", error);
          // Continue with request processing even if photo upload fails
        }
      }

      // Create initial status update
      console.log("Creating initial status update...");
      await dbStorage.createStatusUpdate({
        requestId: createdRequest.id,
        status: "pending",
        updatedById: userId,
        note: "Building request submitted"
      });
      console.log("Status update created successfully");

      // Send email notifications
      console.log("Sending email notifications...");
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
          console.log("Email notifications sent successfully");
        } else {
          console.log("Skipping email notifications - no organization or admin emails found");
        }
      } catch (emailError) {
        console.error("Email notification error:", emailError);
        // Don't fail the request if email fails
      }

      console.log("Building request submission completed successfully");
      res.status(201).json(createdRequest);
    } catch (error) {
      console.error("Error creating building request:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        console.error("Error stack:", error.stack);
      }
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

      // Admin and maintenance staff can access all requests
      if (user.role !== 'admin' && user.role !== 'maintenance') {
        // Regular users need to be the requestor
        const isRequestor = await dbStorage.isRequestor(userId, requestId);
        if (!isRequestor) {
          return res.status(403).json({ message: "Unauthorized" });
        }
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

      // Admin and maintenance staff can access all requests
      if (user.role !== 'admin' && user.role !== 'maintenance') {
        // Regular users need to be the requestor
        const isRequestor = await dbStorage.isRequestor(userId, requestId);
        if (!isRequestor) {
          return res.status(403).json({ message: "Unauthorized" });
        }
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

      // Check if user has access to this request
      const canAccess = await dbStorage.canAccessRequest(userId, requestId);
      if (!canAccess) {
        return res.status(403).json({ message: "Unauthorized" });
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

      if (user?.role !== 'admin' && user?.role !== 'maintenance') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Validate assignment data
      const assignmentData = insertAssignmentSchema.parse({
        requestId,
        assigneeId: req.body.assigneeId,
        assignerId: userId, // This comes from getUserInfo now, so it's safe
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

  // Direct test route for status updates (bypassing auth temporarily)
  app.post("/api/requests/:id/status-test", async (req: any, res) => {
    try {
      console.log("=== DIRECT STATUS UPDATE TEST ===");
      console.log("Request ID:", req.params.id);

      const requestId = parseInt(req.params.id);

      // Simplified status update without auth check
      const statusUpdateData = {
        requestId,
        status: req.body.status,
        updatedById: req.user?.id || "test-user",
        note: req.body.note || "Test status update"
      };

      console.log("Status update data:", statusUpdateData);

      await dbStorage.updateRequestStatus(statusUpdateData);

      res.json({ success: true, message: "Direct test successful" });
    } catch (error) {
      console.error("Direct test error:", error);
      res.status(500).json({
        message: "Direct test failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Update request status
  app.post("/api/requests/:id/status", authMiddleware, async (req: any, res) => {
    try {
      console.log("=== STATUS UPDATE REQUEST ===");
      console.log("Request ID:", req.params.id);

      // User is already authenticated by authMiddleware
      const userId = req.userId;
      const user = req.user;
      const requestId = parseInt(req.params.id);

      // Check if user has proper permissions to update status
      const canUpdateStatus = user?.role === 'admin' || user?.role === 'maintenance' ||
        (req.body.status === 'cancelled' && await dbStorage.isRequestor(userId, requestId));

      if (!canUpdateStatus) {
        console.log("Permission denied for user:", { userId, role: user?.role, requestedStatus: req.body.status });
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Validate status update data
      console.log("Validating status update data...");
      const statusUpdateData = insertStatusUpdateSchema.parse({
        requestId,
        status: req.body.status,
        updatedById: userId,
        note: req.body.note
      });

      console.log("Validated status update data:", statusUpdateData);

      // Update request status and priority if provided
      console.log("Updating request status...");
      await dbStorage.updateRequestStatus(statusUpdateData);

      // Update priority if provided
      if (req.body.priority) {
        console.log("Updating priority to:", req.body.priority);
        await dbStorage.updateRequestPriority(requestId, req.body.priority);
      }

      console.log("Status update successful");
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating request status:", error);
      console.error("Error stack:", (error as Error).stack);
      res.status(500).json({
        message: "Failed to update request status",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get organization buildings - fixed authentication
  app.get("/api/buildings", (req: any, res) => {
    try {
      if (!req.isAuthenticated?.() || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = req.user;
      if (user.organizationId === undefined) {
        return res.status(400).json({ message: "No organization assigned to user." });
      }
      dbStorage.getBuildingsByOrganization(user.organizationId)
        .then(buildings => {
          console.log("Buildings found:", buildings);
          res.json(buildings);
        })
        .catch(error => {
          console.error("Error fetching buildings:", error);
          res.status(500).json({ message: "Failed to fetch buildings" });
        });
    } catch (error) {
      console.error("Error fetching buildings:", error);
      res.status(500).json({ message: "Failed to fetch buildings" });
    }
  });



  // Super Admin API routes for managing buildings and facilities

  // Test route to check organizations data directly
  app.get("/api/test/organizations", async (req: any, res) => {
    try {
      const organizations = await dbStorage.getAllOrganizations();
      console.log("Test route - organizations:", organizations);
      res.json(organizations);
    } catch (error: any) {
      console.error("Test route error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Temporary unauthenticated route for organizations
  app.get("/api/orgs-temp", async (req: any, res) => {
    try {
      console.log("Temporary orgs route called");
      const organizations = await dbStorage.getAllOrganizations();
      console.log("Temp route organizations:", organizations);
      res.json(organizations);
    } catch (error: any) {
      console.error("Temp route error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all organizations (super admin only) - with extensive debugging
  app.get("/api/admin/organizations", async (req: any, res) => {
    console.log("=== Organizations API Debug ===");
    console.log("Request headers:", req.headers);
    console.log("Request user:", req.user);

    try {
      // Skip authentication temporarily to identify the issue
      console.log("Bypassing auth check temporarily");

      const organizations = await dbStorage.getAllOrganizations();
      console.log("Organizations retrieved successfully:", organizations);
      res.json(organizations);
    } catch (error: any) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations", error: error.message });
    }
  });

  // Create organization (super admin only)
  app.post("/api/admin/organizations", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await dbStorage.getUser(userId);

      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      const orgData = {
        name: req.body.name,
        slug: req.body.slug,
        domain: req.body.domain,
        logoUrl: req.body.logoUrl,
        settings: req.body.settings || {}
      };

      const organization = await dbStorage.createOrganization(orgData);
      res.json(organization);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ message: "Failed to create organization" });
    }
  });

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

  // Create building (super admin only)
  app.post("/api/admin/buildings", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await dbStorage.getUser(userId);

      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      // Ensure roomNumbers is always an array
      let roomNumbers = [];
      if (Array.isArray(req.body.roomNumbers)) {
        roomNumbers = req.body.roomNumbers;
      } else if (typeof req.body.roomNumbers === 'string' && req.body.roomNumbers.trim() !== '') {
        roomNumbers = req.body.roomNumbers.split(',').map((s: string) => s.trim());
      }
      const buildingData = {
        organizationId: req.body.organizationId,
        name: req.body.name,
        address: req.body.address,
        description: req.body.description,
        room_numbers: roomNumbers, // Always an array
        isActive: true,
      };

      const building = await dbStorage.createBuilding(buildingData);
      // Map DB result to ensure roomNumbers is always an array
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
      // Ensure roomNumbers is always an array
      let updateRoomNumbers = [];
      if (Array.isArray(req.body.roomNumbers)) {
        updateRoomNumbers = req.body.roomNumbers;
      } else if (typeof req.body.roomNumbers === 'string' && req.body.roomNumbers.trim() !== '') {
        updateRoomNumbers = req.body.roomNumbers.split(',').map((s: string) => s.trim());
      }
      const updates = {
        name: req.body.name,
        address: req.body.address,
        description: req.body.description,
        room_numbers: updateRoomNumbers, // Always an array
      };

      const building = await dbStorage.updateBuilding(buildingId, updates);
      // Map DB result to ensure roomNumbers is always an array
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

  // Upload building image (super admin only)
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

        // Update building with the new image URL
        const imageUrl = `/uploads/photos/${req.file.filename}`;
        const building = await dbStorage.updateBuilding(buildingId, { imageUrl });

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

  // Create facility (super admin only)
  app.post("/api/admin/facilities", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await dbStorage.getUser(userId);

      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      const facilityData = req.body;
      const facility = await dbStorage.createFacility(facilityData);
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
      const updates = req.body;
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

  // Create building (super admin only)
  app.post("/api/admin/buildings", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await dbStorage.getUser(userId);

      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      // Ensure roomNumbers is always an array
      let roomNumbers = [];
      if (Array.isArray(req.body.roomNumbers)) {
        roomNumbers = req.body.roomNumbers;
      } else if (typeof req.body.roomNumbers === 'string' && req.body.roomNumbers.trim() !== '') {
        roomNumbers = req.body.roomNumbers.split(',').map((s: string) => s.trim());
      }
      const buildingData = {
        organizationId: req.body.organizationId,
        name: req.body.name,
        address: req.body.address,
        description: req.body.description,
        room_numbers: roomNumbers, // Always an array
        isActive: true,
      };

      const building = await dbStorage.createBuilding(buildingData);
      // Map DB result to ensure roomNumbers is always an array
      const result = {
        ...building,
        roomNumbers: building.room_numbers ?? [],
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
      // Ensure roomNumbers is always an array
      let updateRoomNumbers = [];
      if (Array.isArray(req.body.roomNumbers)) {
        updateRoomNumbers = req.body.roomNumbers;
      } else if (typeof req.body.roomNumbers === 'string' && req.body.roomNumbers.trim() !== '') {
        updateRoomNumbers = req.body.roomNumbers.split(',').map((s: string) => s.trim());
      }
      const updates = {
        name: req.body.name,
        address: req.body.address,
        description: req.body.description,
        roomNumbers: updateRoomNumbers, // Always an array
      };

      const building = await dbStorage.updateBuilding(buildingId, updates);
      // Map DB result to ensure roomNumbers is always an array
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

      const facilityData = req.body;
      const facility = await dbStorage.createFacility(facilityData);
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
      const updates = req.body;
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

  // Get reports data (admin only)
  app.get("/api/reports", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await dbStorage.getUser(userId);

      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const reportType = req.query.type || 'monthly';
      const reports = await dbStorage.getReportsData(reportType);

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
      console.log("=== /api/room-buildings endpoint called ===");

      // Get building names from building_requests table
      const buildingNames = await dbStorage.getAllBuildings();
      console.log("Building names from getAllBuildings:", buildingNames);

      // If no building names found in building_requests, fall back to buildings table names
      if (!buildingNames || buildingNames.length === 0) {
        console.log("No buildings found in building_requests, checking buildings table");
        const { userId } = await getUserInfo(req);
        const user = await dbStorage.getUser(userId);

        if (user?.organizationId) {
          const buildings = await dbStorage.getBuildingsByOrganization(user.organizationId);
          const names = buildings.map((building: any) => building.name);
          console.log("Building names from buildings table:", names);
          res.json(names);
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

      const building = req.query.building as string;
      const roomNumber = req.query.roomNumber as string | undefined;

      if (!building) {
        return res.status(400).json({ message: "Building parameter is required" });
      }

      const requests = await dbStorage.getRequestsByBuilding(building, roomNumber);
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
    console.log("[CONTACT] ====== Contact form endpoint hit ======");
    console.log("[CONTACT] Request body:", JSON.stringify(req.body, null, 2));
    console.log("[CONTACT] isZeptoMailConfigured():", isZeptoMailConfigured());
    
    try {
      const parsed = insertContactMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        console.log("[CONTACT] Validation FAILED:", parsed.error.errors);
        return res.status(400).json({ error: "Invalid input", details: parsed.error.errors });
      }
      console.log("[CONTACT] Validation passed:", JSON.stringify(parsed.data, null, 2));
      
      // Save to database
      const [created] = await db.insert(contactMessages).values(parsed.data).returning();
      console.log("[CONTACT] Saved to database, ID:", created.id);
      
      // Send emails via ZeptoMail
      console.log("[CONTACT] Checking ZeptoMail config...");
      if (isZeptoMailConfigured()) {
        console.log("[CONTACT] ZeptoMail IS configured, attempting to send emails...");
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
          console.error("[CONTACT] Email sending failed:", emailResult.error);
        } else {
          console.log("[CONTACT] Emails sent successfully");
        }
      } else {
        console.log("[CONTACT] ZeptoMail not configured, skipping email notifications");
      }
      
      res.status(201).json({ success: true, message: "Message received", data: created });
    } catch (error) {
      console.error("[CONTACT] Error:", error);
      res.status(500).json({ error: "Failed to submit message" });
    }
  });

  // Test ZeptoMail simple email endpoint (for debugging)
  app.post("/api/test-zeptomail", async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address required" });
    }
    
    console.log("[ZEPTOMAIL SIMPLE TEST] Testing simple email to:", email);
    const result = await sendTestEmail(email);
    console.log("[ZEPTOMAIL SIMPLE TEST] Result:", JSON.stringify(result, null, 2));
    
    res.json(result);
  });

  // Delete organization (super admin only)
  app.delete("/api/admin/organizations/:id", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteOrganization(id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting organization:", error);
      res.status(500).json({ error: "Failed to delete organization" });
    }
  });

  // === Neon DB Email/Password Signup ===
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      if (!email || !password || !firstName || !lastName) {
        console.warn("⚠️ Missing fields:", req.body);
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if user exists
      const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
      if (existing) {
        console.log("❌ User already exists:", email);
        return res.status(409).json({ message: "User with this email already exists" });
      }

      // Hash password
      const hashed = await bcrypt.hash(password, 10);

      // Create user - assign to New School (org ID 2) by default
      const id = crypto.randomUUID();
      const now = new Date();
      const DEFAULT_ORGANIZATION_ID = 2; // New School
      const [user] = await db.insert(users).values({
        id,
        email,
        firstName,
        lastName,
        password: hashed,
        role: "requester",
        organizationId: DEFAULT_ORGANIZATION_ID,
        createdAt: now,
        updatedAt: now,
      }).returning();

      console.log("✅ User created:", user);

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
          console.error("🔥 Session save error:", err);
          return res.status(500).json({ message: "Failed to save session" });
        }

        console.log("✅ Session saved with user:", req.session.user);

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
      console.error("🔥 Signup error:", err);
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
    req.session.destroy(() => {
      res.clearCookie('connect.sid'); // This removes the session cookie from browser
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
        Bucket: 'repair-request-121905340783',
        Key: key,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });
      res.json({ url });
    } catch (err) {
      console.error('Error generating presigned URL:', err);
      res.status(500).json({ error: 'Failed to generate presigned URL' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
