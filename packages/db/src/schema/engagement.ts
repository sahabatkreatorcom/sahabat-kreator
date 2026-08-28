import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth";
import { engagementItem } from "./app";
import { platformEnum } from "./enum";

// ── Conversation Thread ──────────────────────────────────────────
export const conversationThread = pgTable(
  "conversation_thread",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    subject: text("subject"),
    previewContent: text("preview_content"),
    platform: text("platform", { enum: platformEnum.enumValues }).notNull(),
    platformConversationId: text("platform_conversation_id"),
    participantUsername: text("participant_username").notNull(),
    participantName: text("participant_name"),
    participantAvatar: text("participant_avatar"),
    status: text("status", {
      enum: ["OPEN", "REPLIED", "ARCHIVED", "TRASHED"],
    })
      .default("OPEN")
      .notNull(),
    unresolvedSince: timestamp("unresolved_since"),
    lastActivityAt: timestamp("last_activity_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("conversation_thread_org_idx").on(table.organizationId),
    index("conversation_thread_status_idx").on(table.status),
    index("conversation_thread_platform_idx").on(table.platform),
    index("conversation_thread_org_status_idx").on(
      table.organizationId,
      table.status,
    ),
    index("conversation_thread_org_last_activity_idx").on(
      table.organizationId,
      table.lastActivityAt,
    ),
  ],
);

// ── Engagement Label ─────────────────────────────────────────────
export const engagementLabel = pgTable(
  "engagement_label",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").default("#6B7280"),
    icon: text("icon"),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("engagement_label_org_idx").on(table.organizationId),
    uniqueIndex("engagement_label_org_name_uidx").on(
      table.organizationId,
      table.name,
    ),
  ],
);

// ── Engagement Item Labels (Junction) ────────────────────────────
export const engagementItemLabels = pgTable(
  "engagement_item_labels",
  {
    id: text("id").primaryKey(),
    engagementItemId: text("engagement_item_id")
      .notNull()
      .references(() => engagementItem.id, { onDelete: "cascade" }),
    labelId: text("label_id")
      .notNull()
      .references(() => engagementLabel.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("engagement_item_labels_uidx").on(
      table.engagementItemId,
      table.labelId,
    ),
    index("engagement_item_labels_item_idx").on(table.engagementItemId),
    index("engagement_item_labels_label_idx").on(table.labelId),
  ],
);

// ── Canned Reply ─────────────────────────────────────────────────
export const cannedReply = pgTable(
  "canned_reply",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    content: text("content").notNull(),
    category: text("category", {
      enum: ["GREETING", "THANK_YOU", "FAQ", "APOLOGY", "PROMOTION", "CUSTOM"],
    }),
    usageCount: integer("usage_count").default(0).notNull(),
    isPublic: boolean("is_public").default(false).notNull(),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("canned_reply_org_idx").on(table.organizationId),
    index("canned_reply_category_idx").on(table.category),
    uniqueIndex("canned_reply_org_name_uidx").on(
      table.organizationId,
      table.name,
    ),
  ],
);

// ── Engagement AI Suggestion ─────────────────────────────────────
export const engagementAiSuggestion = pgTable(
  "engagement_ai_suggestion",
  {
    id: text("id").primaryKey(),
    engagementItemId: text("engagement_item_id")
      .notNull()
      .references(() => engagementItem.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    suggestion: text("suggestion").notNull(),
    tone: text("tone"),
    language: text("language").default("en"),
    isUsed: boolean("is_used").default(false).notNull(),
    isCustomized: boolean("is_customized").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("engagement_ai_suggestion_item_idx").on(table.engagementItemId),
    index("engagement_ai_suggestion_org_idx").on(table.organizationId),
  ],
);
