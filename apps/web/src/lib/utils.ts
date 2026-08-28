import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export async function safeParseJson(
  request: Request,
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  const body = await request.text();
  if (!body) {
    return { ok: false, error: "Empty request body" };
  }
  try {
    const data = JSON.parse(body);
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Invalid JSON in request body" };
  }
}

export function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
