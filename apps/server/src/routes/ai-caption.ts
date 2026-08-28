import { Hono } from "hono";
import { z } from "zod";
import { env } from "@sahabatkreator/env/server";
import { requireAuth } from "../lib/auth-middleware";

const aiCaptionApp = new Hono();

aiCaptionApp.use("/*", requireAuth);

const generateSchema = z.object({
  topic: z.string().min(2).max(200),
  platform: z.enum(["instagram", "youtube", "facebook", "tiktok", "twitter", "linkedin"]).optional(),
  tone: z.enum(["profesional", "kasual", "formal", "lucu"]).default("kasual"),
  style: z.enum(["pendek", "panjang", "hook", "storytelling", "edukatif"]).default("pendek"),
  includeEmojis: z.boolean().default(true),
  includeHashtags: z.boolean().default(true),
});

aiCaptionApp.post("/generate-caption", async (c) => {
  const body = await c.req.json();
  const parsed = generateSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const { topic, platform, tone, style, includeEmojis, includeHashtags } = parsed.data;

  const apiKey = env.OPENROUTER_API_KEY ?? "";
  if (!apiKey) {
    return c.json({
      caption: getFallbackCaption(topic, tone, style, includeEmojis, includeHashtags),
      source: "fallback",
    });
  }

  try {
    const emojiInstruction = includeEmojis ? "Include relevant emojis naturally." : "No emojis.";
    const hashtagInstruction = includeHashtags
      ? "Include 5-10 relevant hashtags at the end."
      : "No hashtags.";

    const platformContext = platform
      ? `The post is for ${platform}. Optimize for that platform's best practices.`
      : "The post is for general social media.";

    const styleMap: Record<string, string> = {
      pendek: "Short and punchy, 1-2 sentences max. Great for quick engagement.",
      panjang: "Longer form, 3-5 sentences with detailed content. Great for storytelling.",
      hook: "Start with a strong hook that grabs attention in the first line.",
      storytelling: "Tell a short story or anecdote related to the topic.",
      edukatif: "Educational format with tips or step-by-step content.",
    };

    const toneMap: Record<string, string> = {
      profesional: "Professional and authoritative tone.",
      kasual: "Casual and friendly tone, like talking to a friend.",
      formal: "Formal and structured tone.",
      lucu: "Humorous and fun tone, with jokes or witty remarks.",
    };

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
              "You are an expert social media copywriter for Indonesian market. Generate captions in Bahasa Indonesia that are engaging and authentic. Return ONLY the caption text, no explanations.",
          },
          {
            role: "user",
            content: `Write a social media caption about: "${topic}"

Style: ${styleMap[style] || styleMap.pendek}
Tone: ${toneMap[tone] || toneMap.kasual}
Platform: ${platformContext}
Emojis: ${emojiInstruction}
Hashtags: ${hashtagInstruction}

Return ONLY the caption, nothing else.`,
          },
        ],
        max_tokens: 500,
        temperature: 0.8,
      }),
    });

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };

    if (data.choices?.[0]?.message?.content) {
      let caption = data.choices[0].message.content.trim();
      // Remove any markdown formatting
      caption = caption.replace(/^["']|["']$/g, "").trim();
      return c.json({ caption, source: "ai" });
    }

    throw new Error("Invalid response");
  } catch (error) {
    console.error("[AI Caption] Generation failed:", error);
    return c.json({
      caption: getFallbackCaption(topic, tone, style, includeEmojis, includeHashtags),
      source: "fallback",
    });
  }
});

aiCaptionApp.post("/improve-caption", async (c) => {
  const body = await c.req.json();
  const improveSchema = z.object({
    caption: z.string().min(1),
    instruction: z.string().min(1),
  });

  const parsed = improveSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input" }, 400);
  }

  const { caption, instruction } = parsed.data;

  const apiKey = env.OPENROUTER_API_KEY ?? "";
  if (!apiKey) {
    return c.json({ caption, source: "fallback" });
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
              "You are an expert social media copywriter. Improve the caption based on the user's instruction. Return ONLY the improved caption in Bahasa Indonesia.",
          },
          {
            role: "user",
            content: `Original caption:\n"${caption}"\n\nInstruction: ${instruction}\n\nReturn ONLY the improved caption, nothing else.`,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };

    if (data.choices?.[0]?.message?.content) {
      let improved = data.choices[0].message.content.trim();
      improved = improved.replace(/^["']|["']$/g, "").trim();
      return c.json({ caption: improved, source: "ai" });
    }

    throw new Error("Invalid response");
  } catch (error) {
    console.error("[AI Caption] Improvement failed:", error);
    return c.json({ caption, source: "fallback" });
  }
});

function getFallbackCaption(
  topic: string,
  _tone: string,
  style: string,
  includeEmojis: boolean,
  includeHashtags: boolean,
): string {
  const emojis = includeEmojis ? " ✨" : "";
  const hashtags = includeHashtags ? `\n\n#${topic.replace(/\s+/g, "")} #Konten #Tips` : "";

  const pendek = `${topic}${emojis} Yuk cek selengkapnya!${hashtags}`;
  const panjang = `Tahukah kamu tentang ${topic}?${emojis}\n\nBanyak yang belum tahu fakta menarik ini. Simak penjelasannya di bawah ya!\n\nSemoga bermanfaat untuk kamu semua${hashtags}`;
  const hook = `STOP! Kamu wajib tahu ini tentang ${topic}${emojis}${hashtags}`;
  const storytelling = `Dulu aku juga ga tau tentang ${topic}...${emojis}\n\nTapi setelah coba, ternyata beds banget! Mau tau ceritanya?${hashtags}`;
  const edukatif = `📚 Tutorial ${topic}:\n\n1. Langkah pertama\n2. Langkah kedua\n3. Langkah ketiga${emojis}\n\nSimpan post ini buat referensi nanti!${hashtags}`;

  const templates: Record<string, string> = { pendek, panjang, hook, storytelling, edukatif };
  return templates[style] ?? pendek;
}

export default aiCaptionApp;
