/**
 * Notification Center Component
 * Real-time notifications with grouping and actions
 */

"use client";

import {
  AlertTriangle,
  Bell,
  CheckCircle,
  MessageCircle,
  Settings,
  TrendingUp,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  isRead: boolean;
  link?: string;
  actionLabel?: string;
  actionHref?: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="safe-area-top relative w-full max-w-md bg-[var(--bg-secondary)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-[var(--border)] border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-lg">Notifikasi</h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-[var(--accent-gold)] px-2 py-0.5 font-medium text-white text-xs">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[var(--accent-gold)] text-sm hover:underline"
              >
                Tandai semua dibaca
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-[calc(100vh-140px)] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
              <p className="mt-3 font-medium">Semua sudah dibaca!</p>
              <p className="text-[var(--text-muted)] text-sm">Tidak ada notifikasi baru</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={() => markAsRead(notification.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="absolute right-0 bottom-0 left-0 border-[var(--border)] border-t bg-[var(--bg-secondary)] p-4 pb-[max(env(safe-area-inset-bottom,16px),calc(72px+16px))] md:pb-4">
          <a
            href="/settings?tab=notifications"
            className="flex items-center justify-center gap-2 text-[var(--text-muted)] text-sm hover:text-[var(--text-primary)]"
          >
            <Settings className="h-4 w-4" />
            Pengaturan Notifikasi
          </a>
        </div>
      </div>
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onRead: () => void;
}

function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const typeMap = {
    success: { icon: CheckCircle, colors: "text-[var(--success)] bg-[var(--success-light)]" },
    warning: { icon: AlertTriangle, colors: "text-[var(--warning)] bg-[var(--warning-light)]" },
    info: { icon: TrendingUp, colors: "text-[var(--accent-gold)] bg-[var(--accent-gold-light)]" },
    action: { icon: MessageCircle, colors: "text-[var(--info)] bg-[var(--info-light)]" },
    alert: { icon: AlertTriangle, colors: "text-red-500 bg-red-500/10" },
  };

  const displayType = typeMap[notification.type as keyof typeof typeMap] || typeMap.info;
  const Icon = displayType.icon;

  return (
    <div
      className={cn(
        "group relative px-6 py-4 transition-colors",
        !notification.isRead && "bg-[var(--accent-gold-light)]/30",
        notification.link && "cursor-pointer hover:bg-[var(--bg-tertiary)]",
      )}
      onClick={() => {
        onRead();
        if (notification.link) {
          window.location.href = notification.link;
        }
      }}
    >
      {!notification.isRead && (
        <div className="absolute top-1/2 left-2 h-2 w-2 -translate-y-1/2 rounded-full bg-[var(--accent-gold)]" />
      )}

      <div className="flex gap-3">
        <div
          className={cn(
            "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
            displayType.colors,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium">{notification.title}</p>
          </div>
          <p className="mt-1 text-[var(--text-secondary)] text-sm">{notification.message}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[var(--text-muted)] text-xs">baru saja</span>
            {notification.actionLabel && notification.actionHref && (
              <a
                href={notification.actionHref}
                className="font-medium text-[var(--accent-gold)] text-sm hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {notification.actionLabel}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Notification Bell Button
 */
interface NotificationBellProps {
  onClick: () => void;
  count?: number;
}

export function NotificationBell({ onClick, count = 0 }: NotificationBellProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
      title="Notifikasi"
      aria-label={count > 0 ? `Notifikasi, ${count} belum dibaca` : "Notifikasi"}
    >
      <Bell className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent-gold)] font-medium text-[10px] text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
