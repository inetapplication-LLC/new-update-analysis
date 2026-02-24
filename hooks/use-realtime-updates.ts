"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface RealtimeUpdate {
  id: number;
  update_id: number | null;
  update_type: string | null;
  update_date: string | null;
  update_content: string | null;
}

interface UseRealtimeUpdatesOptions {
  selectedDay: string | null;
  onNewUpdates: (updates: RealtimeUpdate[]) => void;
  debounceMs?: number;
}

// Singleton Supabase client for Realtime (uses anon key directly, no SSR cookies)
let realtimeClient: ReturnType<typeof createClient> | null = null;

function getRealtimeClient() {
  if (!realtimeClient) {
    realtimeClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return realtimeClient;
}

export function useRealtimeUpdates({
  selectedDay,
  onNewUpdates,
  debounceMs = 2000,
}: UseRealtimeUpdatesOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const bufferRef = useRef<RealtimeUpdate[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenIdsRef = useRef<Set<number>>(new Set());
  const onNewUpdatesRef = useRef(onNewUpdates);

  useEffect(() => {
    onNewUpdatesRef.current = onNewUpdates;
  }, [onNewUpdates]);

  const flush = useCallback(() => {
    if (bufferRef.current.length === 0) return;
    const batch = [...bufferRef.current];
    bufferRef.current = [];
    onNewUpdatesRef.current(batch);
  }, []);

  useEffect(() => {
    const supabase = getRealtimeClient();

    seenIdsRef.current.clear();

    const channelName = `rdn-updates-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "rdn_new_updates",
        },
        (payload) => {
          const row = payload.new as RealtimeUpdate;
          const id = row.id;

          if (id != null && seenIdsRef.current.has(id)) return;
          if (id != null) seenIdsRef.current.add(id);

          if (seenIdsRef.current.size > 5000) {
            const arr = [...seenIdsRef.current];
            seenIdsRef.current = new Set(arr.slice(-2500));
          }

          bufferRef.current.push(row);

          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(flush, debounceMs);
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("[Realtime] Connected to rdn_new_updates channel");
        } else {
          console.log("[Realtime] Channel status:", status, err ?? "");
        }
      });

    channelRef.current = channel;

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (bufferRef.current.length > 0) {
        flush();
      }
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [selectedDay, debounceMs, flush]);
}
