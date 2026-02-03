import { Router } from 'express';
import { storage as dbStorage } from '../storage';
import { authMiddleware, getUserInfo } from '../middleware/auth';
import { z } from 'zod';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ObjectStorageService } from '../replit_integrations/object_storage';

const router = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

/**
 * Schema for creating a new building
 */
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

/**
 * Schema for updating an existing building
 */
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

// ============================================
// MULTER CONFIGURATION
// ============================================

/**
 * Set up multer storage for building image uploads
 */
const uploadDir = path.resolve(process.cwd(), 'uploads/photos');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

console.log(`Building image upload directory: ${uploadDir}`);

/**
 * Multer disk storage configuration
 */
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

/**
 * File filter to accept only images
 */
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const filetypes = /jpeg|jpg|png|gif/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(null, false);
};

/**
 * Configure multer upload with error handling
 */
const upload = multer({
  storage: multerStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB size limit
  }
});

// ============================================
// BUILDING CRUD ROUTES (SUPER ADMIN ONLY)
// ============================================

/**
 * POST /api/admin/buildings
 * Create a new building (super admin only)
 */
router.post("/admin/buildings", authMiddleware, async (req: any, res) => {
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

/**
 * PATCH /api/admin/buildings/:id
 * Update a building (super admin only)
 */
router.patch("/admin/buildings/:id", authMiddleware, async (req: any, res) => {
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

/**
 * DELETE /api/admin/buildings/:id
 * Delete a building (super admin only)
 */
router.delete("/admin/buildings/:id", authMiddleware, async (req: any, res) => {
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

// ============================================
// BUILDING QUERY ROUTES
// ============================================

/**
 * GET /api/buildings
 * Get all buildings for the current user's organization
 */
router.get("/buildings", authMiddleware, async (req: any, res) => {
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

/**
 * GET /api/admin/buildings/:orgId
 * Get buildings for a specific organization (super admin only)
 */
router.get("/admin/buildings/:orgId", authMiddleware, async (req: any, res) => {
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

// ============================================
// BUILDING IMAGE ROUTES
// ============================================

/**
 * POST /api/admin/buildings/:id/image
 * Upload building image (super admin only)
 * Uses appropriate storage based on environment:
 * - Replit Object Storage (if REPL_ID and PRIVATE_OBJECT_DIR exist)
 * - AWS S3 (if AWS credentials exist)
 * - Local filesystem (fallback)
 */
router.post("/admin/buildings/:id/image", authMiddleware, (req: any, res) => {
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

          const { Storage } = await import('@google-cloud/storage');
          const objectStorageClient = new Storage();
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

/**
 * DELETE /api/admin/buildings/:id/image
 * Delete building image (super admin only)
 */
router.delete("/admin/buildings/:id/image", authMiddleware, async (req: any, res) => {
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

// ============================================
// ROOM HISTORY ROUTES
// ============================================

/**
 * GET /api/room-buildings
 * Get all building names for room history dropdown
 * Filtered by user's organization (or all for super_admin)
 */
router.get("/room-buildings", authMiddleware, async (req: any, res) => {
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

/**
 * GET /api/room-history
 * Get room history - requests by building and optionally room number
 * Filtered by user's organization (or all for super_admin)
 */
router.get("/room-history", authMiddleware, async (req: any, res) => {
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

export default router;
