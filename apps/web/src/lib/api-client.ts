import { env } from "@sahabatkreator/env/web";

const API_BASE = env.NEXT_PUBLIC_SERVER_URL;

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...options?.headers },
      ...options,
    });

    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: data.error || `HTTP ${res.status}` };
    }

    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

// ── Posts ────────────────────────────────────────────────────────
export const postsApi = {
  list: (params?: { status?: string; limit?: number; offset?: number }) =>
    request<{ posts: unknown[] }>(
      `/api/posts${params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : ""}`,
    ),

  get: (id: string) => request<{ post: unknown }>(`/api/posts/${id}`),

  create: (data: Record<string, unknown>) =>
    request<{ post: unknown }>("/api/posts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Record<string, unknown>) =>
    request<{ post: unknown }>(`/api/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/api/posts/${id}`, {
      method: "DELETE",
    }),

  getCalendar: (start: string, end: string) =>
    request<{ posts: unknown[] }>(
      `/api/posts/calendar/${encodeURIComponent(start)}/${encodeURIComponent(end)}`,
    ),
};

// ── Media ────────────────────────────────────────────────────────
export interface MediaItem {
  id: string;
  url: string;
  mimeType: string;
  fileName?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  r2Key?: string;
  createdAt: string;
}

export const mediaApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    request<{ media: MediaItem[] }>(
      `/api/media${params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : ""}`,
    ),

  presignedUpload: (fileName: string, mimeType: string, size?: number) =>
    request<{
      uploadUrl: string;
      downloadUrl: string;
      publicUrl: string;
      key: string;
    }>(
      `/api/media/presigned?fileName=${encodeURIComponent(fileName)}&mimeType=${encodeURIComponent(mimeType)}${size ? `&size=${size}` : ""}`,
    ),

  uploadComplete: (data: {
    url: string;
    mimeType: string;
    fileName?: string;
    fileSize?: number;
    width?: number;
    height?: number;
    thumbnailUrl?: string;
    r2Key?: string;
  }) =>
    request<{ media: MediaItem }>("/api/media", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/api/media/${id}`, {
      method: "DELETE",
    }),
};

// ── Calendar ─────────────────────────────────────────────────────
export const calendarApi = {
  getEvents: (start: string, end: string) =>
    request<{ posts: unknown[]; notes: unknown[] }>(
      `/api/calendar/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
    ),

  createNote: (data: { content: string; date: string }) =>
    request<{ note: unknown }>("/api/calendar/notes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateNote: (id: string, data: Record<string, unknown>) =>
    request<{ note: unknown }>(`/api/calendar/notes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteNote: (id: string) =>
    request<{ success: boolean }>(`/api/calendar/notes/${id}`, {
      method: "DELETE",
    }),

  quickAdd: (data: {
    caption?: string;
    scheduledAt: string;
    socialAccountId?: string;
    postType?: string;
  }) =>
    request<{ post: unknown }>("/api/calendar/quick-add", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ── Social Accounts ──────────────────────────────────────────────
export const accountsApi = {
  list: () => request<{ accounts: unknown[] }>("/api/accounts"),

  connect: (data: {
    platform: string;
    platformAccountId: string;
    name: string;
    username?: string;
    accessToken?: string;
    refreshToken?: string;
  }) =>
    request<{ account: unknown }>("/api/accounts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  disconnect: (id: string) =>
    request<{ success: boolean }>(`/api/accounts/${id}`, {
      method: "DELETE",
    }),
};

// ── Team / Members ───────────────────────────────────────────────
export const teamApi = {
  getMembers: () =>
    request<{ members: TeamMember[]; invitations: TeamInvitation[] }>("/api/team/members"),

  invite: (data: { email: string; role: "admin" | "editor" | "viewer" }) =>
    request<{ invitation: unknown }>("/api/team/invite", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateRole: (memberId: string, role: "admin" | "editor" | "viewer") =>
    request<{ member: unknown }>(`/api/team/members/${memberId}`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    }),

  removeMember: (memberId: string) =>
    request<{ success: boolean }>(`/api/team/members/${memberId}`, {
      method: "DELETE",
    }),

  resendInvitation: (invitationId: string) =>
    request<{ success: boolean }>(`/api/team/invitations/${invitationId}/resend`, {
      method: "POST",
    }),

  cancelInvitation: (invitationId: string) =>
    request<{ success: boolean }>(`/api/team/invitations/${invitationId}`, {
      method: "DELETE",
    }),
};

export interface TeamMember {
  id: string;
  userId: string;
  role: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
  isCurrentUser: boolean;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  inviterName: string;
}

// ── Audit / Activity ────────────────────────────────────────────
export interface AuditLog {
  id: string;
  userId?: string;
  userName: string;
  userEmail: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export const auditApi = {
  log: (data: {
    action: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }) =>
    request<{ success: boolean }>("/api/audit/log", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getLogs: (params?: {
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) =>
    request<{
      logs: AuditLog[];
      total: number;
      limit: number;
      offset: number;
    }>(
      `/api/audit/logs${params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : ""}`,
    ),
};

// ── Suggestions / AI ────────────────────────────────────────────
export interface ContentSuggestion {
  title: string;
  caption: string;
  hashtags: string[];
  tip: string;
}

export const suggestionApi = {
  getContent: () =>
    request<{
      recentPosts: { caption?: string; postType?: string; status?: string; daysAgo: number }[];
      accounts: { platform: string; username?: string }[];
      competitors: { platform: string; handle?: string; name?: string }[];
    }>("/api/suggestions/content"),

  generateContent: (data: {
    topic: string;
    platform?: string;
    tone: "casual" | "professional" | "humorous" | "inspirational";
    goal: "engagement" | "followers" | "sales" | "awareness";
  }) =>
    request<{
      suggestions: ContentSuggestion[];
      source: "ai" | "fallback";
    }>("/api/suggestions/content", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getCap: () =>
    request<{
      dailyCap: number;
      used: number;
      remaining: number;
    }>("/api/suggestions/cap"),
};

// ── Billing ─────────────────────────────────────────────────���───
export interface BillingInfo {
  tier: string;
  subscriptionStatus?: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd?: string;
  trialDays: number;
}

export interface UsageData {
  socialAccounts: number;
  teamMembers: number;
  scheduledPostsPerMonth: number;
  aiGenerationsPerMonth: number;
}

export const billingApi = {
  getInfo: () => request<BillingInfo>("/api/billing/info"),

  getUsage: () => request<UsageData>("/api/billing/usage"),

  getPlans: () =>
    request<{ plans: { id: string; name: string; price: number | null; description: string }[] }>(
      "/api/billing/plans",
    ),

  checkout: (data: { planId: string }) =>
    request<{ success: boolean; paymentId: string; checkoutUrl: string }>("/api/billing/checkout", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
// ── Notifications ──────────────────────────────────────────────
export interface Notification {
  id: string;
  userId: string;
  organizationId?: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export const notificationApi = {
  list: () => request<{ notifications: Notification[] }>("/api/notifications"),

  unreadCount: () => request<{ count: number }>("/api/notifications/unread-count"),

  markRead: (id: string) =>
    request<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: "PATCH",
      body: JSON.stringify({ isRead: true }),
    }),

  markAllRead: () =>
    request<{ success: boolean }>("/api/notifications/read-all", {
      method: "PATCH",
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/api/notifications/${id}`, {
      method: "DELETE",
    }),
};

// ── Content Pillars ───────────────────────────────────────────
export interface ContentPillar {
  id: string;
  name: string;
  description?: string;
  color: string;
  postCount: number;
  isActive: boolean;
  createdAt: string;
}

export const pillarsApi = {
  list: () => request<{ pillars: ContentPillar[] }>("/api/pillars"),

  create: (data: { name: string; description?: string; color?: string }) =>
    request<{ pillar: ContentPillar }>("/api/pillars", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    id: string,
    data: Partial<Pick<ContentPillar, "name" | "description" | "color" | "isActive">>,
  ) =>
    request<{ pillar: ContentPillar }>(`/api/pillars/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/api/pillars/${id}`, {
      method: "DELETE",
    }),
};

// ── Hashtag Collections ───────────────────────────────────────
export interface HashtagCollection {
  id: string;
  name: string;
  hashtags: string;
  category?: string;
  usageCount: number;
  createdAt: string;
}

export const hashtagsApi = {
  list: (params?: { category?: string }) =>
    request<{ collections: HashtagCollection[] }>(
      `/api/hashtags${params?.category ? `?category=${params.category}` : ""}`,
    ),

  create: (data: { name: string; hashtags: string; category?: string }) =>
    request<{ collection: HashtagCollection }>("/api/hashtags", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Pick<HashtagCollection, "name" | "hashtags" | "category">>) =>
    request<{ collection: HashtagCollection }>(`/api/hashtags/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/api/hashtags/${id}`, {
      method: "DELETE",
    }),
};

// ── Competitors ───────────────────────────────────────────────
export interface Competitor {
  id: string;
  name: string;
  platform: string;
  platformHandle: string;
  isActive: boolean;
  createdAt: string;
}

export const competitorsApi = {
  list: () => request<{ competitors: Competitor[] }>("/api/competitors"),

  create: (data: { name: string; platform: string; platformHandle: string }) =>
    request<{ competitor: Competitor }>("/api/competitors", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    id: string,
    data: Partial<Pick<Competitor, "name" | "platform" | "platformHandle" | "isActive">>,
  ) =>
    request<{ competitor: Competitor }>(`/api/competitors/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/api/competitors/${id}`, {
      method: "DELETE",
    }),
};

// ── Engagement ───────────────────────────────────────────────
export interface EngagementItem {
  id: string;
  type: "comment" | "mention" | "dm" | "review";
  platform: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
  content: string;
  sentiment?: "positive" | "neutral" | "negative";
  isRead: boolean;
  isReplied: boolean;
  postId?: string;
  postCaption?: string;
  createdAt: string;
}

export interface EngagementStats {
  unreadCount: number;
  unreadByType: Record<string, number>;
  total: number;
}

export const engagementApi = {
  list: (params?: { type?: string; platform?: string; unread?: string }) =>
    request<{
      items: EngagementItem[];
      unreadCount: number;
      unreadByType: Record<string, number>;
      total: number;
    }>(
      `/api/engagement${params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : ""}`,
    ),

  get: (id: string) => request<{ item: EngagementItem }>(`/api/engagement/${id}`),

  markRead: (id: string) =>
    request<{ success: boolean }>(`/api/engagement/${id}/read`, {
      method: "PATCH",
    }),

  markAllRead: () =>
    request<{ success: boolean }>("/api/engagement/read-all", {
      method: "PATCH",
    }),

  reply: (id: string, content: string) =>
    request<{ success: boolean }>(`/api/engagement/${id}/reply`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/api/engagement/${id}`, {
      method: "DELETE",
    }),

  sync: () =>
    request<{ success: boolean; synced: number }>("/api/engagement/sync", {
      method: "POST",
    }),
};

// ── AI Caption ───────────────────────────────────────────────
export interface AiCaptionRequest {
  topic: string;
  platform?: string;
  tone?: string;
  style?: string;
  includeEmojis?: boolean;
  includeHashtags?: boolean;
}

export const aiCaptionApi = {
  generate: (data: AiCaptionRequest) =>
    request<{ caption: string; source: string }>("/api/ai/generate-caption", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  improve: (caption: string, instruction: string) =>
    request<{ caption: string; source: string }>("/api/ai/improve-caption", {
      method: "POST",
      body: JSON.stringify({ caption, instruction }),
    }),
};

// ── AI Assist ────────────────────────────────────────────────
export const aiAssistApi = {
  generateReply: (
    comment: string,
    options?: { platform?: string; tone?: string; context?: string },
  ) =>
    request<{ reply: string; source: string }>("/api/ai/generate-reply", {
      method: "POST",
      body: JSON.stringify({ comment, ...options }),
    }),

  generateAltText: (imageUrl: string, context?: string) =>
    request<{ altText: string; source: string }>("/api/ai/generate-alt-text", {
      method: "POST",
      body: JSON.stringify({ imageUrl, context }),
    }),

  generateTags: (topic: string, options?: { platform?: string; count?: number }) =>
    request<{ tags: string[]; source: string }>("/api/ai/generate-tags", {
      method: "POST",
      body: JSON.stringify({ topic, ...options }),
    }),

  predictScore: (caption: string, options?: { postType?: string; platform?: string }) =>
    request<{ score: number; suggestions: string[]; source: string }>("/api/ai/predict-score", {
      method: "POST",
      body: JSON.stringify({ caption, ...options }),
    }),

  rewriteCaption: (caption: string, instruction: string) =>
    request<{ caption: string; source: string }>("/api/ai/rewrite-caption", {
      method: "POST",
      body: JSON.stringify({ caption, instruction }),
    }),
};

// ── SK Coach ─────────────────────────────────────────────────
export interface SKReport {
  id: string;
  title: string;
  summary: string;
  overallScore: number | null;
  confidence: number;
  trigger: string;
  status: string;
  createdAt: string;
  recommendations?: SKRecommendation[];
  experiments?: SKExperiment[];
}

export interface SKRecommendation {
  id: string;
  title: string;
  advice: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  platform?: string | null;
  confidence: number;
  status: string;
  rationale?: string;
}

export interface SKExperiment {
  id: string;
  title: string;
  hypothesis: string;
  platform?: string | null;
  metric: string;
  status: string;
}

export interface SKChatSession {
  id: string;
  title: string;
  updatedAt: string;
  messages?: SKChatMessage[];
}

export interface SKChatMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

export interface SKBrandKnowledge {
  websiteUrl?: string;
  audience?: string;
  positioning?: string;
  products?: string;
  offers?: string;
  voiceRules?: string;
  bannedTopics?: string;
}

export const skApi = {
  getReports: () => request<{ latest: SKReport | null; history: SKReport[] }>("/api/sk/reports"),

  generateReport: (data: { trigger?: "PROACTIVE" | "MANUAL" | "CHAT"; reportId?: string }) =>
    request<{ success: boolean; report: SKReport }>("/api/sk/report/generate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getChatSessions: () => request<{ sessions: SKChatSession[] }>("/api/sk/chat/sessions"),

  chat: (data: { sessionId?: string; message: string }) =>
    request<{ session: { id: string }; message: SKChatMessage }>("/api/sk/chat", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getChatSession: (sessionId: string) =>
    request<{ session: SKChatSession; messages: SKChatMessage[] }>(
      `/api/sk/chat/sessions/${sessionId}`,
    ),

  deleteChatSession: (sessionId: string) =>
    request<{ success: boolean }>(`/api/sk/chat/sessions/${sessionId}`, {
      method: "DELETE",
    }),

  getBrandKnowledge: () => request<SKBrandKnowledge>("/api/sk/brand-knowledge"),

  updateBrandKnowledge: (data: Partial<SKBrandKnowledge>) =>
    request<{ success: boolean; knowledge: SKBrandKnowledge }>("/api/sk/brand-knowledge", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getUsageLimits: () =>
    request<{ maxReportsPerDay: number; maxChatsPerDay: number }>("/api/sk/usage-limits"),
};

// ── Platform Analytics ─────────────────────────────────────────
export interface PlatformAnalytics {
  followers: number;
  followersChange: number;
  following: number;
  impressions: number;
  reach: number;
  engagementRate: number;
  profileViews: number;
  websiteClicks: number;
  emailClicks: number;
  platformMetrics?: Record<string, unknown>;
}

export interface PlatformAccount {
  id: string;
  platform: string;
  name: string;
  username: string;
  isActive: boolean;
  tokenExpiresAt?: string;
  createdAt: string;
  followers?: number;
  engagementRate?: number;
}

export interface CrossPlatformStats {
  totalFollowers: number;
  totalImpressions: number;
  totalReach: number;
  avgEngagementRate: number;
  byPlatform: Array<{
    platform: string;
    followers: number;
    impressions: number;
    engagementRate: number;
  }>;
}

export const platformApi = {
  getAccounts: () => request<{ accounts: PlatformAccount[] }>("/api/platforms/accounts"),

  getAuthUrl: (platform: string, state: string) =>
    request<{ authUrl: string }>(
      `/api/platforms/${platform}/auth-url?state=${encodeURIComponent(state)}`,
    ),

  getAnalytics: (platform: string, days = 30) =>
    request<{ analytics: PlatformAnalytics }>(`/api/platforms/${platform}/analytics?days=${days}`),

  getCrossPlatformStats: () =>
    request<{ stats: CrossPlatformStats }>("/api/platforms/cross-platform"),
};

// ── Admin ─────────────────────────────────────────────────────────
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerified: boolean;
  role?: string | null;
  banned: boolean;
  banReason?: string | null;
  banExpires?: string | null;
  createdAt: string;
}

export interface AdminOrganization {
  id: string;
  name: string;
  slug: string;
  tier: string;
  maxMembers: number;
  memberCount?: number;
  postCount?: number;
  socialAccountCount?: number;
  createdAt: string;
}

export interface AdminSettings {
  registrationEnabled: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  maxOrganizationsPerUser: number;
  maxMembersPerOrganization: number;
  rateLimitRequestsPerMinute: number;
}

export interface AdminCredential {
  id: string;
  platform: string;
  clientId: string;
  clientSecret?: string;
  webhookVerifyToken?: string | null;
  isConfigured: boolean;
  updatedAt: string;
}

export const adminApi = {
  // Stats
  getStats: () => request<{ stats: Record<string, unknown> }>("/api/admin/stats"),

  // Users
  getUsers: (params?: { page?: number; search?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.search) query.set("search", params.search);
    if (params?.limit) query.set("limit", String(params.limit));
    return request<{
      users: AdminUser[];
      pagination: { page: number; limit: number; total: number };
    }>(`/api/admin/users${query.toString() ? `?${query.toString()}` : ""}`);
  },

  getUser: (userId: string) => request<{ user: AdminUser }>(`/api/admin/users/${userId}`),

  // User ban/unban
  banUser: (userId: string, data: { reason: string; expiresAt?: string }) =>
    request<{ success: boolean }>(`/api/admin/users/${userId}/ban`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  unbanUser: (userId: string) =>
    request<{ success: boolean }>(`/api/admin/users/${userId}/unban`, {
      method: "POST",
    }),

  // Organizations
  getOrganizations: (params?: { page?: number; search?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.search) query.set("search", params.search);
    if (params?.limit) query.set("limit", String(params.limit));
    return request<{
      organizations: AdminOrganization[];
      pagination: { page: number; limit: number; total: number };
    }>(`/api/admin/organizations${query.toString() ? `?${query.toString()}` : ""}`);
  },

  // Platform Credentials
  getPlatformCredentials: () =>
    request<{ credentials: AdminCredential[] }>("/api/admin/platform-credentials"),

  updatePlatformCredential: (data: Partial<AdminCredential> & { platform: string }) =>
    request<{ credential: AdminCredential }>("/api/admin/platform-credentials", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deletePlatformCredential: (platform: string) =>
    request<{ success: boolean }>(`/api/admin/platform-credentials/${platform}`, {
      method: "DELETE",
    }),

  // Settings
  getSettings: () => request<{ settings: AdminSettings }>("/api/admin/settings"),

  updateSettings: (data: Partial<AdminSettings>) =>
    request<{ success: boolean }>("/api/admin/settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Impersonate
  impersonate: (userId: string) =>
    request<{
      success: boolean;
      impersonation: {
        token: string;
        user: { id: string; name: string; email: string };
        expiresAt: string;
      };
    }>("/api/admin/impersonate", { method: "POST", body: JSON.stringify({ userId }) }),

  endImpersonation: () =>
    request<{ success: boolean }>("/api/admin/impersonate", { method: "DELETE" }),

  getImpersonationStatus: () =>
    request<{
      impersonating: boolean;
      session?: { user: { id: string; name: string; email: string }; expiresAt: string };
    }>("/api/admin/impersonate/status"),
};

// ── Analytics ────────────────────────────────────────────────
export const analyticsApi = {
  overview: (range?: string) =>
    request<{ overview: any; range: string }>(
      `/api/analytics/overview${range ? `?range=${range}` : ""}`,
    ),

  posts: (params?: { limit?: number; offset?: number }) =>
    request<{ posts: any[]; total: number; limit: number; offset: number }>(
      `/api/analytics/posts${params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : ""}`,
    ),

  platforms: () => request<{ platforms: any[] }>("/api/analytics/platforms"),

  engagement: (range?: string) =>
    request<{ engagement: any; range: string }>(
      `/api/analytics/engagement${range ? `?range=${range}` : ""}`,
    ),

  optimalTimes: () => request<{ optimalTimes: any }>("/api/analytics/optimal-times"),

  sync: () =>
    request<{ success: boolean; message: string; accounts: any[] }>("/api/analytics/sync", {
      method: "POST",
    }),
};

// ── Push Notifications ─────────────────────────────────────────────
export interface PushSubscriptionEntry {
  id: string;
  endpoint: string;
  createdAt: string;
}

export const pushApi = {
  listSubscriptions: () =>
    request<{ subscriptions: PushSubscriptionEntry[] }>("/api/push/subscriptions"),

  subscribe: (data: { endpoint: string; p256dh: string; auth: string }) =>
    request<{ subscription: { id: string } }>("/api/push/subscribe", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  unsubscribe: (subscriptionId: string) =>
    request<{ success: boolean }>(`/api/push/subscriptions/${subscriptionId}`, {
      method: "DELETE",
    }),

  sendTest: (data: { title: string; body: string; data?: Record<string, string> }) =>
    request<{ success: boolean; message: string }>("/api/push/send-test", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
