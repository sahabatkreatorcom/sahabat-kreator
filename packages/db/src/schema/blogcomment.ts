import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { blogPost } from "./blogpost";

// Define column types explicitly to avoid circular type inference
const blogCommentColumns = {
  id: text("id").primaryKey(),
  postId: text("post_id")
    .notNull()
    .references(() => blogPost.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  parentId: text("parent_id"),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email"),
  authorUrl: text("author_url"),
  content: text("content").notNull(),
  isApproved: boolean("is_approved").default(false),
  isSpam: boolean("is_spam").default(false),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
};

export const blogComment = pgTable("blog_comment", blogCommentColumns, (table) => [
  index("blog_comment_post_idx").on(table.postId),
  index("blog_comment_org_idx").on(table.organizationId),
  index("blog_comment_approved_idx").on(table.isApproved),
  index("blog_comment_post_approved_idx").on(table.postId, table.isApproved),
]);
