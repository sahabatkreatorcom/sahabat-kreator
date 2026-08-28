import {
    boolean,
    index,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { platformEnum } from "./enum";

// ── Global Platform Credentials ──────────────────────────────────
export const globalPlatformCredential = pgTable(
    "global_platform_credential",
    {
        id: text("id").primaryKey(),
        platform: text("platform", {
            enum: ["INSTAGRAM", "FACEBOOK", "TIKTOK", "YOUTUBE", "PINTEREST", "LINKEDIN", "BLUESKY", "THREADS", "GOOGLE_BUSINESS"],
        }).notNull().unique(),
        clientId: text("client_id").notNull(),
        clientSecret: text("client_secret").notNull(),
        redirectUri: text("redirect_uri"),
        webhookVerifyToken: text("webhook_verify_token"),
        isConfigured: boolean("is_configured").default(true).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [index("gpc_platform_idx").on(table.platform)],
);

// ── Social Account ─────────────────────────────────────────────────
export const socialAccount = pgTable(
    "social_account",
    {
        id: text("id").primaryKey(),
        organizationId: text("organization_id")
            .notNull()
            .references(() => organization.id, { onDelete: "cascade" }),
        platform: text("platform", { enum: platformEnum.enumValues }).notNull(),
        platformAccountId: text("platform_account_id").notNull(),
        name: text("name").notNull(),
        username: text("username"),
        accessToken: text("access_token"),
        refreshToken: text("refresh_token"),
        tokenExpiresAt: timestamp("token_expires_at"),
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        uniqueIndex("social_account_org_platform_uidx").on(
            table.organizationId,
            table.platform,
            table.platformAccountId,
        ),
        index("social_account_org_idx").on(table.organizationId),
        index("social_account_platform_idx").on(table.platform),
    ],
);