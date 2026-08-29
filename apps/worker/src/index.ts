import { connection, type EmailJobData, type NotificationJobData } from "@sahabatkreator/jobs";
import { sendEmail } from "@sahabatkreator/jobs/resend";
import { type Job, Worker } from "bullmq";

// ── Email Worker ─────────────────────────────────────────────────

export const emailWorker = new Worker<EmailJobData>(
  "email",
  async (job: Job<EmailJobData>) => {
    const { to, subject, body } = job.data;

    console.log(`[Worker] Processing email job ${job.id}: sending to ${to}`);

    const result = await sendEmail({ to, subject, html: body });

    if (!result.success) {
      throw new Error(`Failed to send email: ${result.error}`);
    }

    console.log(`[Worker] Email job ${job.id} completed: sent to ${to}`);

    return { sent: true, to, messageId: result.messageId, timestamp: new Date().toISOString() };
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 100,
      duration: 60000,
    },
  },
);

// ── Notification Worker ──────────────────────────────────────────

export const notificationWorker = new Worker<NotificationJobData>(
  "notification",
  async (job: Job<NotificationJobData>) => {
    const { userId, type, title, message } = job.data;

    console.log(`[Worker] Processing notification job ${job.id}: ${type} to user ${userId}`);

    // TODO: Implement real notification logic (push, in-app, SMS)
    // For now, just simulate processing
    await new Promise((resolve) => setTimeout(resolve, 200));

    console.log(`[Worker] Notification job ${job.id} completed`);

    return { sent: true, type, userId, timestamp: new Date().toISOString() };
  },
  {
    connection,
    concurrency: 10,
  },
);

import { analyticsSyncWorker } from "./jobs/analytics-sync";
import { emailDigestWorker } from "./jobs/email-digest-worker";
import { engagementSyncWorker } from "./jobs/engagement-sync";
// ── Import workers ──────────────────────────────────────────────
import { postPublisherWorker } from "./jobs/post-publisher";
import { postSchedulerWorker } from "./jobs/post-scheduler";
import { scheduledDigestWorker } from "./jobs/scheduled-digest-worker";
import { stalePostCleanupWorker } from "./jobs/stale-cleanup";
import { tokenRefreshWorker } from "./jobs/token-refresh";

// ── Event listeners ──────────────────────────────────────────────

emailWorker.on("completed", (job) => {
  console.log(`[Worker] Email job ${job.id} completed`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`[Worker] Email job ${job?.id} failed: ${err.message}`);
});

notificationWorker.on("completed", (job) => {
  console.log(`[Worker] Notification job ${job.id} completed`);
});

notificationWorker.on("failed", (job, err) => {
  console.error(`[Worker] Notification job ${job?.id} failed: ${err.message}`);
});

// ── Graceful shutdown ────────────────────────────────────────────

process.on("SIGTERM", async () => {
  console.log("[Worker] Received SIGTERM, closing workers...");
  await emailWorker.close();
  await notificationWorker.close();
  await postPublisherWorker.close();
  await analyticsSyncWorker.close();
  await engagementSyncWorker.close();
  await tokenRefreshWorker.close();
  await postSchedulerWorker.close();
  await stalePostCleanupWorker.close();
  await emailDigestWorker.close();
  await scheduledDigestWorker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("[Worker] Received SIGINT, closing workers...");
  await emailWorker.close();
  await notificationWorker.close();
  await postPublisherWorker.close();
  await analyticsSyncWorker.close();
  await engagementSyncWorker.close();
  await tokenRefreshWorker.close();
  await postSchedulerWorker.close();
  await stalePostCleanupWorker.close();
  await emailDigestWorker.close();
  await scheduledDigestWorker.close();
  process.exit(0);
});

console.log("[Worker] Starting Sahabat Kreator background workers...");
console.log("[Worker] - Email worker: processing 'email' queue");
console.log("[Worker] - Notification worker: processing 'notification' queue");
console.log("[Worker] - Post publisher worker: processing 'post' queue");
console.log("[Worker] - Analytics sync worker: processing 'analytics' queue");
console.log("[Worker] - Engagement sync worker: processing 'engagement' queue");
console.log("[Worker] - Token refresh worker: processing 'token' queue");
console.log("[Worker] - Email digest worker: processing 'email-digest' queue");
console.log("[Worker] - Scheduled digest worker: processing 'scheduled-digest' queue");
