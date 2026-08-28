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
import { paymentStatusEnum } from "./enum";

// ── Payment ────────────────────────────────────────────────────────
export const payment = pgTable(
  "payment",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    currency: text("currency").default("IDR").notNull(),
    description: text("description"),
    customerName: text("customer_name"),
    customerEmail: text("customer_email"),
    customerPhone: text("customer_phone"),
    invoiceNumber: text("invoice_number").notNull().unique(),
    status: text("status", { enum: paymentStatusEnum.enumValues })
      .default("PENDING")
      .notNull(),
    sumopodPaymentId: text("sumopod_payment_id"),
    checkoutUrl: text("checkout_url"),
    paymentLinkUrl: text("payment_link_url"),
    paymentCode: text("payment_code"),
    paymentCodeType: text("payment_code_type"),
    paymentChannelUsed: text("payment_channel_used"),
    fee: integer("fee").default(0),
    netAmount: integer("net_amount").default(0),
    expiresAt: timestamp("expires_at"),
    completedAt: timestamp("completed_at"),
    errorMessage: text("error_message"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("payment_org_idx").on(table.organizationId),
    index("payment_status_idx").on(table.status),
    index("payment_invoice_idx").on(table.invoiceNumber),
    uniqueIndex("payment_sumopod_id_uidx").on(table.sumopodPaymentId),
  ],
);

// ── Subscription ───────────────────────────────────────────────────
export const subscription = pgTable(
  "subscription",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    planId: text("plan_id").notNull(),
    planName: text("plan_name").notNull(),
    amount: integer("amount").notNull(),
    currency: text("currency").default("IDR").notNull(),
    interval: text("interval").default("month"),
    intervalCount: integer("interval_count").default(1),
    status: text("status").default("active").notNull(),
    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),
    trialStart: timestamp("trial_start"),
    trialEnd: timestamp("trial_end"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
    canceledAt: timestamp("canceled_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("subscription_org_idx").on(table.organizationId),
    index("subscription_status_idx").on(table.status),
  ],
);

// ── Global Integration Settings (singleton) ────────────────────���───
export const globalIntegrationSettings = pgTable(
  "global_integration_settings",
  {
    id: text("id").primaryKey(),
    // SumoPod Pay
    sumopodApiKey: text("sumopod_api_key"),
    sumopodApiSecret: text("sumopod_api_secret"),
    sumopodWebhookSecret: text("sumopod_webhook_secret"),
    sumopodWebhookToken: text("sumopod_webhook_token"),
    sumopodBase: text("sumopod_base"),
    sumopodConfigured: boolean("sumopod_configured").default(false),
    // OpenRouter AI
    openrouterApiKey: text("openrouter_api_key"),
    openrouterConfigured: boolean("openrouter_configured").default(false),
    // Platform OAuth (encrypted)
    metaAppId: text("meta_app_id"),
    metaAppSecret: text("meta_app_secret"),
    youtubeApiKey: text("youtube_api_key"),
    tiktokClientId: text("tiktok_client_id"),
    tiktokClientSecret: text("tiktok_client_secret"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
);
