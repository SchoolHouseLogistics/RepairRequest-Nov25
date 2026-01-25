import { db } from '../db';
import {
  webhooks,
  webhookDeliveries,
  InsertWebhook,
  InsertWebhookDelivery,
  Webhook,
} from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import crypto from 'crypto';

export type WebhookEvent =
  | 'request.created'
  | 'request.updated'
  | 'request.status_changed'
  | 'request.assigned'
  | 'request.completed'
  | 'message.created'
  | 'user.created'
  | 'user.updated';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, any>;
  organizationId: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [60000, 300000, 900000]; // 1min, 5min, 15min

class WebhookService {
  /**
   * Create a new webhook
   */
  async createWebhook(
    data: Omit<InsertWebhook, 'secret'>,
    organizationId: number
  ): Promise<Webhook> {
    const secret = crypto.randomBytes(32).toString('hex');

    const [webhook] = await db
      .insert(webhooks)
      .values({
        ...data,
        organizationId,
        secret,
      })
      .returning();

    return webhook;
  }

  /**
   * Get all webhooks for an organization
   */
  async getWebhooks(organizationId: number): Promise<Webhook[]> {
    return db
      .select()
      .from(webhooks)
      .where(eq(webhooks.organizationId, organizationId))
      .orderBy(desc(webhooks.createdAt));
  }

  /**
   * Get a single webhook by ID
   */
  async getWebhook(webhookId: number, organizationId: number): Promise<Webhook | undefined> {
    const [webhook] = await db
      .select()
      .from(webhooks)
      .where(and(eq(webhooks.id, webhookId), eq(webhooks.organizationId, organizationId)));
    return webhook;
  }

  /**
   * Update a webhook
   */
  async updateWebhook(
    webhookId: number,
    organizationId: number,
    data: Partial<Pick<Webhook, 'name' | 'url' | 'events' | 'active'>>
  ): Promise<Webhook | undefined> {
    const [webhook] = await db
      .update(webhooks)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(webhooks.id, webhookId), eq(webhooks.organizationId, organizationId)))
      .returning();
    return webhook;
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: number, organizationId: number): Promise<boolean> {
    const result = await db
      .delete(webhooks)
      .where(and(eq(webhooks.id, webhookId), eq(webhooks.organizationId, organizationId)))
      .returning();
    return result.length > 0;
  }

  /**
   * Regenerate webhook secret
   */
  async regenerateSecret(webhookId: number, organizationId: number): Promise<string | null> {
    const secret = crypto.randomBytes(32).toString('hex');

    const [webhook] = await db
      .update(webhooks)
      .set({ secret, updatedAt: new Date() })
      .where(and(eq(webhooks.id, webhookId), eq(webhooks.organizationId, organizationId)))
      .returning();

    return webhook ? secret : null;
  }

  /**
   * Trigger webhooks for an event
   */
  async trigger(event: WebhookEvent, organizationId: number, data: Record<string, any>): Promise<void> {
    try {
      // Get all active webhooks for this organization that subscribe to this event
      const activeWebhooks = await db
        .select()
        .from(webhooks)
        .where(
          and(
            eq(webhooks.organizationId, organizationId),
            eq(webhooks.active, true)
          )
        );

      // Filter webhooks that subscribe to this event
      const subscribedWebhooks = activeWebhooks.filter((webhook) => {
        const events = webhook.events as string[];
        return events.includes(event) || events.includes('*');
      });

      // Deliver to each webhook
      for (const webhook of subscribedWebhooks) {
        this.deliver(webhook, event, data).catch((error) => {
          console.error(`Webhook delivery failed for webhook ${webhook.id}:`, error);
        });
      }
    } catch (error) {
      console.error('Error triggering webhooks:', error);
    }
  }

  /**
   * Deliver a webhook payload
   */
  private async deliver(
    webhook: Webhook,
    event: WebhookEvent,
    data: Record<string, any>,
    attemptCount: number = 1
  ): Promise<void> {
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      organizationId: webhook.organizationId,
    };

    const signature = this.generateSignature(payload, webhook.secret);

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event,
          'X-Webhook-Delivery': crypto.randomUUID(),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      const responseBody = await response.text().catch(() => '');
      const success = response.ok;

      // Log the delivery
      await this.logDelivery(webhook.id, event, payload, response.status, responseBody, success, attemptCount);

      // Update webhook stats
      await db
        .update(webhooks)
        .set({
          lastTriggeredAt: new Date(),
          failureCount: success ? 0 : (webhook.failureCount || 0) + 1,
        })
        .where(eq(webhooks.id, webhook.id));

      // Schedule retry if failed
      if (!success && attemptCount < MAX_RETRIES) {
        const retryDelay = RETRY_DELAYS[attemptCount - 1];
        setTimeout(() => {
          this.deliver(webhook, event, data, attemptCount + 1);
        }, retryDelay);
      }

      // Disable webhook after too many failures
      if (!success && (webhook.failureCount || 0) >= 10) {
        await db
          .update(webhooks)
          .set({ active: false })
          .where(eq(webhooks.id, webhook.id));
        console.warn(`Webhook ${webhook.id} disabled due to repeated failures`);
      }
    } catch (error: any) {
      // Log the failed delivery
      await this.logDelivery(
        webhook.id,
        event,
        payload,
        0,
        error.message,
        false,
        attemptCount
      );

      // Schedule retry
      if (attemptCount < MAX_RETRIES) {
        const retryDelay = RETRY_DELAYS[attemptCount - 1];
        setTimeout(() => {
          this.deliver(webhook, event, data, attemptCount + 1);
        }, retryDelay);
      }
    }
  }

  /**
   * Generate HMAC signature for payload
   */
  private generateSignature(payload: WebhookPayload, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Log webhook delivery attempt
   */
  private async logDelivery(
    webhookId: number,
    event: string,
    payload: WebhookPayload,
    responseStatus: number,
    responseBody: string,
    success: boolean,
    attemptCount: number
  ): Promise<void> {
    await db.insert(webhookDeliveries).values({
      webhookId,
      event,
      payload,
      responseStatus,
      responseBody: responseBody.substring(0, 5000), // Truncate long responses
      success,
      attemptCount,
      nextRetryAt: !success && attemptCount < MAX_RETRIES
        ? new Date(Date.now() + RETRY_DELAYS[attemptCount - 1])
        : null,
    });
  }

  /**
   * Get delivery logs for a webhook
   */
  async getDeliveryLogs(webhookId: number, limit: number = 50): Promise<any[]> {
    return db
      .select()
      .from(webhookDeliveries)
      .where(eq(webhookDeliveries.webhookId, webhookId))
      .orderBy(desc(webhookDeliveries.createdAt))
      .limit(limit);
  }

  /**
   * Verify a webhook signature (for documentation/testing)
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expected = `sha256=${hmac.digest('hex')}`;
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }
}

export const webhookService = new WebhookService();
