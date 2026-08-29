import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { media } from "./app";
import { organization } from "./auth";
import { contentPillar } from "./content";
import { postStatusEnum, postTypeEnum } from "./enum";
import { socialAccount } from "./social-account";

// ── Post ───────────────────────────────────────────────────────────
export const post = pgTable(
  "post",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    socialAccountId: text("social_account_id").references(() => socialAccount.id, {
      onDelete: "set null",
    }),
    caption: text("caption").default("").notNull(),
    postType: text("post_type", { enum: postTypeEnum.enumValues }).default("POST").notNull(),
    status: text("status", { enum: postStatusEnum.enumValues }).default("DRAFT").notNull(),
    scheduledAt: timestamp("scheduled_at"),
    publishedAt: timestamp("published_at"),
    autoPublish: boolean("auto_publish").default(true).notNull(),
    platformPostId: text("platform_post_id"),
    platformData: jsonb("platform_data"),
    pillarId: text("pillar_id").references(() => contentPillar.id, {
      onDelete: "set null",
    }),
    hashtagIds: jsonb("hashtag_ids").$type<string[]>().default([]),
    isAiGenerated: boolean("is_ai_generated").default(false),
    // Multi-platform grouping
    linkedGroupId: text("linked_group_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("post_org_idx").on(table.organizationId),
    index("post_status_idx").on(table.status),
    index("post_scheduled_idx").on(table.scheduledAt),
    index("post_ai_generated_idx").on(table.isAiGenerated),
    // Composite indexes for scalable queries
    index("post_org_status_idx").on(table.organizationId, table.status),
    index("post_org_scheduled_idx").on(table.organizationId, table.scheduledAt),
    index("post_org_status_scheduled_idx").on(
      table.organizationId,
      table.status,
      table.scheduledAt,
    ),
    index("post_org_published_idx").on(table.organizationId, table.publishedAt),
    uniqueIndex("post_org_external_uidx").on(table.organizationId, table.platformPostId),
    index("post_linked_group_idx").on(table.linkedGroupId),
    index("post_social_account_idx").on(table.socialAccountId),
  ],
);

// ── Post Media (junction) ──────────────────────────────────────────
export const postMedia = pgTable(
  "post_media",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    mediaId: text("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [
    uniqueIndex("post_media_post_media_uidx").on(table.postId, table.mediaId),
    index("post_media_post_idx").on(table.postId),
    index("post_media_media_idx").on(table.mediaId),
  ],
);
