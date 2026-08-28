import { connection, type PostJobData } from "@sahabatkreator/jobs";
import { db } from "@sahabatkreator/db";
import { post, socialAccount } from "@sahabatkreator/db/schema";
import { eq } from "drizzle-orm";
import { type Job, Worker } from "bullmq";

export const postPublisherWorker = new Worker<PostJobData>(
  "post",
  async (job: Job<PostJobData>) => {
    const { postId, organizationId, socialAccountId, caption, postType, mediaIds } = job.data;

    console.log(`[PostPublisher] Processing post job ${job.id}: publishing post ${postId}`);

    // Get social account details
    const account = await db.query.socialAccount.findFirst({
      where: eq(socialAccount.id, socialAccountId),
    });

    if (!account) {
      throw new Error(`Social account ${socialAccountId} not found`);
    }

    if (!account.isActive) {
      throw new Error(`Social account ${socialAccountId} is not active`);
    }

    // Update post status to publishing
    await db
      .update(post)
      .set({ status: "PUBLISHING" })
      .where(eq(post.id, postId));

    try {
      // TODO: Implement actual platform API publishing
      // For now, simulate publishing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update post status to published
      await db
        .update(post)
        .set({
          status: "PUBLISHED",
          publishedAt: new Date(),
        })
        .where(eq(post.id, postId));

      console.log(`[PostPublisher] Post ${postId} published successfully`);

      return { published: true, postId, publishedAt: new Date().toISOString() };
    } catch (error) {
      // Update post status to failed
      await db
        .update(post)
        .set({ status: "FAILED" })
        .where(eq(post.id, postId));

      throw error;
    }
  },
  {
    connection,
    concurrency: 3,
    limiter: {
      max: 10,
      duration: 60000,
    },
  },
);

postPublisherWorker.on("completed", (job) => {
  console.log(`[PostPublisher] Post job ${job.id} completed`);
});

postPublisherWorker.on("failed", (job, err) => {
  console.error(`[PostPublisher] Post job ${job?.id} failed: ${err.message}`);
});
