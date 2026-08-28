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

// ── Content Pillar ─────────────────────────────────────────────────
export const contentPillar = pgTable(
  "content_pillar",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color").default("#D4A574"),
    postCount: integer("post_count").default(0),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("pillar_org_idx").on(table.organizationId),
    uniqueIndex("pillar_org_name_uidx").on(table.organizationId, table.name),
  ],
);

// ── Hashtag Collection ─────────────────────────────────────────────
export const hashtagCollection = pgTable(
  "hashtag_collection",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    hashtags: text("hashtags").notNull(),
    category: text("category"),
    usageCount: integer("usage_count").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("hashtag_collection_org_idx").on(table.organizationId),
    index("hashtag_collection_category_idx").on(table.category),
    uniqueIndex("hashtag_collection_org_name_uidx").on(
      table.organizationId,
      table.name,
    ),
  ],
);
