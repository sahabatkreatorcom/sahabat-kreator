"use client";

import {
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Trash2,
  RefreshCw,
  Send,
  Sparkles,
  AlertCircle,
  Loader2,
  MessageSquare,
  Lightbulb,
  Target,
  Trophy,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { skApi, type SKChatMessage, type SKChatSession, type SKReport, type SKRecommendation } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const PRIORITY_COLORS = {
  HIGH: "bg-red-500/10 text-red-500 border-red-500/20",
  MEDIUM: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  LOW: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

const CATEGORY_COLORS = {
  CONTENT_STRATEGY: "bg-purple-500/10 text-purple-500",
  CAPTION: "bg-pink-500/10 text-pink-500",
  CREATIVE: "bg-orange-500/10 text-orange-500",
  VIDEO: "bg-red-500/10 text-red-500",
  TIMING: "bg-cyan-500/10 text-cyan-500",
  HASHTAG: "bg-green-500/10 text-green-500",
  PLATFORM: "bg-blue-500/10 text-blue-500",
  COMPETITOR: "bg-yellow-500/10 text-yellow-500",
  BRAND: "bg-indigo-500/10 text-indigo-500",
};

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const color =
    score >= 80 ? "text-green-500" : score >= 60 ? "text-amber-500" : "text-red-500";
  return (
    <div className={cn("flex items-center gap-2 rounded-lg bg-[var(--bg-tertiary)] px-3 py-2", color)}>
      <Trophy className="h-4 w-4" />
      <span className="font-semibold text-sm">Skor: {score}/100</span>
    </div>
  );
}

function RecommendationCard({ rec }: { rec: SKRecommendation }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card space-y-3 p-4">
      <div className="flex items-start gap-3">
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", PRIORITY_COLORS[rec.priority])}>
          {rec.priority === "HIGH" ? <AlertCircle className="h-4 w-4" /> : rec.priority === "MEDIUM" ? <Target className="h-4 w-4" /> : <Check className="h-4 w-4" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-sm">{rec.title}</h4>
            <span className={cn("rounded px-2 py-0.5 text-xs font-medium", CATEGORY_COLORS[rec.category as keyof typeof CATEGORY_COLORS] || "bg-gray-500/10 text-gray-500")}>
              {rec.category.replace("_", " ")}
            </span>
            {rec.platform && (
              <span className="rounded px-2 py-0.5 text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                {rec.platform}
              </span>
            )}
          </div>
          <p className="mt-1 text-[var(--text-secondary)] text-xs">
            Confidence: {Math.round(rec.confidence * 100)}%
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="space-y-2 pl-11">
          <p className="text-sm text-[var(--text-secondary)]">{rec.advice}</p>
          {rec.rationale && (
            <p className="text-xs text-[var(--text-muted)] italic">{rec.rationale}</p>
          )}
        </div>
      )}
    </div>
  );
}

function ReportCard({ report, onGenerate }: { report: SKReport; onGenerate: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card space-y-3 p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="font-semibold">{report.title}</h3>
          <p className="text-[var(--text-secondary)] text-xs line-clamp-2">{report.summary}</p>
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs">
            <span>{new Date(report.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
            <span>·</span>
            <span>{report.trigger}</span>
          </div>
        </div>
        <ScoreBadge score={report.overallScore} />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-[var(--accent-gold)] hover:underline"
        >
          {expanded ? "Sembunyikan" : "Lihat detail"}
        </button>
        <button
          type="button"
          onClick={onGenerate}
          className="ml-auto flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <RefreshCw className="h-3 w-3" /> Generate Ulang
        </button>
      </div>

      {expanded && report.recommendations && report.recommendations.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[var(--border)]">
          {report.recommendations.slice(0, 5).map((rec) => (
            <RecommendationCard key={rec.id} rec={rec as SKRecommendation} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChatMessage({ message }: { message: SKChatMessage }) {
  const isUser = message.role === "USER";
  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "")}>
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
        isUser ? "bg-[var(--accent-gold)]" : "bg-[var(--bg-tertiary)]"
      )}>
        {isUser ? (
          <span className="text-xs font-semibold text-white">Anda</span>
        ) : (
          <Bot className="h-4 w-4 text-[var(--accent-gold)]" />
        )}
      </div>
      <div className={cn(
        "max-w-[80%] rounded-xl px-4 py-3 text-sm",
        isUser
          ? "bg-[var(--accent-gold)] text-white"
          : "bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
      )}>
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p className={cn("mt-1 text-xs", isUser ? "text-white/70" : "text-[var(--text-muted)]")}>
          {new Date(message.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

export default function SKPage() {
  const [activeTab, setActiveTab] = useState<"chat" | "reports">("chat");
  const [reports, setReports] = useState<{ latest: SKReport | null; history: SKReport[] }>({ latest: null, history: [] });
  const [sessions, setSessions] = useState<SKChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<SKChatSession | null>(null);
  const [messages, setMessages] = useState<SKChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadReports();
    loadSessions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadReports() {
    const res = await skApi.getReports();
    if (res.ok) setReports(res.data);
  }

  async function loadSessions() {
    const res = await skApi.getChatSessions();
    if (res.ok) setSessions(res.data.sessions);
  }

  async function handleGenerate() {
    setIsGenerating(true);
    const res = await skApi.generateReport({ trigger: "MANUAL" });
    setIsGenerating(false);
    if (res.ok) {
      toast.success("Laporan SK berhasil dibuat!");
      loadReports();
    } else {
      toast.error(res.error);
    }
  }

  async function selectSession(session: SKChatSession) {
    setCurrentSession(session);
    const res = await skApi.getChatSession(session.id);
    if (res.ok) {
      setMessages(res.data.messages);
    }
  }

  async function handleNewChat() {
    setCurrentSession(null);
    setMessages([]);
  }

  async function handleSend() {
    if (!inputMessage.trim() || isChatting) return;

    const userMessage: SKChatMessage = {
      id: `temp-${Date.now()}`,
      role: "USER",
      content: inputMessage,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const message = inputMessage;
    setInputMessage("");
    setIsChatting(true);

    const res = await skApi.chat({
      sessionId: currentSession?.id,
      message,
    });

    setIsChatting(false);

    if (res.ok) {
      setMessages((prev) => [...prev, res.data.message]);
      if (!currentSession) {
        setCurrentSession(res.data.session as unknown as SKChatSession);
        loadSessions();
      }
    } else {
      toast.error(res.error);
      setMessages((prev) => prev.slice(0, -1));
    }
  }

  async function handleDeleteSession(sessionId: string) {
    const res = await skApi.deleteChatSession(sessionId);
    if (res.ok) {
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }
      loadSessions();
      toast.success("Chat dihapus");
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-gold)]/10">
            <Bot className="h-5 w-5 text-[var(--accent-gold)]" />
          </div>
          <div>
            <h1 className="font-semibold text-xl">SK Coach</h1>
            <p className="text-[var(--text-secondary)] text-xs">Pelatih media sosial AI untuk organisasi Anda</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-lg bg-[var(--accent-gold)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate Laporan
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)]">
        <button
          type="button"
          onClick={() => setActiveTab("chat")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === "chat"
              ? "border-[var(--accent-gold)] text-[var(--accent-gold)]"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          )}
        >
          <MessageSquare className="h-4 w-4" />
          Chat
          {sessions.length > 0 && (
            <span className="ml-1 rounded-full bg-[var(--accent-gold)]/10 px-1.5 py-0.5 text-xs">
              {sessions.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === "reports"
              ? "border-[var(--accent-gold)] text-[var(--accent-gold)]"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          )}
        >
          <Lightbulb className="h-4 w-4" />
          Laporan
          {reports.history.length > 0 && (
            <span className="ml-1 rounded-full bg-[var(--accent-gold)]/10 px-1.5 py-0.5 text-xs">
              {reports.history.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "chat" && (
          <div className="flex h-full">
            {/* Sessions List */}
            <div className="w-64 border-r border-[var(--border)] overflow-y-auto p-3">
              <button
                type="button"
                onClick={handleNewChat}
                className="mb-3 flex w-full items-center gap-2 rounded-lg border border-dashed border-[var(--border)] px-3 py-2 text-sm text-[var(--text-muted)] hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)]"
              >
                <MessageSquare className="h-4 w-4" />
                Chat Baru
              </button>

              <div className="space-y-1">
                {sessions.map((session) => (
                  <div key={session.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => selectSession(session)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        currentSession?.id === session.id
                          ? "bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                      )}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{session.title}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id);
                      }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex flex-1 flex-col">
              {messages.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-gold)]/10">
                      <Bot className="h-8 w-8 text-[var(--accent-gold)]" />
                    </div>
                    <h3 className="font-semibold text-lg">Mulai Chat dengan SK</h3>
                    <p className="mt-1 text-[var(--text-secondary)] text-sm">
                      Tanyakan apa saja tentang strategi media sosial Anda
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                  ))}
                  {isChatting && (
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-tertiary)]">
                        <Bot className="h-4 w-4 text-[var(--accent-gold)]" />
                      </div>
                      <div className="flex items-center gap-2 rounded-xl bg-[var(--bg-tertiary)] px-4 py-3">
                        <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-gold)]" />
                        <span className="text-sm text-[var(--text-muted)]">SK sedang berpikir...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}

              <div className="border-t border-[var(--border)] p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder="Ketik pesan Anda..."
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-gold)]/50"
                    disabled={isChatting}
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputMessage.trim() || isChatting}
                    className="flex items-center gap-2 rounded-lg bg-[var(--accent-gold)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    Kirim
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="p-4 space-y-4 overflow-y-auto h-full">
            {reports.latest && (
              <ReportCard report={reports.latest} onGenerate={handleGenerate} />
            )}

            {reports.history.length > 0 && (
              <div>
                <h2 className="mb-3 font-semibold text-sm text-[var(--text-muted)]">Riwayat Laporan</h2>
                <div className="space-y-3">
                  {reports.history.slice(1).map((report) => (
                    <ReportCard key={report.id} report={report} onGenerate={handleGenerate} />
                  ))}
                </div>
              </div>
            )}

            {reports.history.length === 0 && (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-gold)]/10">
                  <Lightbulb className="h-8 w-8 text-[var(--accent-gold)]" />
                </div>
                <h3 className="font-semibold text-lg">Belum Ada Laporan</h3>
                <p className="mt-1 text-[var(--text-secondary)] text-sm">
                  Klik "Generate Laporan" untuk membuat laporan pertama
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
