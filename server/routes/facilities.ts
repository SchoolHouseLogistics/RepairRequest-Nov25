import { Router } from 'express';
import { authMiddleware, AuthenticatedUser } from '../middleware/auth';
import { storage as dbStorage } from '../storage';
import { z } from 'zod';

const router = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

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

// ============================================
// PUBLIC FACILITY ROUTES
// ============================================

/**
 * GET /api/facilities
 * Get all facilities for the authenticated user's organization
 */
router.get("/facilities", authMiddleware, async (req: any, res) => {
  try {
    const user = req.user as AuthenticatedUser;
    const facilities = await dbStorage.getFacilitiesByOrganization(user.organizationId);
    res.json(facilities);
  } catch (error) {
    console.error("Error fetching facilities:", error);
    res.status(500).json({ message: "Failed to fetch facilities" });
  }
});

// ============================================
// ADMIN FACILITY ROUTES (Super Admin Only)
// ============================================

/**
 * POST /api/admin/facilities
 * Create a new facility (super admin only)
 */
router.post("/admin/facilities", authMiddleware, async (req: any, res) => {
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

/**
 * PATCH /api/admin/facilities/:id
 * Update a facility (super admin only)
 */
router.patch("/admin/facilities/:id", authMiddleware, async (req: any, res) => {
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

/**
 * DELETE /api/admin/facilities/:id
 * Delete a facility (super admin only)
 */
router.delete("/admin/facilities/:id", authMiddleware, async (req: any, res) => {
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

/**
 * GET /api/admin/facilities/:orgId
 * Get facilities for a specific organization (super admin only)
 */
router.get("/admin/facilities/:orgId", authMiddleware, async (req: any, res) => {
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

export default router;
