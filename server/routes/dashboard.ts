import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { storage as dbStorage } from '../storage';

const router = Router();

// ============================================================================
// Dashboard Routes
// ============================================================================

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics based on user role
 * - Super admin: all stats across all organizations
 * - Admin/Maintenance: stats for their organization
 * - Regular user: their personal stats
 */
router.get('/dashboard/stats', authMiddleware, async (req: any, res) => {
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
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
});

// ============================================================================
// Analytics & Reports Routes
// ============================================================================

/**
 * GET /api/reports
 * Get reports data (admin/super_admin only)
 * Supports query parameter: type (default: 'monthly')
 * - Super admin: reports for all organizations
 * - Admin: reports for their organization only
 */
router.get('/reports', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await dbStorage.getUser(userId);

    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const reportType = req.query.type || 'monthly';

    // Get organization ID for filtering (null for super_admin to get all)
    const orgId = user.role === 'super_admin' ? undefined : user.organizationId ?? undefined;

    const reports = await dbStorage.getReportsData(reportType, orgId);

    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports data:', error);
    res.status(500).json({ message: 'Failed to fetch reports data' });
  }
});

export default router;
