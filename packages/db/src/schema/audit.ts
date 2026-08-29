import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization, user } from "./auth";
import { draftActionEnum } from "./enum";

// ── Audit Action Type (application-level type safety) ──────────────
export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "CREATE_POST"
  | "UPDATE_POST"
  | "DELETE_POST"
  | "PUBLISH_POST"
  | "CONNECT_ACCOUNT"
  | "DISCONNECT_ACCOUNT"
  | "INVITE_MEMBER"
  | "REMOVE_MEMBER"
  | "UPDATE_ROLE"
  | "CHANGE_SETTINGS"
  | "CREATE_INVITATION"
  | "ACCEPT_INVITATION";

// ── Draft Interaction (ML learning) ────────────────────────────────
export const draftInteraction = pgTable(
  "draft_interaction",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action", { enum: draftActionEnum.enumValues }).notNull(),
    platform: text("platform"),
    postType: text("post_type"),
    scheduledAtDelta: integer("scheduled_at_delta"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("draft_interaction_org_idx").on(table.organizationId),
    index("draft_interaction_action_idx").on(table.action),
    index("draft_interaction_platform_posttype_idx").on(table.platform, table.postType),
  ],
);

// ── Publish Error ──────────────────────────────────────────────────
export const publishError = pgTable(
  "publish_error",
  {
    id: text("id").primaryKey(),
    postId: text("post_id").notNull(),
    platform: text("platform").notNull(),
    errorCode: text("error_code").notNull(),
    errorRaw: text("error_raw"),
    errorHuman: text("error_human").notNull(),
    suggestion: text("suggestion"),
    occurredAt: timestamp("occurred_at").defaultNow().notNull(),
  },
  (table) => [index("publish_error_post_idx").on(table.postId)],
);

// ── Activity Log ───────────────────────────────────────────────────
export const activityLog = pgTable(
  "activity_log",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    userName: text("user_name"),
    action: text("action").notNull(),
    resourceType: text("resource_type"),
    resourceId: text("resource_id"),
    resourceName: text("resource_name").notNull(),
    details: text("details"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("activity_log_org_idx").on(table.organizationId),
    index("activity_log_created_idx").on(table.createdAt),
    index("activity_log_org_created_idx").on(table.organizationId, table.createdAt),
  ],
);

// ── Audit Log ──────────────────────────────────────────────────────
export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("audit_log_org_idx").on(table.organizationId),
    index("audit_log_user_idx").on(table.userId),
    index("audit_log_action_idx").on(table.action),
    index("audit_log_created_idx").on(table.createdAt),
  ],
);
