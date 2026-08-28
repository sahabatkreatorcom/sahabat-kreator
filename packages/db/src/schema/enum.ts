import { pgEnum } from "drizzle-orm/pg-core";

// ── Engagement Thread Status ─────────────────────────────────────
export const threadStatusEnum = pgEnum("thread_status", [
  "OPEN",
  "REPLIED",
  "ARCHIVED",
  "TRASHED",
]);

// ── Push Notification Queue Status ───────────────────────────────
export const pushNotificationStatusEnum = pgEnum("push_notification_status", [
  "PENDING",
  "SENT",
  "FAILED",
  "EXPIRED",
]);

// ── Email Report Status ──────────────────────────────────────────
export const emailReportStatusEnum = pgEnum("email_report_status", [
  "PENDING",
  "GENERATING",
  "COMPLETED",
  "FAILED",
]);

// ── Canned Reply Category ────────────────────────────────────────
export const cannedReplyCategoryEnum = pgEnum("canned_reply_category", [
  "GREETING",
  "THANK_YOU",
  "FAQ",
  "APOLOGY",
  "PROMOTION",
  "CUSTOM",
]);

// ── UTM Campaign Type ────────────────────────────────────────────
export const utmCampaignTypeEnum = pgEnum("utm_campaign_type", [
  "SOCIAL",
  "EMAIL",
  "PAID",
  "ORGANIC",
  "AFFILIATE",
  "CUSTOM",
]);

// ── Sound Platform ───────────────────────────────────────────────
export const soundPlatformEnum = pgEnum("sound_platform", [
  "INSTAGRAM",
  "TIKTOK",
  "YOUTUBE",
]);

// ── Shop Connection Platform ─────────────────────────────────────
export const shopConnectionPlatformEnum = pgEnum("shop_connection_platform", [
  "SHOPIFY",
  "WOOCOMMERCE",
  "SHOPEE",
  "MANUAL",
]);

// ── Brand Voice Tone ─────────────────────────────────────────────
export const brandVoiceToneEnum = pgEnum("brand_voice_tone", [
  "PROFESSIONAL",
  "CASUAL",
  "FUN",
  "INSPIRING",
  "EDUCATIONAL",
  "PERSONAL",
]);

// ── Platform ─────────────────────────────────────────────────────
export const platformEnum = pgEnum("platform", [
  "INSTAGRAM",
  "TIKTOK",
  "YOUTUBE",
  "FACEBOOK",
  "THREADS",
  "LINKEDIN",
  "PINTEREST",
  "BLUESKY",
  "GOOGLE_BUSINESS",
  "MANUAL",
]);

// ── Organization Tier ────────────────────────────────────────────
export const orgTierEnum = pgEnum("org_tier", [
  "FREE",
  "STARTER",
  "PRO",
  "BUSINESS",
  "ENTERPRISE",
]);

// ── Member Role ──────────────────────────────────────────────────
export const memberRoleEnum = pgEnum("member_role", [
  "OWNER",
  "ADMIN",
  "MEMBER",
  "VIEWER",
]);

// ── Post Status ──────────────────────────────────────────────────
export const postStatusEnum = pgEnum("post_status", [
  "DRAFT",
  "SCHEDULED",
  "PUBLISHED",
  "FAILED",
  "ARCHIVED",
  "PUBLISHING",
]);

// ── Post Type ────────────────────────────────────────────────────
export const postTypeEnum = pgEnum("post_type", [
  "POST",
  "STORY",
  "REEL",
  "CAROUSEL",
  "VIDEO",
]);

// ── Engagement Item Type ─────────────────────────────────────────
export const engagementItemTypeEnum = pgEnum("engagement_item_type", [
  "COMMENT",
  "DM",
  "MENTION",
  "TAG",
  "REVIEW",
  "STORY_MENTION",
  "STORY_REPLY",
  "PUBLIC_POST",
]);

// ── Notification Type ────────────────────────────────────────────
export const notificationTypeEnum = pgEnum("notification_type", [
  "COMMENT",
  "DM",
  "MENTION",
  "LIKE",
  "FOLLOW",
  "SYSTEM",
]);

// ── Sentiment ────────────────────────────────────────────────────
export const sentimentEnum = pgEnum("sentiment", [
  "POSITIVE",
  "NEGATIVE",
  "NEUTRAL",
]);

// ── Draft Action ─────────────────────────────────────────────────
export const draftActionEnum = pgEnum("draft_action", [
  "CREATE",
  "EDIT",
  "DUPLICATE",
  "DELETE",
  "MOVE",
]);

// ── Payment Status ───────────────────────────────────────────────
export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
  "COMPLETED",
]);

// ── SK Report Status ─────────────────────────────────────────────
export const skReportStatusEnum = pgEnum("sk_report_status", [
  "PENDING",
  "GENERATING",
  "COMPLETED",
  "FAILED",
]);

// ── SK Report Trigger ────────────────────────────────────────────
export const skReportTriggerEnum = pgEnum("sk_report_trigger", [
  "PROACTIVE",
  "REACTIVE",
  "SCHEDULED",
  "MANUAL",
  "CHAT",
]);

// ── SK Recommendation Category ───────────────────────────────────
export const skRecommendationCategoryEnum = pgEnum("sk_recommendation_category", [
  "CONTENT",
  "TIMING",
  "HASHTAG",
  "CAPTION",
  "PLATFORM",
]);

// ── SK Recommendation Priority ───────────────────────────────────
export const skRecommendationPriorityEnum = pgEnum("sk_recommendation_priority", [
  "HIGH",
  "MEDIUM",
  "LOW",
]);

// ── SK Recommendation Status ─────────────────────────────────────
export const skRecommendationStatusEnum = pgEnum("sk_recommendation_status", [
  "PENDING",
  "APPLIED",
  "IGNORED",
  "EXPIRED",
]);

// ── SK Chat Role ─────────────────────────────────────────────────
export const skChatRoleEnum = pgEnum("sk_chat_role", [
  "USER",
  "ASSISTANT",
  "SYSTEM",
]);

// ── SK Experiment Status ─────────────────────────────────────────
export const skExperimentStatusEnum = pgEnum("sk_experiment_status", [
  "PENDING",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);
