import { env } from "@sahabatkreator/env/server";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";

const aiAssistApp = new Hono();

aiAssistApp.use("/*", requireAuth);

// POST /api/ai/generate-reply
aiAssistApp.post("/generate-reply", async (c) => {
  const body = await c.req.json();
  const schema = z.object({
    comment: z.string().min(1),
    platform: z.string().optional(),
    tone: z.enum(["profesional", "kasual", "ramah", "formal"]).default("ramah"),
    context: z.string().optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const { comment, platform, tone, context } = parsed.data;
  const apiKey = env.OPENROUTER_API_KEY ?? "";

  if (!apiKey) {
    return c.json({
      reply: "Terima kasih atas komentarnya! 🙏",
      source: "fallback",
    });
  }

  try {
    const toneMap: Record<string, string> = {
      profesional: "Professional and respectful tone.",
      kasual: "Casual and friendly tone.",
      ramah: "Warm and friendly tone.",
      formal: "Formal and polite tone.",
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
            content: `You are a social media manager. Generate a reply to a ${platform || "social media"} comment. ${toneMap[tone] || toneMap.ramah} Reply in Bahasa Indonesia. Be natural and authentic.`,
          },
          {
            role: "user",
            content: `Comment to reply to: "${comment}"${context ? `\nContext: ${context}` : ""}\n\nGenerate ONLY the reply text, nothing else.`,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };

    if (data.choices?.[0]?.message?.content) {
      return c.json({ reply: data.choices[0].message.content.trim(), source: "ai" });
    }
    throw new Error("Invalid response");
  } catch (error) {
    console.error("[AI Reply] Generation failed:", error);
    return c.json({ reply: "Terima kasih atas komentarnya! 🙏", source: "fallback" });
  }
});

// POST /api/ai/generate-alt-text
aiAssistApp.post("/generate-alt-text", async (c) => {
  const body = await c.req.json();
  const schema = z.object({
    imageUrl: z.string().url(),
    context: z.string().optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input" }, 400);
  }

  const { imageUrl, context } = parsed.data;
  const apiKey = env.OPENROUTER_API_KEY ?? "";

  if (!apiKey) {
    return c.json({ altText: "Gambar konten", source: "fallback" });
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
              "You are an accessibility expert. Generate descriptive alt text for social media images in Bahasa Indonesia. Be concise but descriptive.",
          },
          {
            role: "user",
            content: `Generate alt text for this image URL: ${imageUrl}${context ? `\nContext: ${context}` : ""}\n\nReturn ONLY the alt text, nothing else.`,
          },
        ],
        max_tokens: 100,
        temperature: 0.5,
      }),
    });

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };

    if (data.choices?.[0]?.message?.content) {
      return c.json({ altText: data.choices[0].message.content.trim(), source: "ai" });
    }
    throw new Error("Invalid response");
  } catch {
    return c.json({ altText: "Gambar konten", source: "fallback" });
  }
});

// POST /api/ai/generate-tags
aiAssistApp.post("/generate-tags", async (c) => {
  const body = await c.req.json();
  const schema = z.object({
    topic: z.string().min(2),
    platform: z.string().optional(),
    count: z.number().min(1).max(30).default(10),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input" }, 400);
  }

  const { topic, platform, count } = parsed.data;
  const apiKey = env.OPENROUTER_API_KEY ?? "";

  if (!apiKey) {
    const fallbackTags = [
      "#ContentCreator",
      "#Tips",
      "#Viral",
      "#Trending",
      "#KontenKreator",
      "#SocialMedia",
      "#Indonesia",
    ].slice(0, count);
    return c.json({ tags: fallbackTags, source: "fallback" });
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
              "You are a hashtag expert for Indonesian social media. Generate relevant, trending hashtags. Mix popular and niche tags for maximum reach.",
          },
          {
            role: "user",
            content: `Generate ${count} hashtags for the topic: "${topic}"${platform ? ` on ${platform}` : ""}\n\nReturn ONLY the hashtags separated by spaces, starting with #. No explanations.`,
          },
        ],
        max_tokens: 200,
        temperature: 0.8,
      }),
    });

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };

    if (data.choices?.[0]?.message?.content) {
      const tags = data.choices[0].message.content
        .trim()
        .split(/\s+/)
        .filter((t: string) => t.startsWith("#"))
        .slice(0, count);
      return c.json({ tags, source: "ai" });
    }
    throw new Error("Invalid response");
  } catch {
    return c.json({
      tags: ["#ContentCreator", "#Tips", "#Viral", "#Trending", "#KontenKreator"].slice(0, count),
      source: "fallback",
    });
  }
});

// POST /api/ai/predict-score
aiAssistApp.post("/predict-score", async (c) => {
  const body = await c.req.json();
  const schema = z.object({
    caption: z.string().min(1),
    postType: z.string().optional(),
    platform: z.string().optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input" }, 400);
  }

  const { caption, postType, platform } = parsed.data;
  const apiKey = env.OPENROUTER_API_KEY ?? "";

  if (!apiKey) {
    return c.json({
      score: 65,
      suggestions: ["Tambahkan hashtag yang lebih relevan", "Gunakan hook yang lebih kuat"],
      source: "fallback",
    });
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
              "You are a social media engagement predictor. Analyze a post caption and predict its engagement score (0-100) with suggestions. Return JSON with score and suggestions array.",
          },
          {
            role: "user",
            content: `Analyze this post:\nCaption: "${caption}"\nType: ${postType || "POST"}\nPlatform: ${platform || "all"}\n\nReturn JSON: { "score": number, "suggestions": ["suggestion1", "suggestion2"] }`,
          },
        ],
        max_tokens: 300,
        temperature: 0.5,
      }),
    });

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };

    if (data.choices?.[0]?.message?.content) {
      try {
        const jsonMatch = data.choices[0].message.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          return c.json({ ...result, source: "ai" });
        }
      } catch {
        // parse error, fall through
      }
    }
    throw new Error("Invalid response");
  } catch {
    return c.json({
      score: 65,
      suggestions: ["Tambahkan hashtag yang lebih relevan", "Gunakan hook yang lebih kuat"],
      source: "fallback",
    });
  }
});

// POST /api/ai/rewrite-caption
aiAssistApp.post("/rewrite-caption", async (c) => {
  const body = await c.req.json();
  const schema = z.object({
    caption: z.string().min(1),
    instruction: z.string().min(1),
  });

  const parsed = schema.safeParse(body);
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
              "You are an expert social media copywriter. Rewrite the caption based on the user's instruction. Return ONLY the rewritten caption in Bahasa Indonesia.",
          },
          {
            role: "user",
            content: `Original: "${caption}"\nInstruction: ${instruction}\n\nReturn ONLY the rewritten caption.`,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };

    if (data.choices?.[0]?.message?.content) {
      return c.json({ caption: data.choices[0].message.content.trim(), source: "ai" });
    }
    throw new Error("Invalid response");
  } catch {
    return c.json({ caption, source: "fallback" });
  }
});

export default aiAssistApp;
