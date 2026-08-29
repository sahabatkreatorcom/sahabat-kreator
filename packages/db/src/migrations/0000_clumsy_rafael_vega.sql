CREATE TYPE "public"."brand_voice_tone" AS ENUM('PROFESSIONAL', 'CASUAL', 'FUN', 'INSPIRING', 'EDUCATIONAL', 'PERSONAL');--> statement-breakpoint
CREATE TYPE "public"."canned_reply_category" AS ENUM('GREETING', 'THANK_YOU', 'FAQ', 'APOLOGY', 'PROMOTION', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."draft_action" AS ENUM('CREATE', 'EDIT', 'DUPLICATE', 'DELETE', 'MOVE');--> statement-breakpoint
CREATE TYPE "public"."email_report_status" AS ENUM('PENDING', 'GENERATING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."engagement_item_type" AS ENUM('COMMENT', 'DM', 'MENTION', 'TAG', 'REVIEW', 'STORY_MENTION', 'STORY_REPLY', 'PUBLIC_POST');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('COMMENT', 'DM', 'MENTION', 'LIKE', 'FOLLOW', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."org_tier" AS ENUM('FREE', 'STARTER', 'PRO', 'BUSINESS', 'ENTERPRISE');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('INSTAGRAM', 'INSTAGRAM_PAGE', 'TIKTOK', 'YOUTUBE', 'FACEBOOK', 'THREADS', 'LINKEDIN', 'PINTEREST', 'BLUESKY', 'GOOGLE_BUSINESS', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED', 'ARCHIVED', 'PUBLISHING');--> statement-breakpoint
CREATE TYPE "public"."post_type" AS ENUM('POST', 'STORY', 'REEL', 'CAROUSEL', 'VIDEO');--> statement-breakpoint
CREATE TYPE "public"."push_notification_status" AS ENUM('PENDING', 'SENT', 'FAILED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."sentiment" AS ENUM('POSITIVE', 'NEGATIVE', 'NEUTRAL');--> statement-breakpoint
CREATE TYPE "public"."shop_connection_platform" AS ENUM('SHOPIFY', 'WOOCOMMERCE', 'SHOPEE', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."sk_chat_role" AS ENUM('USER', 'ASSISTANT', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."sk_experiment_status" AS ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."sk_recommendation_category" AS ENUM('CONTENT', 'TIMING', 'HASHTAG', 'CAPTION', 'PLATFORM');--> statement-breakpoint
CREATE TYPE "public"."sk_recommendation_priority" AS ENUM('HIGH', 'MEDIUM', 'LOW');--> statement-breakpoint
CREATE TYPE "public"."sk_recommendation_status" AS ENUM('PENDING', 'APPLIED', 'IGNORED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."sk_report_status" AS ENUM('PENDING', 'GENERATING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."sk_report_trigger" AS ENUM('PROACTIVE', 'REACTIVE', 'SCHEDULED', 'MANUAL', 'CHAT');--> statement-breakpoint
CREATE TYPE "public"."sound_platform" AS ENUM('INSTAGRAM', 'TIKTOK', 'YOUTUBE');--> statement-breakpoint
CREATE TYPE "public"."thread_status" AS ENUM('OPEN', 'REPLIED', 'ARCHIVED', 'TRASHED');--> statement-breakpoint
CREATE TYPE "public"."utm_campaign_type" AS ENUM('SOCIAL', 'EMAIL', 'PAID', 'ORGANIC', 'AFFILIATE', 'CUSTOM');--> statement-breakpoint
CREATE TABLE "analytics_period_snapshot" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"total_posts" integer DEFAULT 0 NOT NULL,
	"total_views" integer DEFAULT 0 NOT NULL,
	"total_likes" integer DEFAULT 0 NOT NULL,
	"total_comments" integer DEFAULT 0 NOT NULL,
	"total_shares" integer DEFAULT 0 NOT NULL,
	"avg_engagement_rate" integer,
	"previous_period_total_views" integer,
	"previous_period_total_likes" integer,
	"previous_period_total_comments" integer,
	"views_growth_percent" integer,
	"likes_growth_percent" integer,
	"comments_growth_percent" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "best_time_schedule" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"platform" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"hour_of_day" integer NOT NULL,
	"engagement_score" integer NOT NULL,
	"data_points" integer DEFAULT 0 NOT NULL,
	"computed_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_report" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"recipient_email" text NOT NULL,
	"report_url" text,
	"generated_at" timestamp,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hashtag_performance" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"hashtag" text NOT NULL,
	"date" timestamp NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"total_reach" integer DEFAULT 0,
	"total_engagement" integer DEFAULT 0,
	"avg_engagement_rate" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_analytics" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"platform" text NOT NULL,
	"date" timestamp NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"comments" integer DEFAULT 0 NOT NULL,
	"shares" integer DEFAULT 0 NOT NULL,
	"engagement_rate" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_note" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"content" text NOT NULL,
	"date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "engagement_item" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"type" text NOT NULL,
	"platform" text NOT NULL,
	"platform_account_id" text,
	"author_name" text NOT NULL,
	"author_username" text NOT NULL,
	"author_avatar" text,
	"content" text NOT NULL,
	"sentiment" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_replied" boolean DEFAULT false NOT NULL,
	"post_id" text,
	"post_caption" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"url" text NOT NULL,
	"thumbnail_url" text,
	"mime_type" text NOT NULL,
	"file_name" text,
	"file_size" integer,
	"width" integer,
	"height" integer,
	"duration" integer,
	"r2_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"link" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_setting" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text,
	"user_name" text,
	"action" text NOT NULL,
	"resource_type" text,
	"resource_id" text,
	"resource_name" text NOT NULL,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "draft_interaction" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"platform" text,
	"post_type" text,
	"scheduled_at_delta" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publish_error" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"platform" text NOT NULL,
	"error_code" text NOT NULL,
	"error_raw" text,
	"error_human" text NOT NULL,
	"suggestion" text,
	"occurred_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'MEMBER' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"metadata" text,
	"tier" text DEFAULT 'FREE' NOT NULL,
	"subscription_status" text,
	"cancel_at_period_end" boolean DEFAULT false,
	"current_period_end" timestamp,
	"max_members" integer DEFAULT 2,
	"accent_color" text DEFAULT '#D4A574',
	"accent_color_alt" text DEFAULT '#E8B4B8',
	"dark_mode" boolean DEFAULT false,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL,
	"verified" boolean DEFAULT true,
	"failed_verification_count" integer DEFAULT 0,
	"locked_until" timestamp
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"two_factor_enabled" boolean DEFAULT false,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_integration_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"sumopod_api_key" text,
	"sumopod_api_secret" text,
	"sumopod_webhook_secret" text,
	"sumopod_webhook_token" text,
	"sumopod_base" text,
	"sumopod_configured" boolean DEFAULT false,
	"openrouter_api_key" text,
	"openrouter_configured" boolean DEFAULT false,
	"meta_app_id" text,
	"meta_app_secret" text,
	"youtube_api_key" text,
	"tiktok_client_id" text,
	"tiktok_client_secret" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'IDR' NOT NULL,
	"description" text,
	"customer_name" text,
	"customer_email" text,
	"customer_phone" text,
	"invoice_number" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"sumopod_payment_id" text,
	"checkout_url" text,
	"payment_link_url" text,
	"payment_code" text,
	"payment_code_type" text,
	"payment_channel_used" text,
	"fee" integer DEFAULT 0,
	"net_amount" integer DEFAULT 0,
	"expires_at" timestamp,
	"completed_at" timestamp,
	"error_message" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"plan_name" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'IDR' NOT NULL,
	"interval" text DEFAULT 'month',
	"interval_count" integer DEFAULT 1,
	"status" text DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"canceled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"parent_id" text,
	"author_name" text NOT NULL,
	"author_email" text,
	"author_url" text,
	"content" text NOT NULL,
	"is_approved" boolean DEFAULT false,
	"is_spam" boolean DEFAULT false,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_post" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text,
	"body" text NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"meta_keywords" text,
	"canonical_url" text,
	"og_image" text,
	"twitter_card" text,
	"structured_data" jsonb,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"published_at" timestamp,
	"scheduled_at" timestamp,
	"author_id" text,
	"categories" jsonb DEFAULT '[]'::jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"reading_time_minutes" integer DEFAULT 0,
	"word_count" integer DEFAULT 0,
	"view_count" integer DEFAULT 0,
	"like_count" integer DEFAULT 0,
	"comment_count" integer DEFAULT 0,
	"is_ai_generated" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitor" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"platform" text NOT NULL,
	"platform_handle" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_pillar" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#D4A574',
	"post_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hashtag_collection" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"hashtags" text NOT NULL,
	"category" text,
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "canned_reply" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"content" text NOT NULL,
	"category" text,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_thread" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"subject" text,
	"preview_content" text,
	"platform" text NOT NULL,
	"platform_conversation_id" text,
	"participant_username" text NOT NULL,
	"participant_name" text,
	"participant_avatar" text,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"unresolved_since" timestamp,
	"last_activity_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "engagement_ai_suggestion" (
	"id" text PRIMARY KEY NOT NULL,
	"engagement_item_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"suggestion" text NOT NULL,
	"tone" text,
	"language" text DEFAULT 'en',
	"is_used" boolean DEFAULT false NOT NULL,
	"is_customized" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "engagement_item_labels" (
	"id" text PRIMARY KEY NOT NULL,
	"engagement_item_id" text NOT NULL,
	"label_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "engagement_label" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#6B7280',
	"icon" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"social_account_id" text,
	"caption" text DEFAULT '' NOT NULL,
	"post_type" text DEFAULT 'POST' NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"scheduled_at" timestamp,
	"published_at" timestamp,
	"auto_publish" boolean DEFAULT true NOT NULL,
	"platform_post_id" text,
	"platform_data" jsonb,
	"pillar_id" text,
	"hashtag_ids" jsonb DEFAULT '[]'::jsonb,
	"is_ai_generated" boolean DEFAULT false,
	"linked_group_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_media" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"media_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscription_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "sk_brand_knowledge" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"website_url" text,
	"audience" text,
	"positioning" text,
	"products" text,
	"offers" text,
	"voice_rules" text,
	"banned_topics" text,
	"learned_insights" jsonb,
	"pending_insights" jsonb,
	"website_scan_summary" jsonb,
	"website_scanned_at" timestamp,
	"updated_by_sk_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sk_recommendation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"social_account_id" text,
	"report_id" text,
	"platform" text,
	"category" text NOT NULL,
	"priority" text DEFAULT 'MEDIUM' NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"title" text NOT NULL,
	"advice" text,
	"rationale" text,
	"evidence" jsonb,
	"citations" jsonb,
	"impact_baseline" jsonb,
	"impact_result" jsonb,
	"impact_checked_at" timestamp,
	"confidence" integer DEFAULT 0,
	"due_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sk_report" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"trigger" text DEFAULT 'PROACTIVE' NOT NULL,
	"status" text DEFAULT 'COMPLETED' NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"overall_score" integer,
	"score_breakdown" jsonb,
	"confidence" integer DEFAULT 0,
	"model" text,
	"input_hash" text,
	"data_start_date" timestamp,
	"data_end_date" timestamp,
	"generated_by_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sk_chat_message" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sk_chat_session" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title" text DEFAULT 'SK chat' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sk_experiment" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"report_id" text,
	"title" text NOT NULL,
	"hypothesis" text,
	"platform" text,
	"metric" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"start_at" timestamp,
	"end_at" timestamp,
	"baseline" jsonb,
	"result" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sk_media_analysis" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"media_id" text NOT NULL,
	"media_hash" text,
	"model" text,
	"frame_count" integer DEFAULT 0,
	"ocr_text" text,
	"transcript" text,
	"scene_summary" text,
	"analysis" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sk_platform_knowledge" (
	"id" text PRIMARY KEY NOT NULL,
	"platform" text NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"source_url" text,
	"effective_at" timestamp,
	"expires_at" timestamp,
	"confidence" integer DEFAULT 80,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_platform_credential" (
	"id" text PRIMARY KEY NOT NULL,
	"platform" text NOT NULL,
	"client_id" text NOT NULL,
	"client_secret" text NOT NULL,
	"redirect_uri" text,
	"webhook_verify_token" text,
	"is_configured" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "global_platform_credential_platform_unique" UNIQUE("platform")
);
--> statement-breakpoint
CREATE TABLE "social_account" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"platform" text NOT NULL,
	"platform_account_id" text NOT NULL,
	"name" text NOT NULL,
	"username" text,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_period_snapshot" ADD CONSTRAINT "analytics_period_snapshot_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "best_time_schedule" ADD CONSTRAINT "best_time_schedule_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_report" ADD CONSTRAINT "email_report_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hashtag_performance" ADD CONSTRAINT "hashtag_performance_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_analytics" ADD CONSTRAINT "post_analytics_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_analytics" ADD CONSTRAINT "post_analytics_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_note" ADD CONSTRAINT "calendar_note_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagement_item" ADD CONSTRAINT "engagement_item_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_setting" ADD CONSTRAINT "organization_setting_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_interaction" ADD CONSTRAINT "draft_interaction_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_interaction" ADD CONSTRAINT "draft_interaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_comment" ADD CONSTRAINT "blog_comment_post_id_blog_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_comment" ADD CONSTRAINT "blog_comment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post" ADD CONSTRAINT "blog_post_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor" ADD CONSTRAINT "competitor_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_pillar" ADD CONSTRAINT "content_pillar_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hashtag_collection" ADD CONSTRAINT "hashtag_collection_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canned_reply" ADD CONSTRAINT "canned_reply_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canned_reply" ADD CONSTRAINT "canned_reply_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_thread" ADD CONSTRAINT "conversation_thread_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagement_ai_suggestion" ADD CONSTRAINT "engagement_ai_suggestion_engagement_item_id_engagement_item_id_fk" FOREIGN KEY ("engagement_item_id") REFERENCES "public"."engagement_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagement_ai_suggestion" ADD CONSTRAINT "engagement_ai_suggestion_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagement_item_labels" ADD CONSTRAINT "engagement_item_labels_engagement_item_id_engagement_item_id_fk" FOREIGN KEY ("engagement_item_id") REFERENCES "public"."engagement_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagement_item_labels" ADD CONSTRAINT "engagement_item_labels_label_id_engagement_label_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."engagement_label"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagement_label" ADD CONSTRAINT "engagement_label_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_social_account_id_social_account_id_fk" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_pillar_id_content_pillar_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."content_pillar"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscription" ADD CONSTRAINT "push_subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscription" ADD CONSTRAINT "push_subscription_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sk_brand_knowledge" ADD CONSTRAINT "sk_brand_knowledge_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sk_recommendation" ADD CONSTRAINT "sk_recommendation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sk_recommendation" ADD CONSTRAINT "sk_recommendation_social_account_id_social_account_id_fk" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sk_recommendation" ADD CONSTRAINT "sk_recommendation_report_id_sk_report_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."sk_report"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sk_report" ADD CONSTRAINT "sk_report_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sk_chat_message" ADD CONSTRAINT "sk_chat_message_session_id_sk_chat_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sk_chat_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sk_chat_session" ADD CONSTRAINT "sk_chat_session_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sk_chat_session" ADD CONSTRAINT "sk_chat_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sk_experiment" ADD CONSTRAINT "sk_experiment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sk_experiment" ADD CONSTRAINT "sk_experiment_report_id_sk_report_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."sk_report"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sk_media_analysis" ADD CONSTRAINT "sk_media_analysis_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sk_media_analysis" ADD CONSTRAINT "sk_media_analysis_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_account" ADD CONSTRAINT "social_account_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_period_org_idx" ON "analytics_period_snapshot" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "analytics_period_start_idx" ON "analytics_period_snapshot" USING btree ("period_start");--> statement-breakpoint
CREATE INDEX "analytics_period_end_idx" ON "analytics_period_snapshot" USING btree ("period_end");--> statement-breakpoint
CREATE INDEX "analytics_period_org_dates_idx" ON "analytics_period_snapshot" USING btree ("organization_id","period_start","period_end");--> statement-breakpoint
CREATE INDEX "best_time_org_idx" ON "best_time_schedule" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "best_time_platform_idx" ON "best_time_schedule" USING btree ("platform");--> statement-breakpoint
CREATE UNIQUE INDEX "best_time_org_platform_uidx" ON "best_time_schedule" USING btree ("organization_id","platform");--> statement-breakpoint
CREATE INDEX "email_report_org_idx" ON "email_report" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "email_report_status_idx" ON "email_report" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_report_created_idx" ON "email_report" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "hashtag_perf_org_idx" ON "hashtag_performance" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "hashtag_perf_hashtag_idx" ON "hashtag_performance" USING btree ("hashtag");--> statement-breakpoint
CREATE INDEX "hashtag_perf_date_idx" ON "hashtag_performance" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "hashtag_perf_org_hashtag_date_uidx" ON "hashtag_performance" USING btree ("organization_id","hashtag","date");--> statement-breakpoint
CREATE INDEX "post_analytics_post_idx" ON "post_analytics" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "post_analytics_org_idx" ON "post_analytics" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "post_analytics_date_idx" ON "post_analytics" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "post_analytics_post_date_uidx" ON "post_analytics" USING btree ("post_id","date");--> statement-breakpoint
CREATE INDEX "calendar_note_org_idx" ON "calendar_note" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "calendar_note_date_idx" ON "calendar_note" USING btree ("date");--> statement-breakpoint
CREATE INDEX "calendar_note_org_date_idx" ON "calendar_note" USING btree ("organization_id","date");--> statement-breakpoint
CREATE INDEX "engagement_org_idx" ON "engagement_item" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "engagement_type_idx" ON "engagement_item" USING btree ("type");--> statement-breakpoint
CREATE INDEX "engagement_platform_idx" ON "engagement_item" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "engagement_unread_idx" ON "engagement_item" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "engagement_org_read_idx" ON "engagement_item" USING btree ("organization_id","is_read");--> statement-breakpoint
CREATE INDEX "media_org_idx" ON "media" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "media_org_created_idx" ON "media" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "notification_user_idx" ON "notification" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_is_read_idx" ON "notification" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notification_created_idx" ON "notification" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notification_user_read_idx" ON "notification" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "notification_org_read_idx" ON "notification" USING btree ("organization_id","is_read");--> statement-breakpoint
CREATE INDEX "org_setting_org_idx" ON "organization_setting" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "org_setting_key_idx" ON "organization_setting" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "org_setting_org_key_uidx" ON "organization_setting" USING btree ("organization_id","key");--> statement-breakpoint
CREATE INDEX "activity_log_org_idx" ON "activity_log" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "activity_log_created_idx" ON "activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "activity_log_org_created_idx" ON "activity_log" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_log_org_idx" ON "audit_log" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "audit_log_user_idx" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_action_idx" ON "audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_log_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "draft_interaction_org_idx" ON "draft_interaction" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "draft_interaction_action_idx" ON "draft_interaction" USING btree ("action");--> statement-breakpoint
CREATE INDEX "draft_interaction_platform_posttype_idx" ON "draft_interaction" USING btree ("platform","post_type");--> statement-breakpoint
CREATE INDEX "publish_error_post_idx" ON "publish_error" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invitation_organizationId_idx" ON "invitation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "member_organizationId_userId_uidx" ON "member" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "member_organizationId_idx" ON "member" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "member_userId_idx" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_slug_uidx" ON "organization" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "organization_tier_idx" ON "organization" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "twoFactor_secret_idx" ON "two_factor" USING btree ("secret");--> statement-breakpoint
CREATE INDEX "twoFactor_userId_idx" ON "two_factor" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "payment_org_idx" ON "payment" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payment_status_idx" ON "payment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payment_invoice_idx" ON "payment" USING btree ("invoice_number");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_sumopod_id_uidx" ON "payment" USING btree ("sumopod_payment_id");--> statement-breakpoint
CREATE INDEX "subscription_org_idx" ON "subscription" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "subscription_status_idx" ON "subscription" USING btree ("status");--> statement-breakpoint
CREATE INDEX "blog_comment_post_idx" ON "blog_comment" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "blog_comment_org_idx" ON "blog_comment" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "blog_comment_approved_idx" ON "blog_comment" USING btree ("is_approved");--> statement-breakpoint
CREATE INDEX "blog_comment_post_approved_idx" ON "blog_comment" USING btree ("post_id","is_approved");--> statement-breakpoint
CREATE UNIQUE INDEX "blog_post_slug_org_uidx" ON "blog_post" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE INDEX "blog_post_org_idx" ON "blog_post" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "blog_post_status_idx" ON "blog_post" USING btree ("status");--> statement-breakpoint
CREATE INDEX "blog_post_published_idx" ON "blog_post" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "blog_post_org_status_published_idx" ON "blog_post" USING btree ("organization_id","status","published_at");--> statement-breakpoint
CREATE INDEX "competitor_org_idx" ON "competitor" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "competitor_platform_idx" ON "competitor" USING btree ("platform");--> statement-breakpoint
CREATE UNIQUE INDEX "competitor_org_platform_handle_uidx" ON "competitor" USING btree ("organization_id","platform","platform_handle");--> statement-breakpoint
CREATE INDEX "pillar_org_idx" ON "content_pillar" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pillar_org_name_uidx" ON "content_pillar" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "hashtag_collection_org_idx" ON "hashtag_collection" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "hashtag_collection_category_idx" ON "hashtag_collection" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "hashtag_collection_org_name_uidx" ON "hashtag_collection" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "canned_reply_org_idx" ON "canned_reply" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "canned_reply_category_idx" ON "canned_reply" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "canned_reply_org_name_uidx" ON "canned_reply" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "conversation_thread_org_idx" ON "conversation_thread" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "conversation_thread_status_idx" ON "conversation_thread" USING btree ("status");--> statement-breakpoint
CREATE INDEX "conversation_thread_platform_idx" ON "conversation_thread" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "conversation_thread_org_status_idx" ON "conversation_thread" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "conversation_thread_org_last_activity_idx" ON "conversation_thread" USING btree ("organization_id","last_activity_at");--> statement-breakpoint
CREATE INDEX "engagement_ai_suggestion_item_idx" ON "engagement_ai_suggestion" USING btree ("engagement_item_id");--> statement-breakpoint
CREATE INDEX "engagement_ai_suggestion_org_idx" ON "engagement_ai_suggestion" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "engagement_item_labels_uidx" ON "engagement_item_labels" USING btree ("engagement_item_id","label_id");--> statement-breakpoint
CREATE INDEX "engagement_item_labels_item_idx" ON "engagement_item_labels" USING btree ("engagement_item_id");--> statement-breakpoint
CREATE INDEX "engagement_item_labels_label_idx" ON "engagement_item_labels" USING btree ("label_id");--> statement-breakpoint
CREATE INDEX "engagement_label_org_idx" ON "engagement_label" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "engagement_label_org_name_uidx" ON "engagement_label" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "post_org_idx" ON "post" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "post_status_idx" ON "post" USING btree ("status");--> statement-breakpoint
CREATE INDEX "post_scheduled_idx" ON "post" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "post_ai_generated_idx" ON "post" USING btree ("is_ai_generated");--> statement-breakpoint
CREATE INDEX "post_org_status_idx" ON "post" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "post_org_scheduled_idx" ON "post" USING btree ("organization_id","scheduled_at");--> statement-breakpoint
CREATE INDEX "post_org_status_scheduled_idx" ON "post" USING btree ("organization_id","status","scheduled_at");--> statement-breakpoint
CREATE INDEX "post_org_published_idx" ON "post" USING btree ("organization_id","published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "post_org_external_uidx" ON "post" USING btree ("organization_id","platform_post_id");--> statement-breakpoint
CREATE INDEX "post_linked_group_idx" ON "post" USING btree ("linked_group_id");--> statement-breakpoint
CREATE INDEX "post_social_account_idx" ON "post" USING btree ("social_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "post_media_post_media_uidx" ON "post_media" USING btree ("post_id","media_id");--> statement-breakpoint
CREATE INDEX "post_media_post_idx" ON "post_media" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "post_media_media_idx" ON "post_media" USING btree ("media_id");--> statement-breakpoint
CREATE INDEX "push_sub_user_idx" ON "push_subscription" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "push_sub_org_idx" ON "push_subscription" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sk_brand_knowledge_org_uidx" ON "sk_brand_knowledge" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "sk_brand_knowledge_org_idx" ON "sk_brand_knowledge" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "sk_recommendation_org_idx" ON "sk_recommendation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "sk_recommendation_status_idx" ON "sk_recommendation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sk_recommendation_org_status_idx" ON "sk_recommendation" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "sk_recommendation_social_account_idx" ON "sk_recommendation" USING btree ("social_account_id");--> statement-breakpoint
CREATE INDEX "sk_recommendation_org_social_status_idx" ON "sk_recommendation" USING btree ("organization_id","social_account_id","status");--> statement-breakpoint
CREATE INDEX "sk_recommendation_org_platform_idx" ON "sk_recommendation" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "sk_recommendation_report_idx" ON "sk_recommendation" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "sk_report_org_idx" ON "sk_report" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "sk_report_status_idx" ON "sk_report" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sk_report_org_created_idx" ON "sk_report" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "sk_report_org_status_idx" ON "sk_report" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "sk_chat_message_session_idx" ON "sk_chat_message" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "sk_chat_message_session_created_idx" ON "sk_chat_message" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "sk_chat_session_org_idx" ON "sk_chat_session" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "sk_chat_session_user_idx" ON "sk_chat_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sk_chat_session_org_updated_idx" ON "sk_chat_session" USING btree ("organization_id","updated_at");--> statement-breakpoint
CREATE INDEX "sk_experiment_org_idx" ON "sk_experiment" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "sk_experiment_org_status_idx" ON "sk_experiment" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "sk_experiment_report_idx" ON "sk_experiment" USING btree ("report_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sk_media_analysis_media_uidx" ON "sk_media_analysis" USING btree ("media_id","media_hash");--> statement-breakpoint
CREATE INDEX "sk_media_analysis_org_idx" ON "sk_media_analysis" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "sk_platform_knowledge_platform_idx" ON "sk_platform_knowledge" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "sk_platform_knowledge_active_idx" ON "sk_platform_knowledge" USING btree ("platform","is_active");--> statement-breakpoint
CREATE INDEX "gpc_platform_idx" ON "global_platform_credential" USING btree ("platform");--> statement-breakpoint
CREATE UNIQUE INDEX "social_account_org_platform_uidx" ON "social_account" USING btree ("organization_id","platform","platform_account_id");--> statement-breakpoint
CREATE INDEX "social_account_org_idx" ON "social_account" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "social_account_platform_idx" ON "social_account" USING btree ("platform");