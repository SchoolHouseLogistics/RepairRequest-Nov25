import { db } from '../db';
import { requests, organizationFeatures, statusUpdates, users } from '@shared/schema';
import { eq, and, isNull, sql, desc, gte, lt, ne } from 'drizzle-orm';
import { PRIORITY_LEVELS, REQUEST_STATUSES } from '../constants';

export interface SLAConfig {
  responseHours: number;
  resolutionHours: number;
  escalationEnabled: boolean;
  escalationEmail?: string;
  priorityOverrides?: Record<string, { response: number; resolution: number }>;
}

export interface SLAMetrics {
  totalRequests: number;
  openRequests: number;
  overdueResponse: number;
  overdueResolution: number;
  avgResponseTimeHours: number | null;
  avgResolutionTimeHours: number | null;
  slaComplianceRate: number;
  byPriority: Record<string, {
    total: number;
    open: number;
    overdueResponse: number;
    overdueResolution: number;
    avgResponseTime: number | null;
    avgResolutionTime: number | null;
  }>;
}

export interface RequestSLAStatus {
  requestId: number;
  priority: string;
  status: string;
  createdAt: Date;
  firstResponseAt: Date | null;
  resolvedAt: Date | null;
  responseTargetHours: number;
  resolutionTargetHours: number;
  responseDeadline: Date;
  resolutionDeadline: Date;
  isOverdueResponse: boolean;
  isOverdueResolution: boolean;
  responseTimeHours: number | null;
  resolutionTimeHours: number | null;
}

const DEFAULT_SLA: SLAConfig = {
  responseHours: 24,
  resolutionHours: 72,
  escalationEnabled: false,
  priorityOverrides: {
    urgent: { response: 4, resolution: 24 },
    high: { response: 8, resolution: 48 },
    medium: { response: 24, resolution: 72 },
    low: { response: 48, resolution: 120 },
  },
};

class SLAService {
  /**
   * Get SLA configuration for an organization
   */
  async getSLAConfig(organizationId: number): Promise<SLAConfig> {
    const [features] = await db
      .select()
      .from(organizationFeatures)
      .where(eq(organizationFeatures.organizationId, organizationId));

    if (!features) {
      return DEFAULT_SLA;
    }

    return {
      responseHours: features.slaResponseHours || DEFAULT_SLA.responseHours,
      resolutionHours: features.slaResolutionHours || DEFAULT_SLA.resolutionHours,
      escalationEnabled: features.slaEscalationEnabled || false,
      escalationEmail: features.slaEscalationEmail || undefined,
      priorityOverrides: (features.slaPriorityOverrides as any) || DEFAULT_SLA.priorityOverrides,
    };
  }

  /**
   * Get SLA targets for a specific priority
   */
  getSLATargets(config: SLAConfig, priority: string): { responseHours: number; resolutionHours: number } {
    const overrides = config.priorityOverrides?.[priority];
    if (overrides) {
      return {
        responseHours: overrides.response,
        resolutionHours: overrides.resolution,
      };
    }
    return {
      responseHours: config.responseHours,
      resolutionHours: config.resolutionHours,
    };
  }

  /**
   * Calculate SLA status for a single request
   */
  async getRequestSLAStatus(requestId: number): Promise<RequestSLAStatus | null> {
    const [request] = await db
      .select()
      .from(requests)
      .where(and(eq(requests.id, requestId), isNull(requests.deletedAt)));

    if (!request || !request.organizationId) {
      return null;
    }

    const config = await this.getSLAConfig(request.organizationId);
    const targets = this.getSLATargets(config, request.priority || 'medium');

    // Get first response (first status update that's not 'pending')
    const [firstResponse] = await db
      .select()
      .from(statusUpdates)
      .where(
        and(
          eq(statusUpdates.requestId, requestId),
          ne(statusUpdates.status, REQUEST_STATUSES.PENDING)
        )
      )
      .orderBy(statusUpdates.updatedAt)
      .limit(1);

    // Get resolution time (when status changed to completed)
    const [resolution] = await db
      .select()
      .from(statusUpdates)
      .where(
        and(
          eq(statusUpdates.requestId, requestId),
          eq(statusUpdates.status, REQUEST_STATUSES.COMPLETED)
        )
      )
      .orderBy(statusUpdates.updatedAt)
      .limit(1);

    const createdAt = request.createdAt!;
    const now = new Date();

    const responseDeadline = new Date(createdAt.getTime() + targets.responseHours * 60 * 60 * 1000);
    const resolutionDeadline = new Date(createdAt.getTime() + targets.resolutionHours * 60 * 60 * 1000);

    const firstResponseAt = firstResponse?.updatedAt || null;
    const resolvedAt = resolution?.updatedAt || null;

    // Calculate response time in hours
    let responseTimeHours: number | null = null;
    if (firstResponseAt) {
      responseTimeHours = (firstResponseAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    }

    // Calculate resolution time in hours
    let resolutionTimeHours: number | null = null;
    if (resolvedAt) {
      resolutionTimeHours = (resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    }

    // Determine if overdue
    const isOpen = request.status !== REQUEST_STATUSES.COMPLETED && request.status !== REQUEST_STATUSES.CANCELLED;
    const isOverdueResponse = !firstResponseAt && now > responseDeadline;
    const isOverdueResolution = isOpen && now > resolutionDeadline;

    return {
      requestId: request.id,
      priority: request.priority || 'medium',
      status: request.status || 'pending',
      createdAt,
      firstResponseAt,
      resolvedAt,
      responseTargetHours: targets.responseHours,
      resolutionTargetHours: targets.resolutionHours,
      responseDeadline,
      resolutionDeadline,
      isOverdueResponse,
      isOverdueResolution,
      responseTimeHours,
      resolutionTimeHours,
    };
  }

  /**
   * Get SLA metrics for an organization
   */
  async getOrganizationMetrics(
    organizationId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<SLAMetrics> {
    const config = await this.getSLAConfig(organizationId);
    const now = new Date();

    // Build base query conditions
    const conditions = [
      eq(requests.organizationId, organizationId),
      isNull(requests.deletedAt),
    ];

    if (startDate) {
      conditions.push(gte(requests.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lt(requests.createdAt, endDate));
    }

    // Get all requests
    const allRequests = await db
      .select()
      .from(requests)
      .where(and(...conditions));

    // Initialize metrics
    const metrics: SLAMetrics = {
      totalRequests: allRequests.length,
      openRequests: 0,
      overdueResponse: 0,
      overdueResolution: 0,
      avgResponseTimeHours: null,
      avgResolutionTimeHours: null,
      slaComplianceRate: 100,
      byPriority: {},
    };

    // Initialize priority buckets
    for (const priority of Object.values(PRIORITY_LEVELS)) {
      metrics.byPriority[priority] = {
        total: 0,
        open: 0,
        overdueResponse: 0,
        overdueResolution: 0,
        avgResponseTime: null,
        avgResolutionTime: null,
      };
    }

    let totalResponseTime = 0;
    let responseCount = 0;
    let totalResolutionTime = 0;
    let resolutionCount = 0;
    let compliantRequests = 0;

    // Process each request
    for (const request of allRequests) {
      const priority = request.priority || 'medium';
      const targets = this.getSLATargets(config, priority);
      const isOpen = request.status !== REQUEST_STATUSES.COMPLETED && request.status !== REQUEST_STATUSES.CANCELLED;

      // Update priority counts
      if (metrics.byPriority[priority]) {
        metrics.byPriority[priority].total++;
        if (isOpen) {
          metrics.byPriority[priority].open++;
        }
      }

      if (isOpen) {
        metrics.openRequests++;
      }

      // Get response and resolution times
      const [firstResponse] = await db
        .select()
        .from(statusUpdates)
        .where(
          and(
            eq(statusUpdates.requestId, request.id),
            ne(statusUpdates.status, REQUEST_STATUSES.PENDING)
          )
        )
        .orderBy(statusUpdates.updatedAt)
        .limit(1);

      const [resolution] = await db
        .select()
        .from(statusUpdates)
        .where(
          and(
            eq(statusUpdates.requestId, request.id),
            eq(statusUpdates.status, REQUEST_STATUSES.COMPLETED)
          )
        )
        .orderBy(statusUpdates.updatedAt)
        .limit(1);

      const createdAt = request.createdAt!;
      const responseDeadline = new Date(createdAt.getTime() + targets.responseHours * 60 * 60 * 1000);
      const resolutionDeadline = new Date(createdAt.getTime() + targets.resolutionHours * 60 * 60 * 1000);

      // Check response SLA
      if (firstResponse) {
        const responseTime = (firstResponse.updatedAt!.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        totalResponseTime += responseTime;
        responseCount++;

        if (metrics.byPriority[priority]) {
          const currentAvg = metrics.byPriority[priority].avgResponseTime;
          const count = metrics.byPriority[priority].total;
          metrics.byPriority[priority].avgResponseTime = currentAvg
            ? (currentAvg * (count - 1) + responseTime) / count
            : responseTime;
        }
      } else if (isOpen && now > responseDeadline) {
        metrics.overdueResponse++;
        if (metrics.byPriority[priority]) {
          metrics.byPriority[priority].overdueResponse++;
        }
      }

      // Check resolution SLA
      if (resolution) {
        const resolutionTime = (resolution.updatedAt!.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        totalResolutionTime += resolutionTime;
        resolutionCount++;

        // Check if resolved within SLA
        if (resolution.updatedAt! <= resolutionDeadline) {
          compliantRequests++;
        }

        if (metrics.byPriority[priority]) {
          const currentAvg = metrics.byPriority[priority].avgResolutionTime;
          const count = metrics.byPriority[priority].total;
          metrics.byPriority[priority].avgResolutionTime = currentAvg
            ? (currentAvg * (count - 1) + resolutionTime) / count
            : resolutionTime;
        }
      } else if (isOpen && now > resolutionDeadline) {
        metrics.overdueResolution++;
        if (metrics.byPriority[priority]) {
          metrics.byPriority[priority].overdueResolution++;
        }
      }
    }

    // Calculate averages
    metrics.avgResponseTimeHours = responseCount > 0 ? totalResponseTime / responseCount : null;
    metrics.avgResolutionTimeHours = resolutionCount > 0 ? totalResolutionTime / resolutionCount : null;

    // Calculate compliance rate (completed requests within SLA / total completed)
    if (resolutionCount > 0) {
      metrics.slaComplianceRate = Math.round((compliantRequests / resolutionCount) * 100);
    }

    return metrics;
  }

  /**
   * Get overdue requests for an organization
   */
  async getOverdueRequests(organizationId: number): Promise<RequestSLAStatus[]> {
    const config = await this.getSLAConfig(organizationId);
    const now = new Date();

    // Get open requests
    const openRequests = await db
      .select()
      .from(requests)
      .where(
        and(
          eq(requests.organizationId, organizationId),
          isNull(requests.deletedAt),
          ne(requests.status, REQUEST_STATUSES.COMPLETED),
          ne(requests.status, REQUEST_STATUSES.CANCELLED)
        )
      )
      .orderBy(requests.createdAt);

    const overdueRequests: RequestSLAStatus[] = [];

    for (const request of openRequests) {
      const slaStatus = await this.getRequestSLAStatus(request.id);
      if (slaStatus && (slaStatus.isOverdueResponse || slaStatus.isOverdueResolution)) {
        overdueRequests.push(slaStatus);
      }
    }

    return overdueRequests;
  }

  /**
   * Update SLA configuration for an organization
   */
  async updateSLAConfig(
    organizationId: number,
    config: Partial<SLAConfig>
  ): Promise<void> {
    const updateData: any = {};

    if (config.responseHours !== undefined) {
      updateData.slaResponseHours = config.responseHours;
    }
    if (config.resolutionHours !== undefined) {
      updateData.slaResolutionHours = config.resolutionHours;
    }
    if (config.escalationEnabled !== undefined) {
      updateData.slaEscalationEnabled = config.escalationEnabled;
    }
    if (config.escalationEmail !== undefined) {
      updateData.slaEscalationEmail = config.escalationEmail;
    }
    if (config.priorityOverrides !== undefined) {
      updateData.slaPriorityOverrides = config.priorityOverrides;
    }

    updateData.updatedAt = new Date();

    await db
      .update(organizationFeatures)
      .set(updateData)
      .where(eq(organizationFeatures.organizationId, organizationId));
  }
}

export const slaService = new SLAService();
