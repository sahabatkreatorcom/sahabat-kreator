import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import {
  createOpenApiDocument,
  HealthResponseSchema,
  PrivateDataResponseSchema,
  UnauthorizedResponseSchema,
} from "@sahabatkreator/api";
import { auth } from "@sahabatkreator/auth";
import { env } from "@sahabatkreator/env/server";
import { apiReference } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import accountsApp from "./routes/accounts";
import adminApp from "./routes/admin";
import adminAdvancedApp from "./routes/admin-advanced";
import adminImpersonateApp from "./routes/admin-impersonate";
import platformCredentialsApp from "./routes/admin-platform-credentials";
import adminSettingsApp from "./routes/admin-settings";
import adminUserBanApp from "./routes/admin-user-ban";
import aiAssistApp from "./routes/ai-assist";
import aiCaptionApp from "./routes/ai-caption";
import analyticsApp from "./routes/analytics";
import analyticsAdvancedApp from "./routes/analytics-advanced";
import auditApp from "./routes/audit";
import billingApp from "./routes/billing";
import blogApp from "./routes/blog";
import calendarApp from "./routes/calendar";
import competitorsApp from "./routes/competitors";
import composerApp from "./routes/composer";
import engagementApp from "./routes/engagement";
import engagementInboxApp from "./routes/engagement-inbox";
import hashtagsApp from "./routes/hashtags";
import mediaApp from "./routes/media";
import notifApp from "./routes/notifications";
import orgApp from "./routes/organization";
import orgAdvancedApp from "./routes/organization-advanced";
import paymentApp from "./routes/payment";
import pillarsApp from "./routes/pillars";
import platformIntegrationApp from "./routes/platform-integration";
import platformApp from "./routes/platforms";
// ── API Routes ──────────────────────────────────────────────────
import postsApp from "./routes/posts";
import pushApp from "./routes/push";
import pushNotificationsApp from "./routes/push-notifications";
import settingsApp from "./routes/settings";
import skApp from "./routes/sk";
import suggestionsApp from "./routes/suggestions";
import teamApp from "./routes/team";
import webhookLogsApp from "./routes/webhook-logs";
import webhookSubscriptionsApp from "./routes/webhook-subscriptions";
import webhookApp from "./routes/webhooks";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// ── Auth ────────────────────────────────────────────────────────
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// ── Core API Routes ─────────────────────────────────────────────
app.route("/api/posts", postsApp);
app.route("/api/media", mediaApp);
app.route("/api/calendar", calendarApp);
app.route("/api/accounts", accountsApp);
app.route("/api/admin", adminApp);
app.route("/api/ai", aiCaptionApp);
app.route("/api/ai", aiAssistApp);
app.route("/api/analytics", analyticsApp);
app.route("/api/analytics-advanced", analyticsAdvancedApp);
app.route("/api/payment", paymentApp);
app.route("/api/billing", billingApp);
app.route("/api/team", teamApp);
app.route("/api/audit", auditApp);
app.route("/api/settings", settingsApp);
app.route("/api/suggestions", suggestionsApp);
app.route("/api/organization", orgApp);
app.route("/api/org-advanced", orgAdvancedApp);
app.route("/api/notifications", notifApp);
app.route("/api/pillars", pillarsApp);
app.route("/api/hashtags", hashtagsApp);
app.route("/api/competitors", competitorsApp);
app.route("/api/engagement", engagementApp);
app.route("/api/engagement-inbox", engagementInboxApp);
app.route("/api/blog", blogApp);
app.route("/api/composer", composerApp);
app.route("/api/sk", skApp);
app.route("/api/platforms", platformApp);
app.route("/api/admin/platform-credentials", platformCredentialsApp);
app.route("/api/admin/settings", adminSettingsApp);
app.route("/api/admin/impersonate", adminImpersonateApp);
app.route("/api/admin/users", adminUserBanApp);
app.route("/api/push", pushApp);
app.route("/api/admin-advanced", adminAdvancedApp);
app.route("/api/platform-integration", platformIntegrationApp);
app.route("/api/push", pushNotificationsApp);

// ── Webhooks ────────────────────────────────────────────────────
app.route("/api/webhooks", webhookApp);
app.route("/api/webhooks/subscriptions", webhookSubscriptionsApp);
app.route("/api/webhooks", webhookLogsApp);

// ── OpenAPI ─────────────────────────────────────────────────────
const openApiApp = new OpenAPIHono();

const healthRoute = createRoute({
  method: "get",
  path: "/health",
  tags: ["System"],
  responses: {
    200: {
      description: "Service health",
      content: {
        "application/json": {
          schema: HealthResponseSchema,
        },
      },
    },
  },
});

openApiApp.openapi(healthRoute, (c) => {
  return c.json({ status: "ok" as const });
});

const privateRoute = createRoute({
  method: "get",
  path: "/private",
  tags: ["Example"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Private user data",
      content: {
        "application/json": {
          schema: PrivateDataResponseSchema,
        },
      },
    },
    401: {
      description: "Authentication required",
      content: {
        "application/json": {
          schema: UnauthorizedResponseSchema,
        },
      },
    },
  },
});

openApiApp.openapi(privateRoute, async (c) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  if (!session) {
    return c.json({ message: "Authentication required" }, 401);
  }

  return c.json({
    message: "This is private",
    user: session.user,
  });
});

openApiApp.doc("/openapi.json", createOpenApiDocument());
openApiApp.get("/docs", apiReference({ spec: { url: "/openapi.json" } }));
app.route("/", openApiApp);

app.get("/", (c) => {
  return c.text("OK");
});

export default app;
