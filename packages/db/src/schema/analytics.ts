import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { post } from "./post";
import { platformEnum } from "./enum";

// ── Post Analytics (Daily Snapshot) ──────────────────────────────
export const postAnalytics = pgTable(
  "post_analytics",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    platform: text("platform", { enum: platformEnum.enumValues }).notNull(),
    date: timestamp("date").notNull(),
    views: integer("views").default(0).notNull(),
    likes: integer("likes").default(0).notNull(),
    comments: integer("comments").default(0).notNull(),
    shares: integer("shares").default(0).notNull(),
    engagementRate: integer("engagement_rate"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("post_analytics_post_idx").on(table.postId),
    index("post_analytics_org_idx").on(table.organizationId),
    index("post_analytics_date_idx").on(table.date),
    uniqueIndex("post_analytics_post_date_uidx").on(table.postId, table.date),
  ],
);

// ── Hashtag Performance ──────────────────────────────────────────
export const hashtagPerformance = pgTable(
  "hashtag_performance",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    hashtag: text("hashtag").notNull(),
    date: timestamp("date").notNull(),
    usageCount: integer("usage_count").default(0).notNull(),
    totalReach: integer("total_reach").default(0),
    totalEngagement: integer("total_engagement").default(0),
    avgEngagementRate: integer("avg_engagement_rate"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("hashtag_perf_org_idx").on(table.organizationId),
    index("hashtag_perf_hashtag_idx").on(table.hashtag),
    index("hashtag_perf_date_idx").on(table.date),
    uniqueIndex("hashtag_perf_org_hashtag_date_uidx").on(
      table.organizationId,
      table.hashtag,
      table.date,
    ),
  ],
);

// ── Best Time Schedule ───────────────────────────────────────────
export const bestTimeSchedule = pgTable(
  "best_time_schedule",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    platform: text("platform", { enum: platformEnum.enumValues }).notNull(),
    dayOfWeek: integer("day_of_week").notNull(),
    hourOfDay: integer("hour_of_day").notNull(),
    engagementScore: integer("engagement_score").notNull(),
    dataPoints: integer("data_points").default(0).notNull(),
    computedAt: timestamp("computed_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("best_time_org_idx").on(table.organizationId),
    index("best_time_platform_idx").on(table.platform),
    uniqueIndex("best_time_org_platform_uidx").on(
      table.organizationId,
      table.platform,
    ),
  ],
);

// ── Analytics Period Snapshot ────────────────────────────────────
export const analyticsPeriodSnapshot = pgTable(
  "analytics_period_snapshot",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    periodStart: timestamp("period_start").notNull(),
    periodEnd: timestamp("period_end").notNull(),
    totalPosts: integer("total_posts").default(0).notNull(),
    totalViews: integer("total_views").default(0).notNull(),
    totalLikes: integer("total_likes").default(0).notNull(),
    totalComments: integer("total_comments").default(0).notNull(),
    totalShares: integer("total_shares").default(0).notNull(),
    avgEngagementRate: integer("avg_engagement_rate"),
    previousPeriodTotalViews: integer("previous_period_total_views"),
    previousPeriodTotalLikes: integer("previous_period_total_likes"),
    previousPeriodTotalComments: integer("previous_period_total_comments"),
    viewsGrowthPercent: integer("views_growth_percent"),
    likesGrowthPercent: integer("likes_growth_percent"),
    commentsGrowthPercent: integer("comments_growth_percent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("analytics_period_org_idx").on(table.organizationId),
    index("analytics_period_start_idx").on(table.periodStart),
    index("analytics_period_end_idx").on(table.periodEnd),
    index("analytics_period_org_dates_idx").on(
      table.organizationId,
      table.periodStart,
      table.periodEnd,
    ),
  ],
);

// ── Email Report ─────────────────────────────────────────────────
export const emailReport = pgTable(
  "email_report",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    periodStart: timestamp("period_start").notNull(),
    periodEnd: timestamp("period_end").notNull(),
    status: text("status", {
      enum: ["PENDING", "GENERATING", "COMPLETED", "FAILED"],
    })
      .default("PENDING")
      .notNull(),
    recipientEmail: text("recipient_email").notNull(),
    reportUrl: text("report_url"),
    generatedAt: timestamp("generated_at"),
    error: text("error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("email_report_org_idx").on(table.organizationId),
    index("email_report_status_idx").on(table.status),
    index("email_report_created_idx").on(table.createdAt),
  ],
);
