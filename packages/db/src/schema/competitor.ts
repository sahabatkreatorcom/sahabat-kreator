import { boolean, index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { platformEnum } from "./enum";

// ── Competitor ─────────────────────────────────────────────────────
export const competitor = pgTable(
  "competitor",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    platform: text("platform", { enum: platformEnum.enumValues }).notNull(),
    platformHandle: text("platform_handle").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("competitor_org_idx").on(table.organizationId),
    index("competitor_platform_idx").on(table.platform),
    uniqueIndex("competitor_org_platform_handle_uidx").on(
      table.organizationId,
      table.platform,
      table.platformHandle,
    ),
  ],
);
