import { randomUUID } from "node:crypto";
import { db } from "@sahabatkreator/db";
import { engagementItem } from "@sahabatkreator/db/schema";
import type { WebhookEvent } from "./webhook-dispatcher";

/**
 * Instagram/Facebook webhook handler
 * Processes comments, mentions, and story mentions
 */
export async function handleInstagramWebhook(event: WebhookEvent): Promise<void> {
  const { platform, organizationId, accountId, rawPayload } = event;

  // Instagram Graph API webhook format
  const entry = (rawPayload as any)?.entry?.[0];
  if (!entry) return;

  for (const field of entry.changes || []) {
    const value = field.value as any;
    const verb = value.verb as string;
    const createdTime = value.created_time || value.parent_created_time;
    const timestamp = createdTime ? new Date(Number.parseInt(createdTime, 10) * 1000) : new Date();

    if (verb === "comment") {
      const from = value.from as any;
      const timestampDate = timestamp;

      await db.insert(engagementItem).values({
        id: randomUUID(),
        organizationId,
        type: "COMMENT",
        platform: platform as any,
        platformAccountId: accountId ?? undefined,
        authorName: from?.name || "Unknown",
        authorUsername: from?.username || "",
        authorAvatar: from?.pic || undefined,
        content: value.message || "",
        sentiment: null,
        isRead: false,
        isReplied: false,
        createdAt: timestampDate,
        updatedAt: timestampDate,
      });
    }

    if (verb === "mention" || value.tag?.length > 0) {
      const from = value.from as any;
      await db.insert(engagementItem).values({
        id: randomUUID(),
        organizationId,
        type: "MENTION",
        platform: platform as any,
        platformAccountId: accountId ?? undefined,
        authorName: from?.name || "Unknown",
        authorUsername: from?.username || "",
        authorAvatar: from?.pic || undefined,
        content: value.message || "",
        sentiment: null,
        isRead: false,
        isReplied: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
  }
}

/**
 * TikTok webhook handler
 */
export async function handleTikTokWebhook(event: WebhookEvent): Promise<void> {
  const { organizationId, accountId, rawPayload, platform } = event;

  const eventType = event.eventType;

  if (eventType === "comment.create" || eventType === "comment") {
    const comment = rawPayload.comment as any;
    const user = rawPayload.user as any;
    const timestamp = comment.create_time ? new Date(comment.create_time * 1000) : new Date();

    await db.insert(engagementItem).values({
      id: randomUUID(),
      organizationId,
      type: "COMMENT",
      platform: platform as any,
      platformAccountId: accountId ?? undefined,
      authorName: user?.nickname || "Unknown",
      authorUsername: user?.unique_id || "",
      authorAvatar: user?.avatar_url || undefined,
      content: comment.text || "",
      sentiment: null,
      isRead: false,
      isReplied: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  if (eventType === "like.create" || eventType === "like") {
    const like = rawPayload.like as any;
    const timestamp = like.create_time ? new Date(like.create_time * 1000) : new Date();

    await db.insert(engagementItem).values({
      id: randomUUID(),
      organizationId,
      type: "MENTION",
      platform: platform as any,
      platformAccountId: accountId ?? undefined,
      authorName: "Like",
      authorUsername: "",
      authorAvatar: undefined,
      content: "Liked your content",
      sentiment: "POSITIVE",
      isRead: false,
      isReplied: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }
}

/**
 * YouTube webhook handler (PubSub)
 */
export async function handleYouTubeWebhook(event: WebhookEvent): Promise<void> {
  const { organizationId, accountId, rawPayload, platform } = event;

  const data = rawPayload.data as any;
  if (!data) return;

  const timestamp = data.snippet?.publishedAt ? new Date(data.snippet.publishedAt) : new Date();

  if (event.eventType === "youtube.commentThread.list" || event.eventType === "commentThread") {
    const comment = data.items?.[0]?.snippet?.topLevelComment?.snippet as any;
    if (comment) {
      await db.insert(engagementItem).values({
        id: randomUUID(),
        organizationId,
        type: "COMMENT",
        platform: platform as any,
        platformAccountId: accountId ?? undefined,
        authorName: comment.authorDisplayName || "Unknown",
        authorUsername: "",
        authorAvatar: undefined,
        content: comment.textOriginal || "",
        sentiment: null,
        isRead: false,
        isReplied: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
  }
}

/**
 * Threads webhook handler (Instagram-compatible)
 */
export async function handleThreadsWebhook(event: WebhookEvent): Promise<void> {
  // Threads uses the same Instagram Graph API webhook format
  await handleInstagramWebhook(event);
}

/**
 * Pinterest webhook handler
 */
export async function handlePinterestWebhook(event: WebhookEvent): Promise<void> {
  const { organizationId, accountId, rawPayload, platform } = event;
  const timestamp = new Date();

  const notification = rawPayload.notification as any;
  if (!notification) return;

  const actor = notification.actor as any;

  if (notification.type === "pin_comment" || notification.category === "comment") {
    await db.insert(engagementItem).values({
      id: randomUUID(),
      organizationId,
      type: "COMMENT",
      platform: platform as any,
      platformAccountId: accountId ?? undefined,
      authorName: actor?.name || "Unknown",
      authorUsername: actor?.username || "",
      authorAvatar: actor?.image_url || undefined,
      content: notification.body?.text || "",
      sentiment: null,
      isRead: false,
      isReplied: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  if (notification.type === "follower") {
    await db.insert(engagementItem).values({
      id: randomUUID(),
      organizationId,
      type: "MENTION",
      platform: platform as any,
      platformAccountId: accountId ?? undefined,
      authorName: actor?.name || "Unknown",
      authorUsername: actor?.username || "",
      authorAvatar: actor?.image_url || undefined,
      content: "Started following you",
      sentiment: "POSITIVE",
      isRead: false,
      isReplied: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }
}

/**
 * LinkedIn webhook handler
 */
export async function handleLinkedInWebhook(event: WebhookEvent): Promise<void> {
  const { organizationId, accountId, rawPayload, platform } = event;
  const timestamp = new Date();

  const elements = (rawPayload.elements as any[]) || [];
  for (const element of elements) {
    const value = element.value as any;
    if (!value) continue;

    const eventSubject = value.eventSubject as string;
    const actor = value.actor as any;
    const createTime = value.time ? new Date(value.time * 1000) : timestamp;

    let type: "COMMENT" | "MENTION" = "MENTION";
    let content = "";

    if (eventSubject?.includes("commentCreated")) {
      type = "COMMENT";
      content = value.displayText || value.comment?.text || "";
    } else if (eventSubject?.includes("mentioned")) {
      type = "MENTION";
      content = value.displayText || "";
    }

    if (type || content) {
      await db.insert(engagementItem).values({
        id: randomUUID(),
        organizationId,
        type,
        platform: platform as any,
        platformAccountId: accountId ?? undefined,
        authorName: actor?.name || "Unknown",
        authorUsername: actor?.vanityName || "",
        authorAvatar: actor?.pictureUrl || undefined,
        content,
        sentiment: null,
        isRead: false,
        isReplied: false,
        createdAt: createTime,
        updatedAt: createTime,
      });
    }
  }
}
