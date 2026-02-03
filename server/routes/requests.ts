import { Router } from "express";
import { storage as dbStorage } from "../storage";
import { sendRequestNotificationEmails, sendLaborRequestNotificationEmails } from "../emailService";
import multer from "multer";
import path from "path";
import fs from "fs";
import z from "zod";
import {
  insertRequestSchema,
  insertRequestItemsSchema,
  insertBuildingRequestSchema,
  insertTechRequestSchema,
  insertMessageSchema,
  insertAssignmentSchema,
  insertStatusUpdateSchema,
  insertRequestPhotoSchema,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";

// Type for authenticated user from session
type AuthenticatedUser = {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  organizationId?: number;
};

// Authentication middleware
const authMiddleware = (req: any, res: any, next: any) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Set req.user from session
  req.user = req.session.user;
  next();
};

// Helper function to get user info from auth
const getUserInfo = async (req: any) => {
  if (!req.session.user || !req.user) {
    return { userId: undefined, user: undefined };
  }

  return { userId: req.user.id, user: req.user };
};

// Set up multer storage configuration
const uploadDir = path.resolve(process.cwd(), 'uploads/photos');

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

console.log(`Upload directory resolved to: ${uploadDir}`);

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

const router = Router();

// ============================================================================
// Creation Routes
// ============================================================================

// POST /api/requests - Create facilities request (FACILITIES ONLY)
router.post("/", authMiddleware, async (req: any, res) => {
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

// POST /api/building-requests - Create building request with photo upload
router.post("/building-requests", authMiddleware, (req: any, res, next) => {
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

// POST /api/tech-requests - Create tech request
router.post("/tech-requests", authMiddleware, async (req: any, res) => {
  try {
    const user = req.user as AuthenticatedUser;
    const userId = user?.id;

    if (!userId || !user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if tech requests are enabled for this organization
    if (user.organizationId) {
      const isEnabled = await dbStorage.isTechRequestsEnabled(user.organizationId);
      if (!isEnabled) {
        return res.status(403).json({
          message: "Tech requests are not enabled for your organization",
          code: "TECH_REQUESTS_DISABLED"
        });
      }
    }

    // Parse and validate tech request fields
    const {
      category,
      deviceType,
      deviceLocation,
      assetTag,
      description,
      errorMessage,
      stepsToReproduce,
      urgencyReason,
      event,
      eventDate,
      priority
    } = req.body;

    // Validate required fields
    if (!category || !description) {
      return res.status(400).json({
        message: "Missing required fields: category, description"
      });
    }

    // Create the base request
    const requestData = insertRequestSchema.parse({
      requestType: "tech",
      facility: category, // Use category as facility for consistency
      event: event || `Tech Support: ${category}`,
      eventDate: eventDate || new Date().toISOString().split('T')[0],
      priority: priority || "medium",
      requestorId: userId,
      organizationId: user.organizationId
    });

    const createdRequest = await dbStorage.createRequest(requestData);

    // Create the tech request details
    const techRequestData = insertTechRequestSchema.parse({
      requestId: createdRequest.id,
      category,
      deviceType: deviceType || null,
      deviceLocation: deviceLocation || null,
      assetTag: assetTag || null,
      description,
      errorMessage: errorMessage || null,
      stepsToReproduce: stepsToReproduce || null,
      urgencyReason: urgencyReason || null
    });

    await dbStorage.createTechRequest(techRequestData);

    // Create initial status update
    await dbStorage.createStatusUpdate({
      requestId: createdRequest.id,
      status: "pending",
      updatedById: userId,
      note: `Tech request submitted: ${category}`
    });

    // Send email notifications
    try {
      const organization = user.organizationId !== undefined
        ? await dbStorage.getOrganization(user.organizationId)
        : undefined;
      const adminEmails = user.organizationId !== undefined
        ? await dbStorage.getOrganizationAdminEmails(user.organizationId)
        : [];

      if (organization && adminEmails.length > 0) {
        await sendRequestNotificationEmails({
          requestId: createdRequest.id,
          title: `Tech Support: ${category}`,
          building: deviceLocation || 'Not specified',
          roomNumber: '',
          description,
          priority: priority || 'medium',
          requesterName: `${user.firstName} ${user.lastName}`,
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
    console.error("Error creating tech request:", error);
    res.status(500).json({
      message: "Failed to create tech request",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// ============================================================================
// Query Routes
// ============================================================================

// GET /api/requests/my - Get user's requests by status
router.get("/my", authMiddleware, async (req: any, res) => {
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

// GET /api/requests/recent - Get recent requests
router.get("/recent", authMiddleware, async (req: any, res) => {
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

// GET /api/requests/assigned - Get requests assigned to maintenance staff
router.get("/assigned", authMiddleware, async (req: any, res) => {
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

// GET /api/requests/all - Get all requests (admin/maintenance only)
router.get("/all", authMiddleware, async (req: any, res) => {
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

// GET /api/requests/:id - Get request details
router.get("/:id", authMiddleware, async (req: any, res) => {
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

// ============================================================================
// Timeline Routes
// ============================================================================

// GET /api/requests/:id/timeline - Get request timeline
router.get("/:id/timeline", authMiddleware, async (req: any, res) => {
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

// ============================================================================
// Message Routes
// ============================================================================

// GET /api/requests/:id/messages - Get request messages
router.get("/:id/messages", authMiddleware, async (req: any, res) => {
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

// POST /api/requests/:id/messages - Add a message to a request
router.post("/:id/messages", authMiddleware, async (req: any, res) => {
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

// ============================================================================
// Assignment Routes
// ============================================================================

// POST /api/requests/:id/assign - Assign request to maintenance staff
router.post("/:id/assign", authMiddleware, async (req: any, res) => {
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

// ============================================================================
// Status Routes
// ============================================================================

// POST /api/requests/:id/status - Update request status
router.post("/:id/status", authMiddleware, async (req: any, res) => {
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

// ============================================================================
// Photo Routes
// ============================================================================

// POST /api/requests/:id/photos - Upload photo to request
router.post("/:id/photos", authMiddleware, upload.single('photo'), async (req: any, res) => {
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

// GET /api/requests/:id/photos - Get request photos
router.get("/:id/photos", authMiddleware, async (req: any, res) => {
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

export default router;
