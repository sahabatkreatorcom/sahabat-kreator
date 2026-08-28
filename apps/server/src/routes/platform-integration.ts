import { db } from "@sahabatkreator/db";
import { globalPlatformCredential, organizationSetting } from "@sahabatkreator/db/schema";
import { and, desc, eq, like } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { getOrganizationId } from "../lib/context";

const platformIntegrationApp = new Hono();

platformIntegrationApp.use("/*", requireAuth);

// GET /api/platform-integration/locations
platformIntegrationApp.get("/locations", async (c) => {
  const organizationId = getOrganizationId(c);

  const locations = await db
    .select()
    .from(organizationSetting)
    .where(
      and(
        eq(organizationSetting.organizationId, organizationId),
        like(organizationSetting.key, "location:%"),
      ),
    )
    .orderBy(desc(organizationSetting.updatedAt));

  const parsed = locations.map((r) => {
    const locationId = r.key.replace("location:", "");
    let data = { name: locationId, lat: 0, lng: 0 };
    try {
      data = JSON.parse(r.value);
    } catch {}
    return { id: locationId, ...data };
  });

  return c.json({ locations: parsed });
});

// POST /api/platform-integration/locations
const createLocationSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  lat: z.number(),
  lng: z.number(),
});

platformIntegrationApp.post("/locations", async (c) => {
  const organizationId = getOrganizationId(c);
  const body = await c.req.json();
  const parsed = createLocationSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const key = `location:${parsed.data.id}`;

  await db
    .insert(organizationSetting)
    .values({
      id: crypto.randomUUID(),
      organizationId,
      key,
      value: JSON.stringify({
        name: parsed.data.name,
        lat: parsed.data.lat,
        lng: parsed.data.lng,
      }),
    })
    .onConflictDoUpdate({
      target: [organizationSetting.organizationId, organizationSetting.key],
      set: {
        value: JSON.stringify({
          name: parsed.data.name,
          lat: parsed.data.lat,
          lng: parsed.data.lng,
        }),
        updatedAt: new Date(),
      },
    });

  return c.json({ success: true, id: parsed.data.id });
});

// GET /api/platform-integration/playlists
platformIntegrationApp.get("/playlists", async (c) => {
  const organizationId = getOrganizationId(c);

  const playlists = await db
    .select()
    .from(organizationSetting)
    .where(
      and(
        eq(organizationSetting.organizationId, organizationId),
        like(organizationSetting.key, "playlist:%"),
      ),
    )
    .orderBy(desc(organizationSetting.updatedAt));

  const parsed = playlists.map((r) => {
    const playlistId = r.key.replace("playlist:", "");
    let data: { name: string; platform: string; playlistId: string } = { name: playlistId, platform: "unknown", playlistId: "" };
    try {
      data = JSON.parse(r.value);
    } catch {}
    return { id: playlistId, ...data };
  });

  return c.json({ playlists: parsed });
});

// POST /api/platform-integration/playlists
const createPlaylistSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  platform: z.string().min(1).max(50),
  playlistId: z.string().min(1),
});

platformIntegrationApp.post("/playlists", async (c) => {
  const organizationId = getOrganizationId(c);
  const body = await c.req.json();
  const parsed = createPlaylistSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const key = `playlist:${parsed.data.id}`;

  await db
    .insert(organizationSetting)
    .values({
      id: crypto.randomUUID(),
      organizationId,
      key,
      value: JSON.stringify({
        name: parsed.data.name,
        platform: parsed.data.platform,
        playlistId: parsed.data.playlistId,
      }),
    })
    .onConflictDoUpdate({
      target: [organizationSetting.organizationId, organizationSetting.key],
      set: {
        value: JSON.stringify({
          name: parsed.data.name,
          platform: parsed.data.platform,
          playlistId: parsed.data.playlistId,
        }),
        updatedAt: new Date(),
      },
    });

  return c.json({ success: true, id: parsed.data.id });
});

// GET /api/platform-integration/boards
platformIntegrationApp.get("/boards", async (c) => {
  const organizationId = getOrganizationId(c);

  const boards = await db
    .select()
    .from(organizationSetting)
    .where(
      and(
        eq(organizationSetting.organizationId, organizationId),
        like(organizationSetting.key, "pinterest_board:%"),
      ),
    )
    .orderBy(desc(organizationSetting.updatedAt));

  const parsed = boards.map((r) => {
    const boardId = r.key.replace("pinterest_board:", "");
    let data: { name: string; boardId: string } = { name: boardId, boardId: "" };
    try {
      data = JSON.parse(r.value);
    } catch {}
    return { id: boardId, ...data };
  });

  return c.json({ boards: parsed });
});

// POST /api/platform-integration/boards
const createBoardSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  boardId: z.string().min(1),
});

platformIntegrationApp.post("/boards", async (c) => {
  const organizationId = getOrganizationId(c);
  const body = await c.req.json();
  const parsed = createBoardSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const key = `pinterest_board:${parsed.data.id}`;

  await db
    .insert(organizationSetting)
    .values({
      id: crypto.randomUUID(),
      organizationId,
      key,
      value: JSON.stringify({
        name: parsed.data.name,
        boardId: parsed.data.boardId,
      }),
    })
    .onConflictDoUpdate({
      target: [organizationSetting.organizationId, organizationSetting.key],
      set: {
        value: JSON.stringify({
          name: parsed.data.name,
          boardId: parsed.data.boardId,
        }),
        updatedAt: new Date(),
      },
    });

  return c.json({ success: true, id: parsed.data.id });
});

// GET /api/platform-integration/health/:platform
platformIntegrationApp.get("/health/:platform", async (c) => {
  const platform = c.req.param("platform").toUpperCase() as "INSTAGRAM" | "FACEBOOK" | "TIKTOK" | "YOUTUBE" | "PINTEREST" | "LINKEDIN" | "BLUESKY" | "THREADS" | "GOOGLE_BUSINESS";

  const validPlatforms = ["INSTAGRAM", "FACEBOOK", "TIKTOK", "YOUTUBE", "PINTEREST", "LINKEDIN", "BLUESKY", "THREADS", "GOOGLE_BUSINESS"];
  if (!validPlatforms.includes(platform)) {
    return c.json({ error: "Invalid platform" }, 400);
  }

  const [credential] = await db
    .select()
    .from(globalPlatformCredential)
    .where(eq(globalPlatformCredential.platform, platform))
    .limit(1);

  if (!credential) {
    return c.json({ platform, configured: false, status: "not_configured" });
  }

  // TODO: perform actual health check against platform API
  return c.json({
    platform,
    configured: credential.isConfigured,
    status: credential.isConfigured ? "healthy" : "unhealthy",
    lastChecked: credential.updatedAt.toISOString(),
  });
});

export default platformIntegrationApp;
