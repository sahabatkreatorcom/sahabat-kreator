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
import { organization } from "./auth";

// ── Blog Post ──────────────────────────────────────────────────────
export const blogPost = pgTable(
  "blog_post",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    // ── Content ──────────────────────────────────────────────────
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    excerpt: text("excerpt"),
    body: text("body").notNull(),
    // ── SEO ──────────────────────────────────────────────────────
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    metaKeywords: text("meta_keywords"),
    canonicalUrl: text("canonical_url"),
    ogImage: text("og_image"),
    twitterCard: text("twitter_card"),
    structuredData: jsonb("structured_data"),
    // ── Publishing ───────────────────────────────────────────────
    status: text("status").default("DRAFT").notNull(),
    publishedAt: timestamp("published_at"),
    scheduledAt: timestamp("scheduled_at"),
    // ── Attribution ──────────────────────────────────────────────
    authorId: text("author_id"),
    // ── Categories & Tags ────────────────────────────────────────
    categories: jsonb("categories").$type<string[]>().default([]),
    tags: jsonb("tags").$type<string[]>().default([]),
    // ── Readability ──────────────────────────────────────────────
    readingTimeMinutes: integer("reading_time_minutes").default(0),
    wordCount: integer("word_count").default(0),
    // ── Engagement ───────────────────────────────────────────────
    viewCount: integer("view_count").default(0),
    likeCount: integer("like_count").default(0),
    commentCount: integer("comment_count").default(0),
    // ── AI Generated ─────────────────────────────────────────────
    isAiGenerated: boolean("is_ai_generated").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("blog_post_slug_org_uidx").on(table.organizationId, table.slug),
    index("blog_post_org_idx").on(table.organizationId),
    index("blog_post_status_idx").on(table.status),
    index("blog_post_published_idx").on(table.publishedAt),
    index("blog_post_org_status_published_idx").on(
      table.organizationId,
      table.status,
      table.publishedAt,
    ),
  ],
);
