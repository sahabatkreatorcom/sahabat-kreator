import { db } from "@sahabatkreator/db";
import { post } from "@sahabatkreator/db/schema";
import { connection, queuePostPublish } from "@sahabatkreator/jobs";
import { Worker } from "bullmq";
import { and, eq, isNull, lte } from "drizzle-orm";

/**
 * Post Scheduler Worker
 * Runs periodically to find and publish posts that are due.
 */

export const postSchedulerWorker = new Worker(
  "scheduler",
  async () => {
    console.log("[Scheduler] Checking for posts to publish...");

    const now = new Date();

    // Find posts that are scheduled for now and haven't been published yet
    const pendingPosts = await db
      .select({
        id: post.id,
        caption: post.caption,
        postType: post.postType,
        socialAccountId: post.socialAccountId,
        organizationId: post.organizationId,
        scheduledAt: post.scheduledAt,
      })
      .from(post)
      .where(
        and(eq(post.status, "SCHEDULED"), isNull(post.publishedAt), lte(post.scheduledAt, now)),
      );

    console.log(`[Scheduler] Found ${pendingPosts.length} posts to publish`);

    const results = [];

    for (const postItem of pendingPosts) {
      try {
        // Queue the post for publishing
        await queuePostPublish({
          postId: postItem.id,
          organizationId: postItem.organizationId,
          socialAccountId: postItem.socialAccountId!,
          caption: postItem.caption || "",
          postType: postItem.postType,
        });

        results.push({ postId: postItem.id, status: "queued" });
        console.log(`[Scheduler] Queued post ${postItem.id} for publishing`);
      } catch (error) {
        console.error(`[Scheduler] Failed to queue post ${postItem.id}:`, error);
        results.push({ postId: postItem.id, status: "failed", error: (error as Error).message });
      }
    }

    return {
      checkedAt: now.toISOString(),
      totalFound: pendingPosts.length,
      results,
    };
  },
  {
    connection,
    concurrency: 1,
  },
);

postSchedulerWorker.on("completed", (job) => {
  console.log(`[Scheduler] Job ${job.id} completed`);
});

postSchedulerWorker.on("failed", (job, err) => {
  console.error(`[Scheduler] Job ${job?.id} failed: ${err.message}`);
});
