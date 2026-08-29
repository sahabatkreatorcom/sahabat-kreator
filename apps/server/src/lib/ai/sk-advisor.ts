/**
 * SK AI Advisor — Adapted from Seb advisor (reference: socaliseit/app)
 *
 * Differences from reference:
 * - Uses env vars directly instead of global_ai_settings table
 * - No video frame extraction (no ffmpeg in Bun)
 * - Indonesian language throughout
 * - Prefix sk_ instead of seb_
 */

import { db } from "@sahabatkreator/db";
import {
  competitor,
  organization,
  post,
  skBrandKnowledge,
  skChatMessage,
  skChatSession,
  skExperiment,
  skPlatformKnowledge,
  skRecommendation,
  skReport,
  socialAccount,
} from "@sahabatkreator/db/schema";
import { env } from "@sahabatkreator/env/server";
import { eq } from "drizzle-orm";

// ─── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_SK_MODEL = env.SK_MODEL || "meta-llama/llama-3.2-3b-instruct:free";
const DEFAULT_MAX_TOKENS = 3500;
const DEFAULT_CHAT_MAX_TOKENS = 4000;
const DEFAULT_TEMPERATURE = 0.55;
const DEFAULT_MAX_REPORTS_PER_DAY = 3;
const DEFAULT_MAX_CHATS_PER_DAY = 30;

const DEFAULT_SK_PROMPT = `Kamu adalah SK (Sahabat Kreator), pelatih media sosial AI yang ramah untuk organisasi ini.
Tugasmu membantu manajer media sosial meningkatkan konten, caption, kreatif, waktu posting, dan strategi platform.

Aturan:
1. Hanya beri saran untuk organisasi/bisnis dalam konteks yang disediakan.
2. Tolak pertanyaan tidak relevan dan jangan melebar ke topik umum.
3. Jangan menemukan analitik, platform, kompetitor, postingan, atau detail visual baru.
4. Pisahkan dengan jelas antara bukti yang diamati dan rekomendasi.
5. Gunakan gaya pelatih yang ramah: hangat, praktis, spesifik, dan mendorong.
6. Anggap semua platform yang terhubung sama pentingnya kecuali data organisasi membuktikan sebaliknya.
7. Gunakan data kompetitor hanya ketika disediakan dalam konteks organisasi.
8. Gunakan pengetahuan platform hanya untuk strategi media sosial.
9. Anggap caption tulisan, caption/subtitle di video, dan teks overlay visual sebagai hal terpisah.
10. Stories adalah format visual ephemeral dan sering tidak butuh caption feed-style. Jangan hukumi STORY karena caption pendek.
11. Saat saran spesifik untuk akun bisnis tertentu, sertakan socialAccountId-nya.
12. Kembalikan JSON ketat untuk laporan. Untuk chat, kembalikan teks biasa.
13. Jawab dalam Bahasa Indonesia.`;

const PLATFORM_KNOWLEDGE: Record<string, string> = {
  INSTAGRAM:
    "Prioritaskan hook frame pertama yang kuat, retensi Reels, carousel saves, caption gaya kreator untuk feed/Reels, kejernihan visual Story-native, ajakan berkomentar, dan konsistensi identitas visual.",
  FACEBOOK:
    "Prioritaskan pemantik percakapan, relevansi komunitas, video native, sinyal kepercayaan lokal, kejernihan visual Story-native, dan postingan praktis yang mudah dibagikan.",
  TIKTOK:
    "Prioritaskan hook segera, pacing cepat, edit bernuansa native, kecocokan tren, watch-time, komentar, dan caption ringkas.",
  YOUTUBE:
    "Prioritaskan kejernihan judul/thumbnail, kurva retensi, deskripsi searchable, hook Shorts, playlist, dan payoff penonton yang jelas.",
  PINTEREST:
    "Prioritaskan kata kunci pencarian, kreatif vertikal, nilai evergreen, kejernihan produk/use-case, dan relevansi link tujuan.",
  GOOGLE_BUSINESS:
    "Prioritaskan intent lokal, penawaran, pembaruan layanan, bukti, foto segar, dan ajakan jelas untuk menghubungi atau mengunjungi.",
  LINKEDIN:
    "Prioritaskan POV ahli, kisah pendiri/tim, pelajaran praktis, bukti kredibel, dan pertanyaan penggerak percakapan.",
  BLUESKY:
    "Prioritaskan postingan ringkas manusiawi, komentar tepat waktu, balasan, dan nada native komunitas.",
  THREADS:
    "Prioritaskan hook konversasional, pendapat cepat, rantai balasan, dan engagement komunitas ringan.",
  META: "Prioritaskan konsistensi kreatif cross-Meta sambil menyesuaikan caption dan format untuk setiap tujuan.",
  MANUAL:
    "Gunakan nama akun dan performa masa lalu untuk menyimpulkan kebutuhan format, tapi hindari mengklaim aturan platform-spesifik tanpa bukti.",
};

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface GenerateSKReportOptions {
  organizationId: string;
  userId?: string;
  trigger?: "PROACTIVE" | "MANUAL" | "CHAT";
  reportId?: string;
}

export interface ChatOptions {
  organizationId: string;
  userId: string;
  sessionId?: string;
  message: string;
}

export interface SKAdviceResponse {
  title?: string;
  summary?: string;
  overallScore?: number;
  scoreBreakdown?: Record<string, number>;
  confidence?: number;
  recommendations?: Array<{
    title?: string;
    advice?: string;
    rationale?: string;
    category?: string;
    priority?: string;
    platform?: string | null;
    socialAccountId?: string | null;
    confidence?: number;
    evidence?: unknown;
    citations?: unknown;
    impactBaseline?: unknown;
  }>;
  experiments?: Array<{
    title?: string;
    hypothesis?: string;
    platform?: string | null;
    metric?: string;
    baseline?: unknown;
  }>;
  brandKnowledgeUpdates?: Record<string, unknown> | null;
  progressNotes?: string[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function safeJsonParse<T>(text: string): T | null {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function normalizeCategory(value: unknown): (typeof skRecommendation.category.enumValues)[number] {
  const normalized = typeof value === "string" ? value.toUpperCase().replace(/\s+/g, "_") : "";
  const allowed = new Set([
    "CONTENT_STRATEGY",
    "CAPTION",
    "CREATIVE",
    "VIDEO",
    "TIMING",
    "HASHTAG",
    "PLATFORM",
    "COMPETITOR",
    "BRAND",
  ]) as Set<string>;
  return (
    allowed.has(normalized) ? normalized : "CONTENT_STRATEGY"
  ) as (typeof skRecommendation.category.enumValues)[number];
}

function normalizePriority(value: unknown): (typeof skRecommendation.priority.enumValues)[number] {
  const normalized = typeof value === "string" ? value.toUpperCase() : "";
  return (
    ["LOW", "MEDIUM", "HIGH"].includes(normalized) ? normalized : "MEDIUM"
  ) as (typeof skRecommendation.priority.enumValues)[number];
}

function toPlatform(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.toUpperCase();
  return Object.keys(PLATFORM_KNOWLEDGE).includes(normalized) ? normalized : null;
}

function clamp01(value: unknown, fallback = 0.6): number {
  const num = typeof value === "number" ? value : fallback;
  return Math.min(Math.max(num, 0), 1);
}

function tidySKText(text: string) {
  return text
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/<[^>]+>/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeSKChatAnswer(text: string) {
  const parsed = safeJsonParse<{ message?: string; response?: string; content?: string }>(text);
  const parsedText = parsed?.message || parsed?.response || parsed?.content;
  if (parsedText) return tidySKText(parsedText);

  const looseMatch = text
    .trim()
    .match(/^[{\s]*["'](?:message|response|content)["']\s*:\s*"([\s\S]*)"\s*}?\s*$/);
  if (looseMatch?.[1]) {
    try {
      return tidySKText(JSON.parse(`"${looseMatch[1]}"`) as string);
    } catch {
      return tidySKText(looseMatch[1] || text);
    }
  }

  return tidySKText(text);
}

// ─── OpenRouter Call ────────────────────────────────────────────────────────────

interface SKSettings {
  apiKey: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxReportsPerDay: number;
  maxChatsPerDay: number;
}

function getSKSettings(): SKSettings {
  const apiKey = env.OPENROUTER_API_KEY || "";
  if (!apiKey) throw new Error("OpenRouter API key not configured");

  return {
    apiKey,
    model: env.SK_MODEL || DEFAULT_SK_MODEL,
    systemPrompt: `${DEFAULT_SK_PROMPT}\n\n${env.SK_SYSTEM_PROMPT_OVERRIDE || ""}`.trim(),
    temperature: env.SK_TEMPERATURE ? Number.parseFloat(env.SK_TEMPERATURE) : DEFAULT_TEMPERATURE,
    maxReportsPerDay: env.SK_MAX_REPORTS_PER_DAY
      ? Number.parseInt(env.SK_MAX_REPORTS_PER_DAY, 10)
      : DEFAULT_MAX_REPORTS_PER_DAY,
    maxChatsPerDay: env.SK_MAX_CHATS_PER_DAY
      ? Number.parseInt(env.SK_MAX_CHATS_PER_DAY, 10)
      : DEFAULT_MAX_CHATS_PER_DAY,
  };
}

async function callOpenRouter(
  settings: SKSettings,
  messages: unknown[],
  maxTokens = DEFAULT_MAX_TOKENS,
  jsonMode = false,
): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
      "X-Title": "Sahabat Kreator SK",
    },
    body: JSON.stringify({
      model: settings.model,
      messages,
      temperature: settings.temperature,
      max_tokens: maxTokens,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter request failed: ${response.status} ${text.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string }; finish_reason?: string }[];
  };
  const choice = data.choices?.[0];
  const content = choice?.message?.content;
  if (!content) throw new Error("OpenRouter returned empty SK response");

  return content;
}

// ─── Context Collection ─────────────────────────────────────────────────────────

async function collectSKContext(organizationId: string) {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const [
    org,
    brandKnowledge,
    accounts,
    posts,
    competitors,
    platformKnowledge,
    previousRecommendations,
  ] = await Promise.all([
    db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
      columns: { id: true, name: true, tier: true },
    }),
    db.query.skBrandKnowledge.findFirst({
      where: eq(skBrandKnowledge.organizationId, organizationId),
    }),
    db.query.socialAccount.findMany({
      where: eq(socialAccount.organizationId, organizationId),
      columns: { id: true, platform: true, name: true, username: true, isActive: true },
    }),
    db.query.post.findMany({
      where: eq(post.organizationId, organizationId),
      orderBy: (post, { desc }) => [desc(post.publishedAt), desc(post.createdAt)],
      limit: 80,
    }),
    db.query.competitor.findMany({
      where: eq(competitor.organizationId, organizationId),
      limit: 20,
    }),
    db.query.skPlatformKnowledge.findMany({
      where: eq(skPlatformKnowledge.isActive, true),
      orderBy: (skPlatformKnowledge, { desc }) => desc(skPlatformKnowledge.updatedAt),
      limit: 50,
    }),
    db.query.skRecommendation.findMany({
      where: eq(skRecommendation.organizationId, organizationId),
      orderBy: (skRecommendation, { desc }) => desc(skRecommendation.updatedAt),
      limit: 30,
    }),
  ]);

  return {
    organization: org,
    skBrandKnowledge: brandKnowledge,
    accounts,
    posts,
    competitors,
    platformKnowledge,
    previousRecommendations,
  };
}

// ─── Fallback Report ────────────────────────────────────────────────────────────

function fallbackSKReport(
  context: Awaited<ReturnType<typeof collectSKContext>>,
  rawResponse?: string,
): SKAdviceResponse {
  const postCount = context.posts.length;
  const platforms = Array.from(new Set(context.accounts.map((a) => a.platform))).filter(Boolean);

  return {
    title: "Laporan Pelatih SK Media Sosial",
    summary: `SK meninjau ${postCount} postingan terbaru${platforms.length ? ` di ${platforms.join(", ")}` : ""}. Laporan ini memberikan langkah next steps berdasarkan data yang tersedia.`,
    overallScore: postCount > 0 ? 62 : 40,
    scoreBreakdown: {
      captions: postCount > 0 ? 60 : 35,
      visualHooks: postCount > 0 ? 58 : 35,
      videoQuality: postCount > 0 ? 55 : 35,
      platformFit: platforms.length > 0 ? 65 : 40,
      brandConsistency: 60,
      competitorGap: context.competitors.length ? 60 : 45,
      postingRhythm: postCount > 0 ? 62 : 35,
    },
    confidence: 0.35,
    recommendations: [
      {
        title: "Perkuat kesan pertama di setiap postingan",
        advice:
          "Tinjau baris pembuka, frame pertama, atau thumbnail sebelum mempublikasikan. Buat manfaat bagi penonton jelas segera dan hapus setup lambat yang menunda hook.",
        rationale:
          "Kejelasan hook adalah peningkatan high-impact yang aman di semua platform media sosial.",
        category: "CREATIVE",
        priority: "HIGH",
        platform: null,
        confidence: 0.45,
        evidence: {
          basedOn: `${postCount} postingan tersedia di konteks SK`,
          metrics: ["riwayat postingan", "konteks media"],
        },
        citations: [{ type: "post", label: "Postingan organisasi terbaru", id: "recent-posts" }],
        impactBaseline: {
          metric: "engagementRate",
          current: "Gunakan rata-rata 30 hari saat ini sebagai baseline",
        },
      },
      {
        title: "Gunakan brand knowledge untuk memperbaiki kualitas saran",
        advice:
          "Isi brand knowledge SK untuk audience, positioning, produk, penawaran, aturan voice, dan topik yang dihindari. Ini memberi SK batasan lebih kuat dan rekomendasi lebih spesifik.",
        rationale:
          "Konteks merek meningkatkan kualitas caption, kreatif, dan saran kompetitor sambil menjaga SK tetap fokus pada bisnis ini.",
        category: "BRAND",
        priority: "MEDIUM",
        platform: null,
        confidence: 0.5,
        evidence: {
          basedOn: "Ketersediaan brand knowledge SK",
          metrics: ["kelengkapan konteks merek"],
        },
        citations: [
          { type: "platform_knowledge", label: "Brand knowledge SK", id: "sk-brand-knowledge" },
        ],
      },
    ],
    experiments: [
      {
        title: "Uji hook yang lebih jelas selama tujuh hari",
        hypothesis:
          "Postingan dengan manfaat langsung di baris pertama atau frame pertama akan mengungguli pembuka yang samar.",
        platform: null,
        metric: "engagementRate",
        baseline: { current: "Rata-rata engagement rate 30 hari saat ini" },
      },
    ],
    brandKnowledgeUpdates: rawResponse
      ? {
          repairNote:
            "SK menerima respons model non-JSON. Tinjau pilihan model atau prompt jika ini berulang.",
        }
      : null,
    progressNotes: ["Laporan fallback dibuat karena respons model bukan JSON valid."],
  };
}

// ─── Generate Report ────────────────────────────────────────────────────────────

export async function generateSKReport({
  organizationId,
  userId,
  trigger = "MANUAL",
  reportId,
}: GenerateSKReportOptions) {
  const settings = getSKSettings();
  const context = await collectSKContext(organizationId);
  const inputHash = JSON.stringify(context).slice(0, 1000);

  const contextJSON = JSON.stringify({
    organizationName: context.organization?.name,
    tier: context.organization?.tier,
    currentTimestamp: new Date().toISOString(),
    connectedAccounts: context.accounts.map((a) => ({
      id: a.id,
      platform: a.platform,
      name: a.name,
      username: a.username,
      isActive: a.isActive,
    })),
    recentPosts: context.posts.slice(0, 40).map((p) => ({
      id: p.id,
      caption: p.caption,
      status: p.status,
      postType: p.postType,
      publishedAt: p.publishedAt,
    })),
    competitors: context.competitors.slice(0, 10).map((c) => ({
      name: c.name,
      username: c.platformHandle,
    })),
    platformKnowledge: context.platformKnowledge.map((pk) => ({
      platform: pk.platform,
      guidance: pk.content,
    })),
    previousRecommendations: context.previousRecommendations.slice(0, 15).map((r) => ({
      title: r.title,
      category: r.category,
      status: r.status,
      platform: r.platform,
    })),
    brandKnowledge: context.skBrandKnowledge
      ? {
          audience: context.skBrandKnowledge.audience,
          positioning: context.skBrandKnowledge.positioning,
          products: context.skBrandKnowledge.products,
          voiceRules: context.skBrandKnowledge.voiceRules,
          bannedTopics: context.skBrandKnowledge.bannedTopics,
        }
      : null,
  });

  const prompt = `Buat laporan pelatih SK media sosial proaktif untuk organisasi ini. Gunakan semua data yang disediakan, sertakan peluang kompetitor, tracking kemajuan, confidence, citations, impact baselines, dan saran untuk semua platform yang terhubung secara setara. Jangan menghukum postingan STORY karena caption tulisan pendek atau tidak ada karena Stories sering mengandalkan teks visual dan stiker. Kembalikan JSON ketat dengan bentuk: {"title":"string","summary":"string","overallScore":0-100,"scoreBreakdown":{"captions":0-100,"visualHooks":0-100,"videoQuality":0-100,"platformFit":0-100,"brandConsistency":0-100,"competitorGap":0-100,"postingRhythm":0-100},"confidence":0-1,"recommendations":[{"title":"string","advice":"string","rationale":"string","category":"CONTENT_STRATEGY|CAPTION|CREATIVE|VIDEO|TIMING|HASHTAG|PLATFORM|COMPETITOR|BRAND","priority":"LOW|MEDIUM|HIGH","platform":"INSTAGRAM|FACEBOOK|TIKTOK|YOUTUBE|PINTEREST|GOOGLE_BUSINESS|LINKEDIN|BLUESKY|THREADS|META|MANUAL|null","confidence":0-1,"evidence":{"basedOn":"string"},"citations":[{"type":"post|analytics|competitor|platform_knowledge","label":"string","id":"string"}],"impactBaseline":{"metric":"string","current":"string"}}],"experiments":[{"title":"string","hypothesis":"string","platform":"INSTAGRAM|FACEBOOK|TIKTOK|YOUTUBE|PINTEREST|GOOGLE_BUSINESS|LINKEDIN|BLUESKY|THREADS|META|MANUAL|null","metric":"string","baseline":{"current":"string"}}],"brandKnowledgeUpdates":{"learnedInsights":[]},"progressNotes":["string"]}. Konteks:\n${contextJSON}`;

  let rawContent = "";
  try {
    rawContent = await callOpenRouter(
      settings,
      [
        { role: "system", content: settings.systemPrompt },
        { role: "user", content: prompt },
      ],
      DEFAULT_MAX_TOKENS,
      true,
    );
  } catch (error) {
    console.error("[SK] Report generation failed:", error);
    throw error;
  }

  let parsed = safeJsonParse<SKAdviceResponse>(rawContent);

  if (!parsed) {
    console.warn("[SK] Invalid JSON response, using fallback report");
    parsed = fallbackSKReport(context, rawContent);
  }

  const accountIds = new Set(context.accounts.map((a) => a.id));

  const reportData = {
    id: reportId || crypto.randomUUID(),
    organizationId,
    trigger,
    status: "COMPLETED" as const,
    title: parsed.title || "Laporan Pelatih SK Media Sosial",
    summary: parsed.summary || "SK meninjau konten dan analitik terbaru Anda.",
    overallScore:
      typeof parsed.overallScore === "number"
        ? Math.min(Math.max(parsed.overallScore, 0), 100)
        : null,
    scoreBreakdown: (parsed.scoreBreakdown || {}) as object,
    confidence: clamp01(parsed.confidence),
    model: settings.model,
    inputHash,
    generatedById: userId || null,
    metadata: { progressNotes: parsed.progressNotes || [] } as object,
  };

  let report;

  if (reportId) {
    report = await db.update(skReport).set(reportData).where(eq(skReport.id, reportId)).returning();
    report = report[0];

    // Delete old recommendations for this report and recreate
    await db.delete(skRecommendation).where(eq(skRecommendation.reportId, reportId));
  } else {
    report = await db.insert(skReport).values(reportData).returning();
    report = report[0];
  }

  if (report) {
    const newReportId = report.id;

    if (parsed.recommendations?.length) {
      const recData = parsed.recommendations.slice(0, 20).map((rec) => ({
        id: crypto.randomUUID(),
        organizationId,
        socialAccountId:
          rec.socialAccountId && accountIds.has(rec.socialAccountId) ? rec.socialAccountId : null,
        reportId: newReportId,
        title: rec.title || "Tingkatkan performa konten",
        advice: rec.advice || "",
        rationale: rec.rationale || null,
        category: normalizeCategory(rec.category),
        priority: normalizePriority(rec.priority),
        status: "PENDING" as const,
        platform: toPlatform(rec.platform),
        confidence: clamp01(rec.confidence),
        evidence: (rec.evidence || {}) as object,
        citations: (rec.citations || []) as object,
        impactBaseline: (rec.impactBaseline || undefined) as object | undefined,
      }));

      await db.insert(skRecommendation).values(recData);
    }

    if (parsed.experiments?.length) {
      const expData = parsed.experiments.slice(0, 8).map((exp) => ({
        id: crypto.randomUUID(),
        organizationId,
        reportId: newReportId,
        title: exp.title || "Eksperimen konten SK",
        hypothesis: exp.hypothesis || "Menguji ide ini dapat meningkatkan performa sosial.",
        platform: toPlatform(exp.platform),
        metric: exp.metric || "engagementRate",
        baseline: (exp.baseline || {}) as object,
      }));

      await db.insert(skExperiment).values(expData);
    }

    if (parsed.brandKnowledgeUpdates) {
      await db
        .update(skBrandKnowledge)
        .set({
          pendingInsights: parsed.brandKnowledgeUpdates as object,
          updatedBySkAt: new Date(),
        })
        .where(eq(skBrandKnowledge.organizationId, organizationId));
    }
  }

  return report;
}

// ─── Chat ───────────────────────────────────────────────────────────────────────

export async function chatWithSK({ organizationId, userId, sessionId, message }: ChatOptions) {
  const settings = getSKSettings();

  let session = sessionId
    ? await db.select().from(skChatSession).where(eq(skChatSession.id, sessionId)).limit(1)
    : [];

  if (!session?.[0]) {
    const newSession = await db
      .insert(skChatSession)
      .values({
        id: crypto.randomUUID(),
        organizationId,
        userId,
        title: message.slice(0, 60) || "Chat SK",
      })
      .returning();
    session = newSession;
  }

  if (!session[0]) throw new Error("SK chat session not found");

  const [context, history] = await Promise.all([
    collectSKContext(organizationId),
    db
      .select()
      .from(skChatMessage)
      .where(eq(skChatMessage.sessionId, session[0].id))
      .orderBy(skChatMessage.createdAt)
      .limit(20),
  ]);

  // Save user message
  await db.insert(skChatMessage).values({
    id: crypto.randomUUID(),
    sessionId: session[0].id,
    role: "USER",
    content: message,
  });

  const contextJSON = JSON.stringify({
    organizationName: context.organization?.name,
    tier: context.organization?.tier,
    connectedAccounts: context.accounts.map((a) => ({
      id: a.id,
      platform: a.platform,
      name: a.name,
      username: a.username,
    })),
    brandKnowledge: context.skBrandKnowledge
      ? {
          audience: context.skBrandKnowledge.audience,
          positioning: context.skBrandKnowledge.positioning,
          products: context.skBrandKnowledge.products,
          voiceRules: context.skBrandKnowledge.voiceRules,
          bannedTopics: context.skBrandKnowledge.bannedTopics,
        }
      : null,
    recentPosts: context.posts.slice(0, 20).map((p) => ({
      caption: p.caption,
      status: p.status,
    })),
    platformKnowledge: context.platformKnowledge.map((pk) => ({
      platform: pk.platform,
      guidance: pk.content,
    })),
  });

  const chatSystemPrompt = `${settings.systemPrompt}

Anda berada dalam mode chat. Abaikan instruksi JSON-only untuk mode laporan pada balasan ini. Kembalikan teks biasa yang bersih, dengan paragraf pendek atau daftar bernomor sederhana. Jangan bungkus jawaban dalam JSON, markdown fence, atau objek response/message/content. Jawab secara konversational tapi tetap fokus pada media sosial organisasi ini. Semua waktu posting dan waktu yang dijadwalkan dalam timezone organisasi. Jika ditanya pertanyaan tidak relevan, alihkan kembali ke saran media sosial.

Konteks organisasi untuk chat SK:
${contextJSON}`;

  const messages = [
    { role: "system", content: chatSystemPrompt },
    ...history.map((item) => ({
      role: item.role === "USER" ? "user" : "assistant",
      content: item.content,
    })),
    { role: "user", content: message },
  ];

  let answer = "";
  try {
    answer = await callOpenRouter(settings, messages, DEFAULT_CHAT_MAX_TOKENS);
  } catch (error) {
    console.error("[SK] Chat failed:", error);
    answer = "Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi.";
  }

  const normalizedAnswer = normalizeSKChatAnswer(answer);

  const savedMessage = await db
    .insert(skChatMessage)
    .values({
      id: crypto.randomUUID(),
      sessionId: session[0].id,
      role: "ASSISTANT",
      content: normalizedAnswer,
    })
    .returning();

  await db
    .update(skChatSession)
    .set({ updatedAt: new Date() })
    .where(eq(skChatSession.id, session[0].id));

  return {
    session: { id: session[0].id },
    message: savedMessage[0],
  };
}

// ─── Get Reports ────────────────────────────────────────────────────────────────

export async function getSKReports(organizationId: string) {
  const [latest, history] = await Promise.all([
    db
      .select()
      .from(skReport)
      .where(eq(skReport.organizationId, organizationId))
      .orderBy(skReport.createdAt)
      .limit(1),
    db
      .select()
      .from(skReport)
      .where(eq(skReport.organizationId, organizationId))
      .orderBy(skReport.createdAt)
      .limit(12),
  ]);

  const latestReport = latest[0];

  let recommendations: (typeof skRecommendation.$inferSelect)[] = [];
  let experiments: (typeof skExperiment.$inferSelect)[] = [];

  if (latestReport) {
    [recommendations, experiments] = await Promise.all([
      db
        .select()
        .from(skRecommendation)
        .where(eq(skRecommendation.reportId, latestReport.id))
        .orderBy(skRecommendation.priority, skRecommendation.createdAt),
      db
        .select()
        .from(skExperiment)
        .where(eq(skExperiment.reportId, latestReport.id))
        .orderBy(skExperiment.createdAt),
    ]);
  }

  return {
    latest: latestReport
      ? {
          ...latestReport,
          recommendations,
          experiments,
        }
      : null,
    history: history.map((r) => ({
      id: r.id,
      title: r.title,
      summary: r.summary,
      overallScore: r.overallScore,
      confidence: r.confidence,
      trigger: r.trigger,
      status: r.status,
      createdAt: r.createdAt,
    })),
  };
}

// ─── Usage Limits ───────────────────────────────────────────────────────────────

export function getSKUsageLimits() {
  const settings = getSKSettings();
  return {
    maxReportsPerDay: settings.maxReportsPerDay,
    maxChatsPerDay: settings.maxChatsPerDay,
  };
}

// ─── Brand Knowledge ────────────────────────────────────────────────────────────

export async function getSKBrandKnowledge(organizationId: string) {
  const knowledge = await db
    .select()
    .from(skBrandKnowledge)
    .where(eq(skBrandKnowledge.organizationId, organizationId))
    .limit(1);
  return knowledge[0] || null;
}

export async function updateSKBrandKnowledge(
  organizationId: string,
  data: Partial<{
    websiteUrl: string;
    audience: string;
    positioning: string;
    products: string;
    offers: string;
    voiceRules: string;
    bannedTopics: string;
  }>,
) {
  await db
    .select()
    .from(skBrandKnowledge)
    .where(eq(skBrandKnowledge.organizationId, organizationId))
    .limit(1);

  const result = await db
    .insert(skBrandKnowledge)
    .values({
      id: crypto.randomUUID(),
      organizationId,
      ...data,
      updatedBySkAt: new Date(),
    })
    .onConflictDoUpdate({
      target: skBrandKnowledge.organizationId,
      set: {
        websiteUrl: data.websiteUrl ?? skBrandKnowledge.websiteUrl,
        audience: data.audience ?? skBrandKnowledge.audience,
        positioning: data.positioning ?? skBrandKnowledge.positioning,
        products: data.products ?? skBrandKnowledge.products,
        offers: data.offers ?? skBrandKnowledge.offers,
        voiceRules: data.voiceRules ?? skBrandKnowledge.voiceRules,
        bannedTopics: data.bannedTopics ?? skBrandKnowledge.bannedTopics,
        updatedBySkAt: new Date(),
      },
    })
    .returning();

  return result[0];
}
