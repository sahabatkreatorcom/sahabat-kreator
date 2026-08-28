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
import { organization, user } from "./auth";
import { skChatRoleEnum, skExperimentStatusEnum } from "./enum";
import { skReport } from "./sk";

// ── SK Chat Session ────────────────────────────────────────────────
export const skChatSession = pgTable(
  "sk_chat_session",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").default("SK chat").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("sk_chat_session_org_idx").on(table.organizationId),
    index("sk_chat_session_user_idx").on(table.userId),
    index("sk_chat_session_org_updated_idx").on(table.organizationId, table.updatedAt),
  ],
);

// ── SK Chat Message ────────────────────────────────────────────────
export const skChatMessage = pgTable(
  "sk_chat_message",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => skChatSession.id, { onDelete: "cascade" }),
    role: text("role", { enum: skChatRoleEnum.enumValues }).notNull(),
    content: text("content").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("sk_chat_message_session_idx").on(table.sessionId),
    index("sk_chat_message_session_created_idx").on(table.sessionId, table.createdAt),
  ],
);

// ── SK Media Analysis ──────────────────────────────────────────────
export const skMediaAnalysis = pgTable(
  "sk_media_analysis",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    mediaId: text("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    mediaHash: text("media_hash"),
    model: text("model"),
    frameCount: integer("frame_count").default(0),
    ocrText: text("ocr_text"),
    transcript: text("transcript"),
    sceneSummary: text("scene_summary"),
    analysis: jsonb("analysis").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("sk_media_analysis_media_uidx").on(table.mediaId, table.mediaHash),
    index("sk_media_analysis_org_idx").on(table.organizationId),
  ],
);

// ── SK Experiment ──────────────────────────────────────────────────
export const skExperiment = pgTable(
  "sk_experiment",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    reportId: text("report_id").references(() => skReport.id, {
      onDelete: "cascade",
    }),
    title: text("title").notNull(),
    hypothesis: text("hypothesis"),
    platform: text("platform"),
    metric: text("metric").notNull(),
    status: text("status", { enum: skExperimentStatusEnum.enumValues })
      .default("PENDING")
      .notNull(),
    startAt: timestamp("start_at"),
    endAt: timestamp("end_at"),
    baseline: jsonb("baseline"),
    result: jsonb("result"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("sk_experiment_org_idx").on(table.organizationId),
    index("sk_experiment_org_status_idx").on(table.organizationId, table.status),
    index("sk_experiment_report_idx").on(table.reportId),
  ],
);

// ── SK Platform Knowledge ──────────────────────────────────────────
export const skPlatformKnowledge = pgTable(
  "sk_platform_knowledge",
  {
    id: text("id").primaryKey(),
    platform: text("platform").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    sourceUrl: text("source_url"),
    effectiveAt: timestamp("effective_at"),
    expiresAt: timestamp("expires_at"),
    confidence: integer("confidence").default(80),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("sk_platform_knowledge_platform_idx").on(table.platform),
    index("sk_platform_knowledge_active_idx").on(table.platform, table.isActive),
  ],
);
