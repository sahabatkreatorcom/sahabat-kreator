"use client";

import { useEffect, useState } from "react";
import { postsApi } from "@/lib/api-client";

interface CalendarData {
  posts: unknown[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCalendarData() {
  const [posts, setPosts] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await postsApi.list({ limit: 100 });

      if (res.ok) {
        setPosts((res as { ok: true; data: { posts: unknown[] } }).data.posts || []);
      } else {
        setError((res as { ok: false; error: string }).error);
      }
    } catch {
      setError("Gagal memuat data kalender");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return { posts, loading, error, refetch: fetchPosts };
}
