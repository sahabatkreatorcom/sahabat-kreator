import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization, user } from "./auth";

// ── Push Subscription ────────────────────────────────────────────────
export const pushSubscription = pgTable(
  "push_subscription",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id").references(() => organization.id, {
      onDelete: "cascade",
    }),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("push_sub_user_idx").on(table.userId),
    index("push_sub_org_idx").on(table.organizationId),
  ],
);
