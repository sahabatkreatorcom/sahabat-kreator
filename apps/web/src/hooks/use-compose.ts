"use client";

import { useState, useEffect } from "react";
import { postsApi, aiCaptionApi } from "@/lib/api-client";

export type PostType = "POST" | "STORY" | "REEL" | "CAROUSEL" | "VIDEO";
export type PostStatus = "DRAFT" | "SCHEDULED" | "PUBLISHING" | "PUBLISHED" | "FAILED";
export type Tone = "profesional" | "kasual" | "formal" | "lucu";
export type Style = "pendek" | "panjang" | "hook" | "storytelling" | "edukatif";

export interface ComposeFormData {
  caption: string;
  postType: PostType;
  scheduledAt?: string;
  status: PostStatus;
  pillarId?: string;
  hashtagIds?: string[];
  mediaIds?: string[];
  socialAccountId: string;
}

export interface ComposeState {
  form: ComposeFormData;
  caption: string;
  postType: PostType;
  scheduledAt: string | null;
  status: PostStatus;
  isLoading: boolean;
  error: string | null;
}

interface UseComposeOptions {
  onSuccess?: () => void;
}

export function useCompose(options: UseComposeOptions = {}) {
  const { onSuccess } = options;

  const [state, setState] = useState<ComposeState>({
    form: {
      caption: "",
      postType: "POST",
      scheduledAt: undefined,
      status: "DRAFT",
      pillarId: undefined,
      hashtagIds: [],
      mediaIds: [],
      socialAccountId: "",
    },
    caption: "",
    postType: "POST",
    scheduledAt: null,
    status: "DRAFT",
    isLoading: false,
    error: null,
  });

  const updateField = <K extends keyof ComposeFormData>(field: K, value: ComposeFormData[K]) => {
    setState((prev) => ({
      ...prev,
      form: { ...prev.form, [field]: value },
      [field]: value,
    }));
  };

  const setCaption = (caption: string) => {
    setState((prev) => ({
      ...prev,
      form: { ...prev.form, caption },
      caption,
    }));
  };

  const generateCaption = async (topic: string, tone: Tone, style: Style) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const res = await aiCaptionApi.generate({ topic, tone, style, includeEmojis: true, includeHashtags: true });
      if (res.ok) {
        setCaption(res.data.caption);
      }
    } catch {
      setState((prev) => ({ ...prev, error: "Gagal menghasilkan caption" }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const saveDraft = async (): Promise<{ ok: boolean; error?: string }> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const res = await postsApi.create({ ...state.form, status: "DRAFT" });

      if (res.ok) {
        return { ok: true };
      } else {
        return { ok: false, error: (res as { ok: false; error: string }).error };
      }
    } catch {
      return { ok: false, error: "Gagal menyimpan draft" };
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const schedulePost = async (): Promise<{ ok: boolean; error?: string }> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const res = await postsApi.create({
        ...state.form,
        scheduledAt: state.form.scheduledAt || new Date().toISOString(),
        status: "SCHEDULED",
      });

      if (res.ok) {
        if (onSuccess) onSuccess();
        return { ok: true };
      } else {
        return { ok: false, error: (res as { ok: false; error: string }).error };
      }
    } catch {
      return { ok: false, error: "Gagal menjadwalkan post" };
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return {
    state,
    updateField,
    setCaption,
    generateCaption,
    saveDraft,
    schedulePost,
  };
}
