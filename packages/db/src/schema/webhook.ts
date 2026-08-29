import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { platformEnum } from "./enum";

// ── Webhook Subscription (per organization) ───────────────────────
export const webhookSubscription = pgTable(
  "webhook_subscription",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    platform: text("platform", { enum: platformEnum.enumValues }).notNull(),
    /** Platform-assigned subscription ID (e.g. Instagram sub_id) */
    platformSubscriptionId: text("platform_subscription_id"),
    /** Which events to subscribe to (JSON array) */
    events: text("events").notNull(),
    /** Callback URL registered with the platform */
    callbackUrl: text("callback_url").notNull(),
    /** Whether the subscription is actively verified */
    isActive: boolean("is_active").default(false).notNull(),
    /** Last time the subscription was verified/renewed */
    lastVerifiedAt: timestamp("last_verified_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("webhook_sub_org_idx").on(table.organizationId),
    index("webhook_sub_platform_idx").on(table.platform),
    uniqueIndex("webhook_sub_org_platform_uidx").on(table.organizationId, table.platform),
  ],
);

// ── Webhook Log ───────────────────────────────────────────────────
export const webhookLog = pgTable(
  "webhook_log",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").references(() => organization.id, {
      onDelete: "set null",
    }),
    platform: text("platform", { enum: platformEnum.enumValues }).notNull(),
    eventType: text("event_type").notNull(),
    payload: text("payload"),
    status: text("status", { enum: ["PENDING", "PROCESSED", "FAILED", "RETRIED"] })
      .default("PENDING")
      .notNull(),
    attempt: integer("attempt").default(0).notNull(),
    errorMessage: text("error_message"),
    respondedWith: integer("responded_with"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    processedAt: timestamp("processed_at"),
  },
  (table) => [
    index("webhook_log_org_idx").on(table.organizationId),
    index("webhook_log_platform_idx").on(table.platform),
    index("webhook_log_status_idx").on(table.status),
    index("webhook_log_created_idx").on(table.createdAt),
    index("webhook_log_org_status_idx").on(table.organizationId, table.status),
  ],
);
