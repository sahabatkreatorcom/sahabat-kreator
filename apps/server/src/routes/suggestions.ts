import { db } from "@sahabatkreator/db";
import { competitor, post, socialAccount, subscription } from "@sahabatkreator/db/schema";
import { env } from "@sahabatkreator/env/server";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { getOrganizationId } from "../lib/context";

const suggestionApp = new Hono();

suggestionApp.use("/*", requireAuth);

// GET /api/suggestions/content
suggestionApp.get("/content", async (c) => {
  const organizationId = getOrganizationId(c);

  // Get recent posts for context
  const recentPosts = await db.query.post.findMany({
    where: and(
      eq(post.organizationId, organizationId),
      sql`${post.createdAt} > ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}`,
    ),
    orderBy: [desc(post.createdAt)],
    limit: 10,
    columns: { caption: true, postType: true, status: true, createdAt: true },
  });

  // Get connected accounts
  const accounts = await db.query.socialAccount.findMany({
    where: eq(socialAccount.organizationId, organizationId),
    columns: { platform: true, username: true },
    limit: 5,
  });

  // Get competitors if any
  const competitors = await db.query.competitor.findMany({
    where: and(eq(competitor.organizationId, organizationId), eq(competitor.isActive, true)),
    columns: { platform: true, platformHandle: true, name: true },
    limit: 5,
  });

  return c.json({
    recentPosts: recentPosts.map((p) => ({
      caption: p.caption?.slice(0, 100),
      postType: p.postType,
      status: p.status,
      daysAgo: Math.floor((Date.now() - p.createdAt.getTime()) / 86400000),
    })),
    accounts: accounts.map((a) => ({
      platform: a.platform,
      username: a.username,
    })),
    competitors: competitors.map((c) => ({
      platform: c.platform,
      handle: c.platformHandle,
      name: c.name,
    })),
  });
});

// POST /api/suggestions/content
const suggestionSchema = z.object({
  topic: z.string().min(3),
  platform: z.enum(["instagram", "tiktok", "youtube", "facebook"]).optional(),
  tone: z.enum(["professional", "casual", "humorous", "inspirational"]).default("casual"),
  goal: z.enum(["engagement", "followers", "sales", "awareness"]).default("engagement"),
});

suggestionApp.post("/content", async (c) => {
  const body = await c.req.json();
  const parsed = suggestionSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid input" }, 400);
  }

  const { topic, platform, tone, goal } = parsed.data;

  // Use OpenRouter API to generate suggestions
  const apiKey = env.OPENROUTER_API_KEY ?? "";
  if (!apiKey) {
    return c.json(
      {
        suggestions: getDefaultSuggestions(topic, tone, goal),
        source: "fallback",
      },
      200,
    );
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.2-3b-instruct:free",
        messages: [
          {
            role: "system",
            content:
              "You are a social media content strategist for Sahabat Kreator. Generate creative, engaging content suggestions in Indonesian language. Be specific to the platform and goal.",
          },
          {
            role: "user",
            content: `Generate 5 content suggestions for the topic: "${topic}"
- Platform: ${platform || "all platforms"}
- Tone: ${tone}
- Goal: ${goal}
- Format: Return as JSON array with fields: title, caption, hashtags, tip`,
          },
        ],
        max_tokens: 1000,
        temperature: 0.8,
      }),
    });

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };

    if (data.choices?.[0]?.message?.content) {
      const suggestions = parseAIResponse(data.choices[0].message.content);
      return c.json({ suggestions, source: "ai" });
    }

    throw new Error("Invalid response");
  } catch (error) {
    console.error("[Suggestions] AI generation failed:", error);
    return c.json(
      {
        suggestions: getDefaultSuggestions(topic, tone, goal),
        source: "fallback",
      },
      200,
    );
  }
});

function parseAIResponse(content: string) {
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Fall through to fallback
  }
  return getDefaultSuggestions("content", "casual", "engagement");
}

function getDefaultSuggestions(topic: string, tone: string, _goal: string) {
  const templates: Record<
    string,
    { title: string; caption: string; hashtags: string[]; tip: string }[]
  > = {
    casual: [
      {
        title: `Tips Mudah ${topic}`,
        caption: `Tau ga sih, ${topic} itu sebenarnya lebih mudah dari yang kamu kira! 👀\n\nCoba tips simpel ini dan lihat perbedaannya. Save buat referensi nanti! 💡\n\n#Tips${topic} #LifeHacks`,
        hashtags: [`#${topic}`, "#Tips", "#LifeHacks", "#CaraMudah"],
        tip: "Gunakan foto atau video pendek yang menunjukkan before-after",
      },
      {
        title: `Rahasia ${topic}`,
        caption: `Jangan bilang siapa-siapa, tapi ini rahasia yang bisa ngebantu ${topic} kamu jadi lebih keren! 🤫✨\n\nCek dulu, baru praktek ya! 👇\n\n#Rahasia${topic} #SecretTips`,
        hashtags: [`#${topic}`, "#Rahasia", "#SecretTips", "#Fakta"],
        tip: "Buat konten yang memberikan value eksklusif",
      },
      {
        title: `${topic} untuk Pemula`,
        caption: `Baru mau mulai ${topic}? Yuk intip langkah-langkah dasarnya dulu! 📚\n\nStep by step, pasti bisa! 💪\n\n#Pemula${topic} #Belajar`,
        hashtags: [`#${topic}`, "#Pemula", "#Belajar", "#Tutorial"],
        tip: "Gunakan format carousel atau thread untuk edukasi",
      },
    ],
    professional: [
      {
        title: `Strategi ${topic} Profesional`,
        caption: `Mengembangkan ${topic} memerlukan pendekatan yang tepat. Berikut adalah framework yang bisa kamu terapkan untuk hasil maksimal. 📊\n\n#Strategi${topic} #Profesional`,
        hashtags: [`#${topic}`, "#Strategi", "#Profesional", "#Business"],
        tip: "Sertakan data dan statistik untuk mendukung claim",
      },
      {
        title: `Best Practices ${topic}`,
        caption: `Setiap kompetitor top di bidang ${topic} menerapkan prinsip-prinsip ini. Simak dan terapkan sekarang! 🎯\n\n#BestPractices ${topic} #Expert`,
        hashtags: [`#${topic}`, "#BestPractices", "#Expert", "#Industry"],
        tip: "Gunakan studi kasus dari brand ternama",
      },
      {
        title: `ROI ${topic}`,
        caption: `Banyak yang bertanya, seberapa besar ROI dari ${topic}? Mari kita bedah bersama. 📈\n\n#ROI${topic} #Analisis`,
        hashtags: [`#${topic}`, "#ROI", "#Analisis", "#Data"],
        tip: "Visualisasikan dengan grafik atau chart",
      },
    ],
  };

  return templates[tone] || templates.casual;
}

// GET /api/suggestions/cap
suggestionApp.get("/cap", async (c) => {
  const organizationId = getOrganizationId(c);

  // Calculate daily cap based on subscription plan
  const sub = await db.query.subscription.findFirst({
    where: and(eq(subscription.organizationId, organizationId), eq(subscription.status, "active")),
    columns: { planId: true },
  });

  const caps: Record<string, number> = {
    FREE: 10,
    PRO: 100,
    BUSINESS: 500,
    ENTERPRISE: Number.POSITIVE_INFINITY,
    ADMIN: Number.POSITIVE_INFINITY,
  };

  const dailyCap = caps[sub?.planId ?? "FREE"] ?? 10;

  // Count today's generations
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await db
    .select({ count: count() })
    .from(post)
    .where(
      and(
        eq(post.organizationId, organizationId),
        eq(post.status, "SCHEDULED"),
        sql`${post.createdAt} >= ${today}`,
      ),
    );
  const used = result[0]?.count ?? 0;

  return c.json({
    dailyCap,
    used: Number(used),
    remaining: Math.max(0, dailyCap - Number(used)),
  });
});

export default suggestionApp;
