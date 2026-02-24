"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/browser";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface RealtimeUpdate {
  update_id: number;
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

/**
 * Subscribes to Postgres INSERT events on `rdn_new_updates` via Supabase Realtime.
 * - Buffers rapid inserts and flushes after `debounceMs`
 * - Deduplicates by `update_id` to prevent double-processing on reconnect
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
    const supabase = createClient();

    // Clear dedup set on day change
    seenIdsRef.current.clear();

    const channel = supabase
      .channel("rdn-new-updates-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "rdn_new_updates",
        },
        (payload) => {
          const row = payload.new as RealtimeUpdate;
          const id = row.update_id;

          // Dedup
          if (seenIdsRef.current.has(id)) return;
          seenIdsRef.current.add(id);

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
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      // Flush any remaining buffered updates
      if (bufferRef.current.length > 0) {
        flush();
      }
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [selectedDay, debounceMs, flush]);
}
