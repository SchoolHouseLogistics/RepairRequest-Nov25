import { db } from '../db';
import {
  requests,
  users,
  buildings,
  facilities,
  buildingRequests,
  techRequests,
  statusUpdates,
  assignments,
  messages,
} from '@shared/schema';
import { eq, and, isNull, desc, gte, lte } from 'drizzle-orm';

export type ExportFormat = 'json' | 'csv';
export type ExportType = 'requests' | 'users' | 'buildings' | 'facilities' | 'audit_logs';

export interface ExportOptions {
  organizationId: number;
  type: ExportType;
  format: ExportFormat;
  startDate?: Date;
  endDate?: Date;
  includeDeleted?: boolean;
}

export interface ExportResult {
  data: string;
  filename: string;
  mimeType: string;
  recordCount: number;
}

class ExportService {
  /**
   * Export data based on options
   */
  async export(options: ExportOptions): Promise<ExportResult> {
    const { type, format, organizationId } = options;

    let data: any[];
    let filename: string;

    switch (type) {
      case 'requests':
        data = await this.exportRequests(options);
        filename = `requests_export_${Date.now()}`;
        break;
      case 'users':
        data = await this.exportUsers(options);
        filename = `users_export_${Date.now()}`;
        break;
      case 'buildings':
        data = await this.exportBuildings(options);
        filename = `buildings_export_${Date.now()}`;
        break;
      case 'facilities':
        data = await this.exportFacilities(options);
        filename = `facilities_export_${Date.now()}`;
        break;
      default:
        throw new Error(`Unknown export type: ${type}`);
    }

    const formattedData = format === 'csv' ? this.toCsv(data) : JSON.stringify(data, null, 2);
    const mimeType = format === 'csv' ? 'text/csv' : 'application/json';
    const extension = format === 'csv' ? 'csv' : 'json';

    return {
      data: formattedData,
      filename: `${filename}.${extension}`,
      mimeType,
      recordCount: data.length,
    };
  }

  /**
   * Export requests with all related data
   */
  private async exportRequests(options: ExportOptions): Promise<any[]> {
    const { organizationId, startDate, endDate, includeDeleted } = options;

    const conditions = [eq(requests.organizationId, organizationId)];

    if (!includeDeleted) {
      conditions.push(isNull(requests.deletedAt));
    }
    if (startDate) {
      conditions.push(gte(requests.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(requests.createdAt, endDate));
    }

    const requestData = await db
      .select()
      .from(requests)
      .where(and(...conditions))
      .orderBy(desc(requests.createdAt));

    // Enrich with related data
    const enrichedData = await Promise.all(
      requestData.map(async (request) => {
        // Get requestor info
        const [requestor] = request.requestorId
          ? await db.select({
              id: users.id,
              email: users.email,
              firstName: users.firstName,
              lastName: users.lastName,
            }).from(users).where(eq(users.id, request.requestorId))
          : [null];

        // Get building request details if applicable
        let buildingDetails = null;
        if (request.requestType === 'building') {
          const [bd] = await db
            .select()
            .from(buildingRequests)
            .where(eq(buildingRequests.requestId, request.id));
          buildingDetails = bd || null;
        }

        // Get tech request details if applicable
        let techDetails = null;
        if (request.requestType === 'tech') {
          const [td] = await db
            .select()
            .from(techRequests)
            .where(eq(techRequests.requestId, request.id));
          techDetails = td || null;
        }

        // Get status history
        const statusHistory = await db
          .select()
          .from(statusUpdates)
          .where(eq(statusUpdates.requestId, request.id))
          .orderBy(desc(statusUpdates.updatedAt));

        // Get assignments
        const requestAssignments = await db
          .select()
          .from(assignments)
          .where(eq(assignments.requestId, request.id));

        // Get message count
        const messageList = await db
          .select()
          .from(messages)
          .where(eq(messages.requestId, request.id));

        return {
          id: request.id,
          requestType: request.requestType,
          facility: request.facility,
          event: request.event,
          eventDate: request.eventDate,
          status: request.status,
          priority: request.priority,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
          requestor: requestor ? {
            email: requestor.email,
            name: `${requestor.firstName || ''} ${requestor.lastName || ''}`.trim(),
          } : null,
          buildingDetails: buildingDetails ? {
            building: buildingDetails.building,
            roomNumber: buildingDetails.roomNumber,
            description: buildingDetails.description,
          } : null,
          techDetails: techDetails ? {
            category: techDetails.category,
            deviceType: techDetails.deviceType,
            description: techDetails.description,
          } : null,
          statusHistory: statusHistory.map(s => ({
            status: s.status,
            note: s.note,
            updatedAt: s.updatedAt,
          })),
          assignmentCount: requestAssignments.length,
          messageCount: messageList.length,
        };
      })
    );

    return enrichedData;
  }

  /**
   * Export users
   */
  private async exportUsers(options: ExportOptions): Promise<any[]> {
    const { organizationId, includeDeleted } = options;

    const conditions = [eq(users.organizationId, organizationId)];

    if (!includeDeleted) {
      conditions.push(isNull(users.deletedAt));
    }

    const userData = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(and(...conditions))
      .orderBy(desc(users.createdAt));

    return userData;
  }

  /**
   * Export buildings
   */
  private async exportBuildings(options: ExportOptions): Promise<any[]> {
    const { organizationId, includeDeleted } = options;

    const conditions = [eq(buildings.organizationId, organizationId)];

    if (!includeDeleted) {
      conditions.push(isNull(buildings.deletedAt));
    }

    const buildingData = await db
      .select({
        id: buildings.id,
        name: buildings.name,
        address: buildings.address,
        description: buildings.description,
        createdAt: buildings.createdAt,
        updatedAt: buildings.updatedAt,
      })
      .from(buildings)
      .where(and(...conditions))
      .orderBy(buildings.name);

    return buildingData;
  }

  /**
   * Export facilities
   */
  private async exportFacilities(options: ExportOptions): Promise<any[]> {
    const { organizationId, includeDeleted } = options;

    const conditions = [eq(facilities.organizationId, organizationId)];

    if (!includeDeleted) {
      conditions.push(isNull(facilities.deletedAt));
    }

    const facilityData = await db
      .select({
        id: facilities.id,
        name: facilities.name,
        description: facilities.description,
        createdAt: facilities.createdAt,
        updatedAt: facilities.updatedAt,
      })
      .from(facilities)
      .where(and(...conditions))
      .orderBy(facilities.name);

    return facilityData;
  }

  /**
   * Convert data array to CSV format
   */
  private toCsv(data: any[]): string {
    if (data.length === 0) {
      return '';
    }

    // Flatten nested objects for CSV
    const flattenedData = data.map((item) => this.flattenObject(item));

    // Get all unique headers
    const headers = new Set<string>();
    flattenedData.forEach((item) => {
      Object.keys(item).forEach((key) => headers.add(key));
    });
    const headerArray = Array.from(headers);

    // Build CSV
    const rows = [
      headerArray.join(','),
      ...flattenedData.map((item) =>
        headerArray
          .map((header) => {
            const value = item[header];
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            // Escape quotes and wrap in quotes if contains comma or newline
            if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          })
          .join(',')
      ),
    ];

    return rows.join('\n');
  }

  /**
   * Flatten nested object for CSV export
   */
  private flattenObject(obj: any, prefix: string = ''): Record<string, any> {
    const result: Record<string, any> = {};

    for (const key of Object.keys(obj)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}_${key}` : key;

      if (value === null || value === undefined) {
        result[newKey] = '';
      } else if (Array.isArray(value)) {
        result[newKey] = value.length; // For arrays, just store count
      } else if (typeof value === 'object' && value instanceof Date) {
        result[newKey] = value.toISOString();
      } else if (typeof value === 'object') {
        Object.assign(result, this.flattenObject(value, newKey));
      } else {
        result[newKey] = value;
      }
    }

    return result;
  }
}

export const exportService = new ExportService();
