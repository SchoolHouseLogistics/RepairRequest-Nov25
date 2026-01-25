import { db } from '../db';
import { requestTemplates, InsertRequestTemplate, RequestTemplate } from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

class TemplateService {
  /**
   * Create a new request template
   */
  async createTemplate(data: InsertRequestTemplate): Promise<RequestTemplate> {
    const [template] = await db
      .insert(requestTemplates)
      .values(data)
      .returning();
    return template;
  }

  /**
   * Get all templates for an organization
   */
  async getTemplates(
    organizationId: number,
    options: { activeOnly?: boolean; requestType?: string } = {}
  ): Promise<RequestTemplate[]> {
    const conditions = [eq(requestTemplates.organizationId, organizationId)];

    if (options.activeOnly !== false) {
      conditions.push(eq(requestTemplates.isActive, true));
    }

    if (options.requestType) {
      conditions.push(eq(requestTemplates.requestType, options.requestType));
    }

    return db
      .select()
      .from(requestTemplates)
      .where(and(...conditions))
      .orderBy(desc(requestTemplates.usageCount), requestTemplates.name);
  }

  /**
   * Get a single template by ID
   */
  async getTemplate(
    templateId: number,
    organizationId: number
  ): Promise<RequestTemplate | undefined> {
    const [template] = await db
      .select()
      .from(requestTemplates)
      .where(
        and(
          eq(requestTemplates.id, templateId),
          eq(requestTemplates.organizationId, organizationId)
        )
      );
    return template;
  }

  /**
   * Update a template
   */
  async updateTemplate(
    templateId: number,
    organizationId: number,
    data: Partial<Pick<RequestTemplate, 'name' | 'description' | 'requestType' | 'facility' | 'defaultPriority' | 'fields' | 'isActive'>>
  ): Promise<RequestTemplate | undefined> {
    const [template] = await db
      .update(requestTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(requestTemplates.id, templateId),
          eq(requestTemplates.organizationId, organizationId)
        )
      )
      .returning();
    return template;
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: number, organizationId: number): Promise<boolean> {
    const result = await db
      .delete(requestTemplates)
      .where(
        and(
          eq(requestTemplates.id, templateId),
          eq(requestTemplates.organizationId, organizationId)
        )
      )
      .returning();
    return result.length > 0;
  }

  /**
   * Increment usage count when a template is used
   */
  async incrementUsage(templateId: number): Promise<void> {
    await db
      .update(requestTemplates)
      .set({
        usageCount: sql`${requestTemplates.usageCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(requestTemplates.id, templateId));
  }

  /**
   * Get popular templates (most used)
   */
  async getPopularTemplates(
    organizationId: number,
    limit: number = 5
  ): Promise<RequestTemplate[]> {
    return db
      .select()
      .from(requestTemplates)
      .where(
        and(
          eq(requestTemplates.organizationId, organizationId),
          eq(requestTemplates.isActive, true)
        )
      )
      .orderBy(desc(requestTemplates.usageCount))
      .limit(limit);
  }

  /**
   * Duplicate a template
   */
  async duplicateTemplate(
    templateId: number,
    organizationId: number,
    newName: string
  ): Promise<RequestTemplate | undefined> {
    const original = await this.getTemplate(templateId, organizationId);

    if (!original) {
      return undefined;
    }

    const [duplicate] = await db
      .insert(requestTemplates)
      .values({
        organizationId: original.organizationId,
        name: newName,
        description: original.description,
        requestType: original.requestType,
        facility: original.facility,
        defaultPriority: original.defaultPriority,
        fields: original.fields,
        createdById: original.createdById,
        isActive: true,
      })
      .returning();

    return duplicate;
  }
}

export const templateService = new TemplateService();
