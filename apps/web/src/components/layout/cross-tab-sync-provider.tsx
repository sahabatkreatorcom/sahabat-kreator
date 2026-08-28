"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { useOrganization } from "@/hooks/use-organization";

const CHANNEL_NAME = "sahabatkreator-sync";

type SyncEventType = "post:created" | "post:updated" | "post:deleted" | "settings:updated";

interface SyncEvent {
  type: SyncEventType;
  resourceId?: string;
  organizationId?: string;
  timestamp: number;
  tabId: string;
}

const TAB_ID =
  typeof window !== "undefined"
    ? `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`
    : "server";

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  if (!("BroadcastChannel" in window)) return null;
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return channel;
}

export function broadcastSync(
  type: SyncEventType,
  resourceId?: string,
  organizationId?: string,
): void {
  const event: SyncEvent = {
    type,
    resourceId,
    organizationId,
    timestamp: Date.now(),
    tabId: TAB_ID,
  };

  const ch = getChannel();
  if (ch) {
    try {
      ch.postMessage(event);
    } catch {
      // Ignore broadcast errors
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("sahabatkreator-local-sync", { detail: event }));
  }
}

export function CrossTabSyncProvider() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const channelRef = useRef<BroadcastChannel | null>(null);

  const invalidateForEvent = useCallback(
    (data: SyncEvent) => {
      if (organization?.id && data.organizationId && data.organizationId !== organization.id) {
        return;
      }

      switch (data.type) {
        case "post:created":
        case "post:updated":
        case "post:deleted":
          queryClient.invalidateQueries({ queryKey: ["posts"] });
          queryClient.invalidateQueries({ queryKey: ["calendar"] });
          break;
        case "settings:updated":
          queryClient.invalidateQueries({ queryKey: ["settings"] });
          queryClient.invalidateQueries({ queryKey: ["organization"] });
          break;
      }
    },
    [queryClient, organization?.id],
  );

  const handleMessage = useCallback(
    (event: MessageEvent<SyncEvent>) => {
      if (event.data.tabId === TAB_ID) return;
      invalidateForEvent(event.data);
    },
    [invalidateForEvent],
  );

  const handleLocalSync = useCallback(
    (event: Event) => {
      invalidateForEvent((event as CustomEvent<SyncEvent>).detail);
    },
    [invalidateForEvent],
  );

  useEffect(() => {
    const ch = getChannel();
    if (ch) {
      channelRef.current = ch;
      ch.addEventListener("message", handleMessage);
    }

    window.addEventListener("sahabatkreator-local-sync", handleLocalSync);

    return () => {
      if (ch) ch.removeEventListener("message", handleMessage);
      window.removeEventListener("sahabatkreator-local-sync", handleLocalSync);
    };
  }, [handleMessage, handleLocalSync]);

  return null;
}
