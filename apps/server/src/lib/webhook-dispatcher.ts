import { db } from "@sahabatkreator/db";
import { webhookLog } from "@sahabatkreator/db/schema";
import { eq } from "drizzle-orm";

export interface WebhookEvent {
  platform: string;
  organizationId: string;
  accountId?: string;
  eventType: string;
  rawPayload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Dispatcher — routes incoming webhook events to appropriate handlers
 * and logs them for retry/failure tracking.
 */
export class WebhookDispatcher {
  private static handlers = new Map<string, (event: WebhookEvent) => Promise<void>>();

  static register(platform: string, handler: (event: WebhookEvent) => Promise<void>) {
    WebhookDispatcher.handlers.set(platform.toUpperCase(), handler);
  }

  static async dispatch(event: WebhookEvent): Promise<{ processed: boolean; error?: string }> {
    // Log the incoming webhook
    const logId = `wh_log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await db
      .insert(webhookLog)
      .values({
        id: logId,
        organizationId: event.organizationId,
        platform: event.platform as any,
        eventType: event.eventType,
        payload: JSON.stringify(event.rawPayload),
        status: "PENDING",
        attempt: 0,
      })
      .catch((err) => console.error("[WebhookDispatcher] Failed to log:", err));

    const handler = WebhookDispatcher.handlers.get(event.platform.toUpperCase());
    if (!handler) {
      await db
        .update(webhookLog)
        .set({ status: "FAILED", errorMessage: "No handler for platform" })
        .where(eq(webhookLog.id, logId))
        .catch(() => null);
      return { processed: false, error: `No handler for platform: ${event.platform}` };
    }

    try {
      await handler(event);
      await db
        .update(webhookLog)
        .set({ status: "PROCESSED", processedAt: new Date() })
        .where(eq(webhookLog.id, logId))
        .catch(() => null);
      return { processed: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      await db
        .update(webhookLog)
        .set({
          status: "FAILED",
          errorMessage: message,
          attempt: 1,
        })
        .where(eq(webhookLog.id, logId))
        .catch(() => null);
      console.error(`[WebhookDispatcher] Handler error for ${event.platform}:`, err);
      return { processed: false, error: message };
    }
  }

  /** Get unprocessed webhooks for retry */
  static async getFailedLogs(limit = 50) {
    return db
      .select()
      .from(webhookLog)
      .where(eq(webhookLog.status, "FAILED"))
      .orderBy(webhookLog.createdAt)
      .limit(limit);
  }
}
