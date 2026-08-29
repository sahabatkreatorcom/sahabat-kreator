/**
 * Publishing Lock Service
 * Prevents double-publish race conditions using Redis distributed locks.
 *
 * Why: Users clicking "Publish" twice rapidly, or two workers picking up
 * the same scheduled job, could result in duplicate posts on social platforms.
 */

import crypto from "node:crypto";
import { Redis } from "@upstash/redis";
import { logger } from "./logger";

/**
 * Lock TTL in seconds — prevents deadlocks if worker crashes.
 * Why: Set to 15 min so large video uploads (~90MB) don't outlive the lock.
 * Must be less than STALE_THRESHOLD_MINUTES (20 min) in stale-post-cleanup.ts.
 */
const LOCK_TTL_SECONDS = 900; // 15 minutes
const LOCK_PREFIX = "publish-lock:";

function getRedis(): Redis {
  return Redis.fromEnv();
}

/**
 * Acquire a publishing lock for a post.
 * Uses Redis SET NX (set if not exists) for atomic lock acquisition.
 */
export async function acquirePublishLock(postId: string): Promise<string | null> {
  const redis = getRedis();
  const lockKey = `${LOCK_PREFIX}${postId}`;
  const lockToken = crypto.randomUUID();

  try {
    const result = await redis.set(lockKey, lockToken, { ex: LOCK_TTL_SECONDS, nx: true });

    if (result === "OK") {
      logger.info("Publishing lock acquired", { postId, lockToken });
      return lockToken;
    }

    const existingToken = await redis.get(lockKey);
    logger.warn("Publishing lock already held", { postId, existingToken });
    return null;
  } catch (error) {
    logger.error(
      "Publishing lock acquisition failed, blocking publish to avoid duplicate platform posts",
      { postId, error },
    );
    return null;
  }
}

/**
 * Release a publishing lock.
 * Only releases if the lock token matches (prevents releasing another process's lock).
 */
export async function releasePublishLock(postId: string, lockToken: string): Promise<void> {
  const redis = getRedis();
  const lockKey = `${LOCK_PREFIX}${postId}`;

  try {
    const script = `
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            else
                return 0
            end
        `;

    const result = await redis.eval(script, [lockKey], [lockToken]);

    if (result === 1) {
      logger.info("Publishing lock released", { postId });
    } else {
      logger.warn("Lock not held or token mismatch during release", { postId });
    }
  } catch (error) {
    logger.error("Failed to release publishing lock", { postId, error });
  }
}

/**
 * Force release a publishing lock regardless of token.
 * Use ONLY for retry scenarios where we know the previous attempt failed.
 */
export async function forceReleasePublishLock(postId: string): Promise<void> {
  const redis = getRedis();
  const lockKey = `${LOCK_PREFIX}${postId}`;

  try {
    const deleted = await redis.del(lockKey);
    if (deleted === 1) {
      logger.info("Publishing lock force-released for retry", { postId });
    } else {
      logger.info("No lock found to force-release", { postId });
    }
  } catch (error) {
    logger.error("Failed to force-release publishing lock", { postId, error });
  }
}

/**
 * Check if a post is currently locked for publishing.
 */
export async function isPublishLocked(postId: string): Promise<boolean> {
  const redis = getRedis();
  const lockKey = `${LOCK_PREFIX}${postId}`;

  try {
    const exists = await redis.exists(lockKey);
    return exists === 1;
  } catch (error) {
    logger.error("Failed to check publishing lock", { postId, error });
    return true;
  }
}

/**
 * Execute an operation with a publishing lock.
 * Automatically acquires and releases the lock.
 */
export async function withPublishLock<T>(postId: string, operation: () => Promise<T>): Promise<T> {
  const lockToken = await acquirePublishLock(postId);

  if (!lockToken) {
    throw new Error(`Post ${postId} is already being published`);
  }

  try {
    return await operation();
  } finally {
    await releasePublishLock(postId, lockToken);
  }
}
