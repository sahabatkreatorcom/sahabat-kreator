/**
 * Scheduled Digest Worker
 * Runs on a cron schedule and triggers the email-digest worker.
 *
 * Responsibilities:
 * - Runs on cron schedule (daily at 08:00, weekly on Monday at 08:00, monthly on the 1st at 08:00)
 * - Queries all organizations with active members who have digest enabled
 * - Fires one email-digest job per org per configured period type
 * - Manages subscription-based scheduling via BullMQ job schedulers
 */

import { db } from "@sahabatkreator/db";
import {
  emailReport,
  member,
  organization,
  organizationSetting,
  user,
} from "@sahabatkreator/db/schema";
import {
  connection,
  queueEmailDigest,
  scheduleRecurringJob,
  scheduledDigestQueue,
} from "@sahabatkreator/jobs";
import { Worker } from "bullmq";
import { and, eq } from "drizzle-orm";

// ── Scheduler crons (ISO cron syntax accepted by BullMQ) ────────────
const _CRON_DAILY = "0 8 * * *"; // 08:00 every day
const _CRON_WEEKLY = "0 8 * * 1"; // 08:00 every Monday
const _CRON_MONTHLY = "0 8 1 * *"; // 08:00 on the 1st of every month

type PeriodType = "daily" | "weekly" | "monthly";

/** Compute period bounds for a given type, used to pass into the digest job. */
function periodBounds(type: PeriodType): { start: Date; end: Date } {
  const now = new Date();
  if (type === "daily") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  }
  if (type === "weekly") {
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay()); // Sunday
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  }
  // monthly
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { start, end: now };
}

/**
 * Checks whether an org has digest enabled (org_settings key = "digest_enabled").
 * Falls back to true if no setting exists (enabled by default).
 */
async function isDigestEnabled(orgId: string): Promise<boolean> {
  const [setting] = await db
    .select({ value: organizationSetting.value })
    .from(organizationSetting)
    .where(
      and(
        eq(organizationSetting.organizationId, orgId),
        eq(organizationSetting.key, "digest_enabled"),
      ),
    );
  return setting?.value !== "false";
}

/**
 * Finds one admin email per organization to send the digest to.
 */
async function findRecipientEmail(orgId: string): Promise<string | null> {
  const [m] = await db
    .select({ email: user.email })
    .from(member)
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .innerJoin(user, eq(user.id, member.userId))
    .where(and(eq(member.organizationId, orgId), eq(member.role, "OWNER")))
    .limit(1);
  return m?.email ?? null;
}

// ── Worker ───────────────────────────────────────────────────────────

export const scheduledDigestWorker = new Worker(
  "scheduled-digest",
  async () => {
    console.log("[ScheduledDigest] Running cron trigger...");

    // Determine which period types should fire this run
    const now = new Date();
    const isMonday = now.getDay() === 1;
    const isFirstOf_month = now.getDate() === 1;

    const periodTypes: PeriodType[] = [];
    if (now.getHours() === 8 && now.getMinutes() === 0) {
      periodTypes.push("daily");
      if (isMonday) periodTypes.push("weekly");
      if (isFirstOf_month) periodTypes.push("monthly");
    }

    if (periodTypes.length === 0) {
      console.log("[ScheduledDigest] Not the scheduled hour (08:00), skipping.");
      return { periodTypes: [], jobsQueued: 0 };
    }

    // Fetch all organizations
    const orgs = await db
      .select({ id: organization.id, name: organization.name })
      .from(organization);
    console.log(`[ScheduledDigest] Found ${orgs.length} organizations`);

    let jobsQueued = 0;

    for (const org of orgs) {
      const enabled = await isDigestEnabled(org.id);
      if (!enabled) continue;

      const email = await findRecipientEmail(org.id);
      if (!email) {
        console.warn(`[ScheduledDigest] No admin email for org ${org.id}, skipping`);
        continue;
      }

      for (const pt of periodTypes) {
        const bounds = periodBounds(pt);
        // Avoid re-sending if a report for this period already exists and is COMPLETED
        const existing = await db
          .select({ id: emailReport.id })
          .from(emailReport)
          .where(
            and(
              eq(emailReport.organizationId, org.id),
              eq(emailReport.periodStart, bounds.start),
              eq(emailReport.periodEnd, bounds.end),
              eq(emailReport.status, "COMPLETED"),
            ),
          )
          .limit(1);
        if (existing.length > 0) {
          console.log(`[ScheduledDigest] Report already exists for ${org.id} ${pt}, skipping`);
          continue;
        }

        await queueEmailDigest({
          organizationId: org.id,
          recipientEmail: email,
          periodType: pt,
          periodStart: bounds.start.toISOString(),
          periodEnd: bounds.end.toISOString(),
        });
        jobsQueued++;
        console.log(`[ScheduledDigest] Queued ${pt} digest for ${org.name} (${org.id}) → ${email}`);
      }
    }

    return { periodTypes, orgsScanned: orgs.length, jobsQueued };
  },
  {
    connection,
    concurrency: 1,
  },
);

scheduledDigestWorker.on("completed", (job) => {
  console.log(`[ScheduledDigest] Job ${job.id} completed`);
});

scheduledDigestWorker.on("failed", (job, err) => {
  console.error(`[ScheduledDigest] Job ${job?.id} failed: ${err.message}`);
});

// ── Scheduler registration (call once at boot) ─────────────────────

export async function registerDigestSchedulers() {
  // Register the cron-triggered scheduler that fires the worker periodically.
  await scheduleRecurringJob(
    scheduledDigestQueue,
    "digest-scheduler",
    {},
    "0 8 * * *",
  );
  console.log("[ScheduledDigest] Cron scheduler registered (08:00 daily)");
}
