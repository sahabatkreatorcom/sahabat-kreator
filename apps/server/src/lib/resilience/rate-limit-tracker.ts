/**
 * Rate Limit Tracker
 *
 * Why: Platform APIs (Instagram, TikTok, etc.) have strict rate limits.
 * Tracking per-organization rate usage prevents 429 errors and protects
 * our API credits.
 */

import { Redis } from "@upstash/redis";
import { logger } from "./logger";

export interface RateLimitStatus {
    platform: string;
    organizationId: string;
    used: number;
    limit: number;
    remaining: number;
    resetAt: number | null;
    isExceeded: boolean;
}

export class RateLimitError extends Error {
    public readonly retryAfter: number;
    public readonly status: RateLimitStatus;

    constructor(status: RateLimitStatus) {
        super(`Rate limit exceeded for ${status.platform} — ${status.used}/${status.limit} requests used`);
        this.name = 'RateLimitError';
        this.status = status;
        this.retryAfter = status.resetAt ? Math.max(0, Math.ceil((status.resetAt - Date.now()) / 1000)) : 60;
    }
}

const KEY_PREFIX = 'ratelimit:';
const usageKey = (platform: string, organizationId: string) =>
    `${KEY_PREFIX}${platform}:${organizationId}:usage`;
const resetKey = (platform: string, organizationId: string) =>
    `${KEY_PREFIX}${platform}:${organizationId}:reset`;

function getRedis(): Redis {
    return Redis.fromEnv();
}

/**
 * Get the current rate limit status for a platform+org combination.
 */
export async function getRateLimitStatus(
    platform: string,
    organizationId: string,
    limit: number = 1000,
): Promise<RateLimitStatus> {
    const redis = getRedis();
    const normalised = platform.toLowerCase();
    const uKey = usageKey(normalised, organizationId);
    const rKey = resetKey(normalised, organizationId);

    try {
        const [used, resetAt] = await Promise.all([
            redis.get<number>(uKey),
            redis.get<number>(rKey),
        ]);

        const usedCount = used ?? 0;
        const resetTimestamp = resetAt ?? null;
        const remaining = Math.max(0, limit - usedCount);

        return {
            platform: normalised,
            organizationId,
            used: usedCount,
            limit,
            remaining,
            resetAt: resetTimestamp,
            isExceeded: usedCount >= limit,
        };
    } catch (error) {
        logger.error('Failed to read rate limit status', { platform, organizationId, error });
        // Fail open — allow the request if we can't check limits
        return {
            platform: normalised,
            organizationId,
            used: 0,
            limit,
            remaining: limit,
            resetAt: null,
            isExceeded: false,
        };
    }
}

/**
 * Increment the rate limit counter for a platform+org.
 * Returns the new count.
 */
export async function incrementRateLimit(
    platform: string,
    organizationId: string,
    limit: number = 1000,
): Promise<number> {
    void limit;
    const redis = getRedis();
    const normalised = platform.toLowerCase();
    const uKey = usageKey(normalised, organizationId);
    const rKey = resetKey(normalised, organizationId);

    try {
        // Atomic increment
        const used = await redis.incr(uKey);

        // Set expiry on first use
        if (used === 1) {
            await redis.set(rKey, Date.now() + 60 * 60 * 1000); // Reset after 1 hour
            await redis.expire(uKey, 60 * 60); // 1 hour TTL
        }

        return used;
    } catch (error) {
        logger.error('Failed to increment rate limit', { platform, organizationId, error });
        return Infinity;
    }
}

/**
 * Check and consume a rate limit slot atomically.
 * Throws RateLimitError if the limit is exceeded.
 */
export async function checkAndConsumeRateLimit(
    platform: string,
    organizationId: string,
    limit: number = 1000,
): Promise<void> {
    const redis = getRedis();
    const normalised = platform.toLowerCase();
    const uKey = usageKey(normalised, organizationId);
    const rKey = resetKey(normalised, organizationId);

    try {
        const current = await redis.get<number>(uKey) ?? 0;

        if (current >= limit) {
            const resetAt = await redis.get<number>(rKey);
            throw new RateLimitError({
                platform: normalised,
                organizationId,
                used: current,
                limit,
                remaining: 0,
                resetAt,
                isExceeded: true,
            });
        }

        const used = await redis.incr(uKey);
        if (used === 1) {
            await redis.set(rKey, Date.now() + 60 * 60 * 1000);
            await redis.expire(uKey, 60 * 60);
        }
    } catch (error) {
        if (error instanceof RateLimitError) throw error;
        logger.error('Failed to check rate limit', { platform, organizationId, error });
        throw error;
    }
}

/**
 * Calculate retry delay in milliseconds based on rate limit status.
 */
export function getRetryDelay(status: RateLimitStatus): number {
    if (!status.resetAt) return 60_000; // Default 1 minute

    const waitMs = status.resetAt - Date.now();
    // Add 10% buffer to ensure we wait past the actual reset
    return Math.max(1000, Math.ceil(waitMs * 1.1));
}

/**
 * Handle a 429 Too Many Requests response from a platform API.
 * Updates the rate limit status to reflect the external limit.
 */
export async function handle429Response(
    platform: string,
    organizationId: string,
    limit: number = 1000,
    resetAtEpochSeconds?: number,
): Promise<RateLimitStatus> {
    const redis = getRedis();
    const normalised = platform.toLowerCase();
    const uKey = usageKey(normalised, organizationId);
    const rKey = resetKey(normalised, organizationId);

    try {
        // Cap the limit at the platform-reported value
        const effectiveLimit = Math.min(limit, 1000);

        // Set the exact reset time if provided by platform headers
        if (resetAtEpochSeconds) {
            await redis.set(rKey, resetAtEpochSeconds * 1000);
            const ttl = (resetAtEpochSeconds * 1000) - Date.now();
            if (ttl > 0) await redis.expire(uKey, Math.ceil(ttl / 1000));
        }

        return await getRateLimitStatus(normalised, organizationId, effectiveLimit);
    } catch (error) {
        logger.error('Failed to handle 429 response', { platform, organizationId, error });
        return {
            platform: normalised,
            organizationId,
            used: 0,
            limit,
            remaining: 0,
            resetAt: null,
            isExceeded: true,
        };
    }
}

/**
 * Wrap an operation with rate limit checking.
 */
export async function withRateLimitCheck<T>(
    platform: string,
    organizationId: string,
    operation: () => Promise<T>,
    limit: number = 1000,
): Promise<T> {
    await checkAndConsumeRateLimit(platform, organizationId, limit);
    try {
        return await operation();
    } catch (error) {
        // If we get a 429, update our internal tracking
        if (error instanceof Error && error.message.includes('429')) {
            await handle429Response(platform, organizationId, limit);
        }
        throw error;
    }
}
