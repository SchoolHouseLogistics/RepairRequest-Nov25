import { db } from '../db';
import { requests, users, buildings, facilities, statusUpdates, messages, auditLogs } from '@shared/schema';
import { eq, and, isNull, sql, desc, gte, lte, count } from 'drizzle-orm';
import { REQUEST_STATUSES, PRIORITY_LEVELS } from '../constants';

export interface TimeSeriesDataPoint {
  date: string;
  count: number;
}

export interface RequestAnalytics {
  // Overview
  totalRequests: number;
  openRequests: number;
  completedRequests: number;
  avgCompletionTimeHours: number | null;

  // By status
  byStatus: Record<string, number>;

  // By priority
  byPriority: Record<string, number>;

  // By type
  byType: Record<string, number>;

  // Time series (last 30 days)
  requestsOverTime: TimeSeriesDataPoint[];
  completionsOverTime: TimeSeriesDataPoint[];
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number; // Users who created/updated requests in period
  usersByRole: Record<string, number>;
  topRequesters: Array<{
    userId: string;
    name: string;
    email: string;
    requestCount: number;
  }>;
  topAssignees: Array<{
    userId: string;
    name: string;
    email: string;
    completedCount: number;
    avgCompletionHours: number;
  }>;
}

export interface FacilityAnalytics {
  totalBuildings: number;
  totalFacilities: number;
  requestsByBuilding: Array<{
    building: string;
    requestCount: number;
    openCount: number;
  }>;
  requestsByFacility: Array<{
    facility: string;
    requestCount: number;
    openCount: number;
  }>;
}

export interface DashboardAnalytics {
  requests: RequestAnalytics;
  users: UserAnalytics;
  facilities: FacilityAnalytics;
  period: {
    startDate: string;
    endDate: string;
  };
}

class AnalyticsService {
  /**
   * Get comprehensive request analytics
   */
  async getRequestAnalytics(
    organizationId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<RequestAnalytics> {
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // Default 30 days

    // Build conditions
    const conditions = [
      eq(requests.organizationId, organizationId),
      isNull(requests.deletedAt),
    ];

    const periodConditions = [
      ...conditions,
      gte(requests.createdAt, start),
      lte(requests.createdAt, end),
    ];

    // Total counts
    const [totals] = await db
      .select({
        total: count(),
        open: sql<number>`COUNT(CASE WHEN ${requests.status} NOT IN ('completed', 'cancelled') THEN 1 END)`,
        completed: sql<number>`COUNT(CASE WHEN ${requests.status} = 'completed' THEN 1 END)`,
      })
      .from(requests)
      .where(and(...periodConditions));

    // By status
    const statusCounts = await db
      .select({
        status: requests.status,
        count: count(),
      })
      .from(requests)
      .where(and(...periodConditions))
      .groupBy(requests.status);

    const byStatus: Record<string, number> = {};
    for (const row of statusCounts) {
      byStatus[row.status || 'unknown'] = Number(row.count);
    }

    // By priority
    const priorityCounts = await db
      .select({
        priority: requests.priority,
        count: count(),
      })
      .from(requests)
      .where(and(...periodConditions))
      .groupBy(requests.priority);

    const byPriority: Record<string, number> = {};
    for (const row of priorityCounts) {
      byPriority[row.priority || 'medium'] = Number(row.count);
    }

    // By type
    const typeCounts = await db
      .select({
        type: requests.requestType,
        count: count(),
      })
      .from(requests)
      .where(and(...periodConditions))
      .groupBy(requests.requestType);

    const byType: Record<string, number> = {};
    for (const row of typeCounts) {
      byType[row.type || 'unknown'] = Number(row.count);
    }

    // Average completion time
    const [avgCompletion] = await db
      .select({
        avgHours: sql<number>`AVG(EXTRACT(EPOCH FROM (${statusUpdates.updatedAt} - ${requests.createdAt})) / 3600)`,
      })
      .from(requests)
      .innerJoin(statusUpdates, eq(requests.id, statusUpdates.requestId))
      .where(
        and(
          eq(requests.organizationId, organizationId),
          eq(statusUpdates.status, 'completed'),
          gte(requests.createdAt, start),
          lte(requests.createdAt, end)
        )
      );

    // Requests over time (daily)
    const requestsOverTime = await db
      .select({
        date: sql<string>`DATE(${requests.createdAt})::text`,
        count: count(),
      })
      .from(requests)
      .where(and(...periodConditions))
      .groupBy(sql`DATE(${requests.createdAt})`)
      .orderBy(sql`DATE(${requests.createdAt})`);

    // Completions over time
    const completionsOverTime = await db
      .select({
        date: sql<string>`DATE(${statusUpdates.updatedAt})::text`,
        count: count(),
      })
      .from(statusUpdates)
      .innerJoin(requests, eq(statusUpdates.requestId, requests.id))
      .where(
        and(
          eq(requests.organizationId, organizationId),
          eq(statusUpdates.status, 'completed'),
          gte(statusUpdates.updatedAt, start),
          lte(statusUpdates.updatedAt, end)
        )
      )
      .groupBy(sql`DATE(${statusUpdates.updatedAt})`)
      .orderBy(sql`DATE(${statusUpdates.updatedAt})`);

    return {
      totalRequests: Number(totals?.total || 0),
      openRequests: Number(totals?.open || 0),
      completedRequests: Number(totals?.completed || 0),
      avgCompletionTimeHours: avgCompletion?.avgHours ? Math.round(avgCompletion.avgHours * 10) / 10 : null,
      byStatus,
      byPriority,
      byType,
      requestsOverTime: requestsOverTime.map(r => ({ date: r.date, count: Number(r.count) })),
      completionsOverTime: completionsOverTime.map(r => ({ date: r.date, count: Number(r.count) })),
    };
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(
    organizationId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<UserAnalytics> {
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total users
    const [userCounts] = await db
      .select({
        total: count(),
      })
      .from(users)
      .where(
        and(
          eq(users.organizationId, organizationId),
          isNull(users.deletedAt)
        )
      );

    // Users by role
    const roleCounts = await db
      .select({
        role: users.role,
        count: count(),
      })
      .from(users)
      .where(
        and(
          eq(users.organizationId, organizationId),
          isNull(users.deletedAt)
        )
      )
      .groupBy(users.role);

    const usersByRole: Record<string, number> = {};
    for (const row of roleCounts) {
      usersByRole[row.role] = Number(row.count);
    }

    // Active users (created requests in period)
    const [activeCount] = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${requests.requestorId})`,
      })
      .from(requests)
      .where(
        and(
          eq(requests.organizationId, organizationId),
          gte(requests.createdAt, start),
          lte(requests.createdAt, end)
        )
      );

    // Top requesters
    const topRequestersData = await db
      .select({
        userId: requests.requestorId,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        count: count(),
      })
      .from(requests)
      .innerJoin(users, eq(requests.requestorId, users.id))
      .where(
        and(
          eq(requests.organizationId, organizationId),
          gte(requests.createdAt, start),
          lte(requests.createdAt, end)
        )
      )
      .groupBy(requests.requestorId, users.firstName, users.lastName, users.email)
      .orderBy(desc(count()))
      .limit(10);

    const topRequesters = topRequestersData.map(r => ({
      userId: r.userId!,
      name: `${r.firstName || ''} ${r.lastName || ''}`.trim() || 'Unknown',
      email: r.email || '',
      requestCount: Number(r.count),
    }));

    // Top assignees (most completions)
    const topAssigneesData = await db
      .select({
        userId: statusUpdates.updatedById,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        count: count(),
        avgHours: sql<number>`AVG(EXTRACT(EPOCH FROM (${statusUpdates.updatedAt} - ${requests.createdAt})) / 3600)`,
      })
      .from(statusUpdates)
      .innerJoin(requests, eq(statusUpdates.requestId, requests.id))
      .innerJoin(users, eq(statusUpdates.updatedById, users.id))
      .where(
        and(
          eq(requests.organizationId, organizationId),
          eq(statusUpdates.status, 'completed'),
          gte(statusUpdates.updatedAt, start),
          lte(statusUpdates.updatedAt, end)
        )
      )
      .groupBy(statusUpdates.updatedById, users.firstName, users.lastName, users.email)
      .orderBy(desc(count()))
      .limit(10);

    const topAssignees = topAssigneesData.map(r => ({
      userId: r.userId,
      name: `${r.firstName || ''} ${r.lastName || ''}`.trim() || 'Unknown',
      email: r.email || '',
      completedCount: Number(r.count),
      avgCompletionHours: r.avgHours ? Math.round(r.avgHours * 10) / 10 : 0,
    }));

    return {
      totalUsers: Number(userCounts?.total || 0),
      activeUsers: Number(activeCount?.count || 0),
      usersByRole,
      topRequesters,
      topAssignees,
    };
  }

  /**
   * Get facility analytics
   */
  async getFacilityAnalytics(
    organizationId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<FacilityAnalytics> {
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total buildings and facilities
    const [buildingCount] = await db
      .select({ count: count() })
      .from(buildings)
      .where(
        and(
          eq(buildings.organizationId, organizationId),
          isNull(buildings.deletedAt)
        )
      );

    const [facilityCount] = await db
      .select({ count: count() })
      .from(facilities)
      .where(
        and(
          eq(facilities.organizationId, organizationId),
          isNull(facilities.deletedAt)
        )
      );

    // Requests by facility
    const facilityData = await db
      .select({
        facility: requests.facility,
        total: count(),
        open: sql<number>`COUNT(CASE WHEN ${requests.status} NOT IN ('completed', 'cancelled') THEN 1 END)`,
      })
      .from(requests)
      .where(
        and(
          eq(requests.organizationId, organizationId),
          isNull(requests.deletedAt),
          gte(requests.createdAt, start),
          lte(requests.createdAt, end)
        )
      )
      .groupBy(requests.facility)
      .orderBy(desc(count()))
      .limit(20);

    return {
      totalBuildings: Number(buildingCount?.count || 0),
      totalFacilities: Number(facilityCount?.count || 0),
      requestsByBuilding: [], // Would need building_requests join
      requestsByFacility: facilityData.map(f => ({
        facility: f.facility || 'Unknown',
        requestCount: Number(f.total),
        openCount: Number(f.open),
      })),
    };
  }

  /**
   * Get comprehensive dashboard analytics
   */
  async getDashboardAnalytics(
    organizationId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<DashboardAnalytics> {
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [requestAnalytics, userAnalytics, facilityAnalytics] = await Promise.all([
      this.getRequestAnalytics(organizationId, start, end),
      this.getUserAnalytics(organizationId, start, end),
      this.getFacilityAnalytics(organizationId, start, end),
    ]);

    return {
      requests: requestAnalytics,
      users: userAnalytics,
      facilities: facilityAnalytics,
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
    };
  }

  /**
   * Get activity feed (recent actions)
   */
  async getActivityFeed(
    organizationId: number,
    limit: number = 50
  ): Promise<any[]> {
    const activities = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.organizationId, organizationId))
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);

    return activities;
  }
}

export const analyticsService = new AnalyticsService();
