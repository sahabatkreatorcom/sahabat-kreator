-- Webhook Schema Migration
-- Add webhook_subscription and webhook_log tables

CREATE TYPE "public"."webhook_status" AS ENUM('PENDING', 'PROCESSED', 'FAILED', 'RETRIED');

CREATE TABLE "webhook_subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"platform" text NOT NULL,
	"platform_subscription_id" text,
	"events" text NOT NULL,
	"callback_url" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"last_verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "webhook_log" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"platform" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"attempt" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"responded_with" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);

-- Foreign keys
ALTER TABLE "webhook_subscription" ADD CONSTRAINT "webhook_subscription_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "webhook_log" ADD CONSTRAINT "webhook_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;

-- Indexes
CREATE INDEX "webhook_sub_org_idx" ON "webhook_subscription" USING btree ("organization_id");
CREATE INDEX "webhook_sub_platform_idx" ON "webhook_subscription" USING btree ("platform");
CREATE UNIQUE INDEX "webhook_sub_org_platform_uidx" ON "webhook_subscription" USING btree ("organization_id","platform");
CREATE INDEX "webhook_log_org_idx" ON "webhook_log" USING btree ("organization_id");
CREATE INDEX "webhook_log_platform_idx" ON "webhook_log" USING btree ("platform");
CREATE INDEX "webhook_log_status_idx" ON "webhook_log" USING btree ("status");
CREATE INDEX "webhook_log_created_idx" ON "webhook_log" USING btree ("created_at");
CREATE INDEX "webhook_log_org_status_idx" ON "webhook_log" USING btree ("organization_id","status");
