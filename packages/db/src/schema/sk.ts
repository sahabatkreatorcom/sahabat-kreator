import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { organization } from "./auth";
import {
  skRecommendationCategoryEnum,
  skRecommendationPriorityEnum,
  skRecommendationStatusEnum,
  skReportStatusEnum,
  skReportTriggerEnum,
} from "./enum";
import { socialAccount } from "./social-account";

// ── SK Report ──────────────────────────────────────────────────────
export const skReport = pgTable(
  "sk_report",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    trigger: text("trigger", { enum: skReportTriggerEnum.enumValues })
      .default("PROACTIVE")
      .notNull(),
    status: text("status", { enum: skReportStatusEnum.enumValues }).default("COMPLETED").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    overallScore: integer("overall_score"),
    scoreBreakdown: jsonb("score_breakdown"),
    confidence: integer("confidence").default(0),
    model: text("model"),
    inputHash: text("input_hash"),
    dataStartDate: timestamp("data_start_date"),
    dataEndDate: timestamp("data_end_date"),
    generatedById: text("generated_by_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("sk_report_org_idx").on(table.organizationId),
    index("sk_report_status_idx").on(table.status),
    index("sk_report_org_created_idx").on(table.organizationId, table.createdAt),
    index("sk_report_org_status_idx").on(table.organizationId, table.status),
  ],
);

// ── SK Recommendation ──────────────────────────────────────────────
export const skRecommendation = pgTable(
  "sk_recommendation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    socialAccountId: text("social_account_id").references(() => socialAccount.id, {
      onDelete: "set null",
    }),
    reportId: text("report_id").references(() => skReport.id, {
      onDelete: "cascade",
    }),
    platform: text("platform"),
    category: text("category", { enum: skRecommendationCategoryEnum.enumValues }).notNull(),
    priority: text("priority", { enum: skRecommendationPriorityEnum.enumValues })
      .default("MEDIUM")
      .notNull(),
    status: text("status", { enum: skRecommendationStatusEnum.enumValues })
      .default("PENDING")
      .notNull(),
    title: text("title").notNull(),
    advice: text("advice"),
    rationale: text("rationale"),
    evidence: jsonb("evidence"),
    citations: jsonb("citations"),
    impactBaseline: jsonb("impact_baseline"),
    impactResult: jsonb("impact_result"),
    impactCheckedAt: timestamp("impact_checked_at"),
    confidence: integer("confidence").default(0),
    dueAt: timestamp("due_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("sk_recommendation_org_idx").on(table.organizationId),
    index("sk_recommendation_status_idx").on(table.status),
    index("sk_recommendation_org_status_idx").on(table.organizationId, table.status),
    index("sk_recommendation_social_account_idx").on(table.socialAccountId),
    index("sk_recommendation_org_social_status_idx").on(
      table.organizationId,
      table.socialAccountId,
      table.status,
    ),
    index("sk_recommendation_org_platform_idx").on(table.platform),
    index("sk_recommendation_report_idx").on(table.reportId),
  ],
);

// ── SK Brand Knowledge ─────────────────────────────────────────────
export const skBrandKnowledge = pgTable(
  "sk_brand_knowledge",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    websiteUrl: text("website_url"),
    audience: text("audience"),
    positioning: text("positioning"),
    products: text("products"),
    offers: text("offers"),
    voiceRules: text("voice_rules"),
    bannedTopics: text("banned_topics"),
    learnedInsights: jsonb("learned_insights"),
    pendingInsights: jsonb("pending_insights"),
    websiteScanSummary: jsonb("website_scan_summary"),
    websiteScannedAt: timestamp("website_scanned_at"),
    updatedBySkAt: timestamp("updated_by_sk_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("sk_brand_knowledge_org_uidx").on(table.organizationId),
    index("sk_brand_knowledge_org_idx").on(table.organizationId),
  ],
);
