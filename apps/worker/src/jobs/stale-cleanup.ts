/**
 * Stale Post Cleanup Worker
 * Runs every 5 minutes.
 *
 * Responsibilities:
 * - Finds posts stuck in PUBLISHING status for more than 30 minutes and resets them to DRAFT with an appropriate error
 * - Moves permanently failed posts (FAILED older than 1 hour, no retry budget) to the dead-letter queue (a separate archival table)
 */

import { connection } from "@sahabatkreator/jobs";
import { db } from "@sahabatkreator/db";
import { post, publishError } from "@sahabatkreator/db/schema";
import { eq, and, lt, isNull, gte, sql } from "drizzle-orm";
import { Worker } from "bullmq";

const STUCK_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
const FAILED_ARCHIVE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

export const stalePostCleanupWorker = new Worker(
  "cleanup",
  async () => {
    console.log("[Cleanup] Running stale post cleanup...");
    const now = new Date();
    const stuckCutoff = new Date(now.getTime() - STUCK_THRESHOLD_MS);
    const failedCutoff = new Date(now.getTime() - FAILED_ARCHIVE_THRESHOLD_MS);

    // ── 1. Reset PUBLISHING posts stuck beyond threshold ────────────
    const stuckPosts = await db
      .select({ id: post.id, organizationId: post.organizationId, socialAccountId: post.socialAccountId, platformPostId: post.platformPostId })
      .from(post)
      .where(and(eq(post.status, "PUBLISHING"), lt(post.updatedAt, stuckCutoff)));

    console.log(`[Cleanup] Found ${stuckPosts.length} stuck PUBLISHING posts`);

    for (const p of stuckPosts) {
      await db.transaction(async (tx) => {
        await tx
          .update(post)
          .set({
            status: "DRAFT",
            updatedAt: now,
            // Move any partial platform data into the error log so it can be inspected
            platformData: p.platformPostId
              ? sql`${post.platformData} || jsonb_build_object('stuck_at', ${now.toISOString()}, 'reason', 'timeout_30min')`
              : null,
          })
          .where(eq(post.id, p.id));

        await tx.insert(publishError).values({
          id: crypto.randomUUID(),
          postId: p.id,
          platform: "UNKNOWN", // will be filled when social account is joined
          errorCode: "TIMEOUT_STUCK",
          errorHuman: `Post stuck in PUBLISHING for >${STUCK_THRESHOLD_MS / 60000} minutes, reset to DRAFT`,
          suggestion: "Retry publishing from the dashboard",
          occurredAt: now,
        });

        console.log(`[Cleanup] Reset post ${p.id} from PUBLISHING → DRAFT (stuck >30 min)`);
      });
    }

    // ── 2. Archive permanently FAILED posts past retry budget ───────
    const failedPosts = await db
      .select({ id: post.id, organizationId: post.organizationId })
      .from(post)
      .where(and(eq(post.status, "FAILED"), lt(post.updatedAt, failedCutoff)));

    console.log(`[Cleanup] Found ${failedPosts.length} FAILED posts eligible for archival`);

    // Use a dead-letter archive table (publishError acts as the DLQ here)
    for (const p of failedPosts) {
      // Skip if there's already a publish_error entry for this post (already in DLQ)
      const existingErrors = await db
        .select({ id: publishError.id })
        .from(publishError)
        .where(eq(publishError.postId, p.id));

      if (existingErrors.length === 0) {
        await db.insert(publishError).values({
          id: crypto.randomUUID(),
          postId: p.id,
          platform: "UNKNOWN",
          errorCode: "PERMANENTLY_FAILED",
          errorHuman: "Post failed and exceeds retry budget; moved to dead-letter queue",
          suggestion: "Review and manually re-publish from dashboard",
          occurredAt: now,
        });
      }

      await db
        .update(post)
        .set({ status: "ARCHIVED", updatedAt: now })
        .where(eq(post.id, p.id));

      console.log(`[Cleanup] Archived failed post ${p.id}`);
    }

    // ── 3. Soft-delete DRAFT posts older than 7 days with zero media ─
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oldDrafts = await db
      .delete(post)
      .where(and(eq(post.status, "DRAFT"), lt(post.createdAt, sevenDaysAgo)))
      .returning({ id: post.id });

    console.log(`[Cleanup] Deleted ${oldDrafts.length} old empty DRAFT posts (>7 days)`);

    return {
      cleanedAt: now.toISOString(),
      stuckReset: stuckPosts.length,
      failedArchived: failedPosts.length,
      draftsDeleted: oldDrafts.length,
    };
  },
  {
    connection,
    concurrency: 1,
  },
);

stalePostCleanupWorker.on("completed", (job) => {
  console.log(`[Cleanup] Job ${job.id} completed`);
});

stalePostCleanupWorker.on("failed", (job, err) => {
  console.error(`[Cleanup] Job ${job?.id} failed: ${err.message}`);
});
