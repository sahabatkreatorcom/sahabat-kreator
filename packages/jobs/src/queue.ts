import { env } from "@sahabatkreator/env/server";
import { type ConnectionOptions, Queue } from "bullmq";

export const connection: ConnectionOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
};

/**
 * Email queue
 */
export const emailQueue = new Queue("email", { connection });

/**
 * Notification queue
 */
export const notificationQueue = new Queue("notification", { connection });

/**
 * Post publisher queue
 */
export const postQueue = new Queue("post", { connection });

/**
 * Analytics sync queue
 */
export const analyticsQueue = new Queue("analytics", { connection });

/**
 * Engagement sync queue
 */
export const engagementQueue = new Queue("engagement", { connection });

/**
 * Token refresh queue
 */
export const tokenQueue = new Queue("token", { connection });

/**
 * Email digest queue
 */
export const emailDigestQueue = new Queue("email-digest", { connection });

/**
 * Scheduled digest trigger queue
 */
export const scheduledDigestQueue = new Queue("scheduled-digest", { connection });

// ── Job data types ────────────────────────────────────────────────

export interface EmailJobData {
  to: string;
  subject: string;
  body: string;
  templateId?: string;
}

export interface NotificationJobData {
  userId: string;
  type: "push" | "in-app" | "sms";
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface PostJobData {
  postId: string;
  organizationId: string;
  socialAccountId: string;
  caption: string;
  postType: string;
  mediaIds?: string[];
  scheduledAt?: string;
}

export interface AnalyticsSyncJobData {
  organizationId: string;
  socialAccountId: string;
  platform: string;
  range?: string;
}

export interface EngagementSyncJobData {
  organizationId: string;
  socialAccountId: string;
  platform: string;
  type?: string;
}

export interface TokenRefreshJobData {
  socialAccountId: string;
  organizationId: string;
  platform: string;
  refreshToken: string;
}

/** One batch entry produced by the email-digest worker. */
export interface EmailDigestJobData {
  organizationId: string;
  recipientEmail: string;
  periodType: "daily" | "weekly" | "monthly";
  periodStart: string;
  periodEnd: string;
  reportId?: string;
}

/** One trigger entry for the scheduled-digest worker. */
export interface ScheduledDigestJobData {
  organizationId: string;
  periodType: "daily" | "weekly" | "monthly";
  createdAt: string;
}

// ── Producer helpers (used by server) ────────────────────────��────

export async function queueEmail(
  data: EmailJobData,
  options?: { delay?: number; priority?: number },
) {
  return emailQueue.add("send-email", data, {
    delay: options?.delay,
    priority: options?.priority,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  });
}

export async function queueNotification(data: NotificationJobData, options?: { delay?: number }) {
  return notificationQueue.add("send-notification", data, {
    delay: options?.delay,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  });
}

export async function queuePostPublish(data: PostJobData, options?: { delay?: number }) {
  return postQueue.add("publish-post", data, {
    delay: options?.delay,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  });
}

export async function queueAnalyticsSync(data: AnalyticsSyncJobData, options?: { delay?: number }) {
  return analyticsQueue.add("sync-analytics", data, {
    delay: options?.delay,
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  });
}

export async function queueEngagementSync(
  data: EngagementSyncJobData,
  options?: { delay?: number },
) {
  return engagementQueue.add("sync-engagement", data, {
    delay: options?.delay,
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  });
}

export async function queueTokenRefresh(data: TokenRefreshJobData, options?: { delay?: number }) {
  return tokenQueue.add("refresh-token", data, {
    delay: options?.delay,
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 10000,
    },
  });
}

export async function queueEmailDigest(data: EmailDigestJobData, options?: { delay?: number }) {
  return emailDigestQueue.add("send-digest", data, {
    delay: options?.delay,
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  });
}

export async function queueScheduledDigest(
  data: ScheduledDigestJobData,
  options?: { delay?: number },
) {
  return scheduledDigestQueue.add("trigger-digest", data, {
    delay: options?.delay,
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  });
}

// ── Scheduler helpers ─────────────────────────────────────────────

export async function scheduleRecurringJob<T>(
  queue: Queue,
  name: string,
  data: T,
  pattern: string,
) {
  return queue.upsertJobScheduler(name, { pattern }, { name, data: data as object });
}

export async function getQueueStats(queue: Queue) {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

export async function closeQueues() {
  await emailQueue.close();
  await notificationQueue.close();
  await postQueue.close();
  await analyticsQueue.close();
  await engagementQueue.close();
  await tokenQueue.close();
  await emailDigestQueue.close();
  await scheduledDigestQueue.close();
}
