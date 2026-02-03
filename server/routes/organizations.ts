import { Router } from 'express';
import { authMiddleware, AuthenticatedUser } from '../middleware/auth';
import { storage as dbStorage } from '../storage';

const router = Router();

// ============================================
// ORGANIZATION FEATURE ROUTES
// ============================================

/**
 * GET /api/organization-features
 * Get organization features for the current user's organization
 */
router.get("/organization-features", authMiddleware, async (req: any, res) => {
  try {
    const user = req.user as AuthenticatedUser;

    if (!user || !user.organizationId) {
      return res.status(400).json({ message: "No organization assigned to user" });
    }

    const features = await dbStorage.getOrganizationFeatures(user.organizationId);

    // Return default values if no features record exists
    res.json({
      techRequestsEnabled: features?.techRequestsEnabled ?? false,
      buildingRequestsEnabled: features?.buildingRequestsEnabled ?? true,
      facilitiesRequestsEnabled: features?.facilitiesRequestsEnabled ?? true
    });
  } catch (error) {
    console.error("Error fetching organization features:", error);
    res.status(500).json({ message: "Failed to fetch organization features" });
  }
});

// ============================================
// ORGANIZATION MANAGEMENT ROUTES (Super Admin Only)
// ============================================

/**
 * GET /api/admin/organizations
 * Get all organizations (super admin only)
 */
router.get("/admin/organizations", authMiddleware, async (req, res) => {
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

/**
 * POST /api/admin/organizations
 * Create a new organization (super admin only)
 */
router.post("/admin/organizations", authMiddleware, async (req, res) => {
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

/**
 * PATCH /api/admin/organizations/:id
 * Update an organization (super admin only)
 */
router.patch("/admin/organizations/:id", authMiddleware, async (req, res) => {
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

/**
 * DELETE /api/admin/organizations/:id
 * Delete an organization (super admin only)
 */
router.delete("/admin/organizations/:id", authMiddleware, async (req: any, res) => {
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

// ============================================
// ORGANIZATION FEATURE MANAGEMENT (Super Admin Only)
// ============================================

/**
 * GET /api/admin/organizations/:id/features
 * Get organization features (super admin only)
 */
router.get("/admin/organizations/:id/features", authMiddleware, async (req: any, res) => {
  try {
    const user = req.user as any;

    if (user.role !== 'super_admin') {
      return res.status(403).json({ error: "Access denied. Super admin required." });
    }

    const organizationId = parseInt(req.params.id);
    if (isNaN(organizationId)) {
      return res.status(400).json({ error: "Invalid organization ID" });
    }

    // Verify organization exists
    const organization = await dbStorage.getOrganization(organizationId);
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    const features = await dbStorage.getOrganizationFeatures(organizationId);

    res.json({
      organizationId,
      organizationName: organization.name,
      features: {
        techRequestsEnabled: features?.techRequestsEnabled ?? false,
        buildingRequestsEnabled: features?.buildingRequestsEnabled ?? true,
        facilitiesRequestsEnabled: features?.facilitiesRequestsEnabled ?? true
      }
    });
  } catch (error) {
    console.error("Error fetching organization features:", error);
    res.status(500).json({ error: "Failed to fetch organization features" });
  }
});

/**
 * PUT /api/admin/organizations/:id/features
 * Update organization features (super admin only)
 */
router.put("/admin/organizations/:id/features", authMiddleware, async (req: any, res) => {
  try {
    const user = req.user as any;

    if (user.role !== 'super_admin') {
      return res.status(403).json({ error: "Access denied. Super admin required." });
    }

    const organizationId = parseInt(req.params.id);
    if (isNaN(organizationId)) {
      return res.status(400).json({ error: "Invalid organization ID" });
    }

    // Verify organization exists
    const organization = await dbStorage.getOrganization(organizationId);
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    const { techRequestsEnabled, buildingRequestsEnabled, facilitiesRequestsEnabled } = req.body;

    // Validate at least one feature flag is provided
    if (techRequestsEnabled === undefined && buildingRequestsEnabled === undefined && facilitiesRequestsEnabled === undefined) {
      return res.status(400).json({ error: "At least one feature flag must be provided" });
    }

    // Build update object with only provided fields
    const updateData: {
      techRequestsEnabled?: boolean;
      buildingRequestsEnabled?: boolean;
      facilitiesRequestsEnabled?: boolean;
    } = {};

    if (typeof techRequestsEnabled === 'boolean') {
      updateData.techRequestsEnabled = techRequestsEnabled;
    }
    if (typeof buildingRequestsEnabled === 'boolean') {
      updateData.buildingRequestsEnabled = buildingRequestsEnabled;
    }
    if (typeof facilitiesRequestsEnabled === 'boolean') {
      updateData.facilitiesRequestsEnabled = facilitiesRequestsEnabled;
    }

    const updatedFeatures = await dbStorage.upsertOrganizationFeatures(organizationId, updateData);

    res.json({
      organizationId,
      organizationName: organization.name,
      features: {
        techRequestsEnabled: updatedFeatures.techRequestsEnabled,
        buildingRequestsEnabled: updatedFeatures.buildingRequestsEnabled,
        facilitiesRequestsEnabled: updatedFeatures.facilitiesRequestsEnabled
      },
      message: "Organization features updated successfully"
    });
  } catch (error) {
    console.error("Error updating organization features:", error);
    res.status(500).json({ error: "Failed to update organization features" });
  }
});

export default router;
