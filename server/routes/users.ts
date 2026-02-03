import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { isAuthenticated } from '../subAuth';
import { storage as dbStorage } from '../storage';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import z from 'zod';

const router = Router();

// Bulk user import schema
const bulkSchema = z.array(
  z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    role: z.enum(["requester", "maintenance", "admin", "super_admin"]),
    organizationId: z.number().nullable().optional(),
  })
);

// ============================================
// USER QUERY ROUTES
// ============================================

/**
 * GET /api/users/maintenance
 * Get maintenance staff for the current organization
 */
router.get("/maintenance", authMiddleware, async (req: any, res) => {
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

/**
 * GET /api/admin/users
 * Get all users (super admin only)
 */
router.get("/admin/users", isAuthenticated, async (req: any, res) => {
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

// ============================================
// USER MANAGEMENT ROUTES (Super Admin Only)
// ============================================

/**
 * POST /api/admin/users
 * Create user manually (super admin only)
 */
router.post("/admin/users", isAuthenticated, async (req: any, res) => {
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

/**
 * POST /api/admin/users/bulk
 * Bulk import users from CSV (super admin only)
 */
router.post("/admin/users/bulk", isAuthenticated, async (req: any, res) => {
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

/**
 * PATCH /api/admin/users/:userId/role
 * Update user role (super admin only)
 */
router.patch("/admin/users/:userId/role", isAuthenticated, async (req: any, res) => {
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

/**
 * PATCH /api/admin/users/:userId/organization
 * Update user organization (super admin only)
 */
router.patch("/admin/users/:userId/organization", isAuthenticated, async (req: any, res) => {
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

/**
 * DELETE /api/admin/users/:userId
 * Delete user (super admin only)
 */
router.delete("/admin/users/:userId", isAuthenticated, async (req: any, res) => {
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

export default router;
