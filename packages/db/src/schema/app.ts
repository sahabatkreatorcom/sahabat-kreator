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
import { engagementItemTypeEnum, notificationTypeEnum, platformEnum, sentimentEnum } from "./enum";

// ── Media ──────────────────────────────────────────────────────────
export const media = pgTable(
  "media",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    mimeType: text("mime_type").notNull(),
    fileName: text("file_name"),
    fileSize: integer("file_size"),
    width: integer("width"),
    height: integer("height"),
    duration: integer("duration"),
    r2Key: text("r2_key"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("media_org_idx").on(table.organizationId),
    index("media_org_created_idx").on(table.organizationId, table.createdAt),
  ],
);

// ── Calendar Note ──────────────────────────────────────────────────
export const calendarNote = pgTable(
  "calendar_note",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    date: timestamp("date").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("calendar_note_org_idx").on(table.organizationId),
    index("calendar_note_date_idx").on(table.date),
    index("calendar_note_org_date_idx").on(table.organizationId, table.date),
  ],
);

// ── Notification ───────────────────────────────────────────────────
export const notification = pgTable(
  "notification",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id").references(() => organization.id, {
      onDelete: "cascade",
    }),
    type: text("type", { enum: notificationTypeEnum.enumValues }).notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    link: text("link"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notification_user_idx").on(table.userId),
    index("notification_is_read_idx").on(table.isRead),
    index("notification_created_idx").on(table.createdAt),
    index("notification_user_read_idx").on(table.userId, table.isRead),
    index("notification_org_read_idx").on(table.organizationId, table.isRead),
  ],
);

// ── Organization Setting ───────────────────────────────────────────
export const organizationSetting = pgTable(
  "organization_setting",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    value: text("value").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("org_setting_org_idx").on(table.organizationId),
    index("org_setting_key_idx").on(table.key),
    uniqueIndex("org_setting_org_key_uidx").on(table.organizationId, table.key),
  ],
);

// ── Engagement Item ────────────────────────────────────────────────
export const engagementItem = pgTable(
  "engagement_item",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    type: text("type", { enum: engagementItemTypeEnum.enumValues }).notNull(),
    platform: text("platform", { enum: platformEnum.enumValues }).notNull(),
    platformAccountId: text("platform_account_id"),
    authorName: text("author_name").notNull(),
    authorUsername: text("author_username").notNull(),
    authorAvatar: text("author_avatar"),
    content: text("content").notNull(),
    sentiment: text("sentiment", { enum: sentimentEnum.enumValues }),
    isRead: boolean("is_read").default(false).notNull(),
    isReplied: boolean("is_replied").default(false).notNull(),
    postId: text("post_id"),
    postCaption: text("post_caption"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("engagement_org_idx").on(table.organizationId),
    index("engagement_type_idx").on(table.type),
    index("engagement_platform_idx").on(table.platform),
    index("engagement_unread_idx").on(table.isRead),
    index("engagement_org_read_idx").on(table.organizationId, table.isRead),
  ],
);
