"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

export interface RealtimeUpdate {
  id: number;
  update_id: number | null;
  update_type: string | null;
  update_date: string | null;
  update_content: string | null;
}

interface UseRealtimeUpdatesOptions {
  /** Currently selected day (ISO date string, e.g. "2026-02-24") */
  selectedDay: string | null;
  /** Called with buffered new updates after debounce window */
  onNewUpdates: (updates: RealtimeUpdate[]) => void;
  /** Debounce window in ms (default 2000) */
  debounceMs?: number;
}

// Singleton Supabase client for Realtime (avoids multiple WebSocket connections)
let realtimeClient: SupabaseClient | null = null;
function getRealtimeClient(): SupabaseClient {
  if (!realtimeClient) {
    realtimeClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return realtimeClient;
}

/**
 * Subscribes to Postgres INSERT events on `rdn_new_updates` via Supabase Realtime.
 * - Buffers rapid inserts and flushes after `debounceMs`
 * - Deduplicates by `id` (PK) to prevent double-processing on reconnect
 * - Cleans up channel on unmount or when `selectedDay` changes
 */
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

  // Keep callback ref fresh without triggering re-subscribe
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

    // Clear dedup set on day change
    seenIdsRef.current.clear();

    // Use unique channel name to avoid conflicts on re-mount
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

          // Dedup
          if (id != null && seenIdsRef.current.has(id)) return;
          if (id != null) seenIdsRef.current.add(id);

          // Prune seen set if it grows too large
          if (seenIdsRef.current.size > 5000) {
            const arr = [...seenIdsRef.current];
            seenIdsRef.current = new Set(arr.slice(-2500));
          }

          bufferRef.current.push(row);

          // Reset debounce timer
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(flush, debounceMs);
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("[Realtime] Connected to rdn_new_updates channel");
        } else {
          console.log("[Realtime] Channel status:", status, err ? "Error: " + JSON.stringify(err) : "");
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
