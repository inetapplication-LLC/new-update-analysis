"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Clock, Car, Hash, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EnrichedUpdate } from "@/lib/queries";
import { getAvatarColor, getInitials, formatClient, formatTime } from "@/lib/utils";

interface UpdateTableProps {
  updates: EnrichedUpdate[];
  sourceColor?: string;
  expandAll?: boolean;
}

function formatVehicle(vehicle: string | null | undefined): string {
  if (!vehicle) return "";
  const parts = vehicle.split(/\s+/);
  if (parts.length >= 3) {
    const year = parts[0];
    const make = parts[1].charAt(0) + parts[1].slice(1).toLowerCase();
    const model = parts[2];
    return `${year} ${make} ${model}`;
  }
  return vehicle.length > 30 ? vehicle.substring(0, 28) + "\u2026" : vehicle;
}

/** Returns "just now", "Xm ago", "Xh ago" for recent updates */
function getFreshness(dateStr: string | null | undefined): { label: string; isRecent: boolean } {
  if (!dateStr) return { label: "", isRecent: false };
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 0 || mins > 480) return { label: "", isRecent: false };
  if (mins < 5) return { label: "just now", isRecent: true };
  if (mins < 60) return { label: `${mins}m ago`, isRecent: true };
  const hrs = Math.floor(mins / 60);
  return { label: `${hrs}h ago`, isRecent: hrs <= 2 };
}

function ContentWithClamp({ content, forceExpand }: { content: string; forceExpand?: boolean }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [clamped, setClamped] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isExpanded = forceExpand || expanded;

  const checkClamp = useCallback(() => {
    const el = ref.current;
    if (el) {
      setClamped(el.scrollHeight > el.clientHeight + 1);
    }
  }, []);

  useEffect(() => {
    checkClamp();
  }, [content, checkClamp]);

  return (
    <>
      <div className={`relative pl-[42px] ${!isExpanded && clamped ? "content-fade-clamp" : ""}`}>
        <p
          ref={ref}
          className={`text-[13.5px] leading-[1.65] text-foreground/80 mb-0 ${!isExpanded ? "text-clamp-3" : ""}`}
        >
          {content}
        </p>
      </div>
      {(clamped || isExpanded) && !forceExpand && (
        <button
          className="show-more-btn"
          onClick={() => setExpanded((v) => !v)}
        >
          <span>{isExpanded ? "Show less" : "Show more"}</span>
          <ChevronDown
            size={12}
            className="show-more-chevron"
            style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </button>
      )}
    </>
  );
}

export function UpdateTable({ updates, sourceColor, expandAll }: UpdateTableProps) {
  if (updates.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">No updates in this category.</p>
      </div>
    );
  }

  // Pre-compute client grouping: detect consecutive same-client runs
  const clientGroups = updates.map((u, i) => {
    const client = formatClient(u.client);
    const prevClient = i > 0 ? formatClient(updates[i - 1].client) : null;
    const nextClient = i < updates.length - 1 ? formatClient(updates[i + 1].client) : null;
    const isContinuation = client === prevClient;
    const hasMore = client === nextClient;
    return { isContinuation, hasMore };
  });

  return (
    <div className="update-card-list">
      {updates.map((u, i) => {
        const time = formatTime(u.update_date);
        const vehicle = formatVehicle(u.vehicle);
        const client = formatClient(u.client);
        const content = u.update_content || "\u2014";
        const avatarColor = getAvatarColor(client);
        const initials = getInitials(client);
        const freshness = getFreshness(u.update_date);
        const { isContinuation } = clientGroups[i];

        return (
          <div
            key={u.update_id || i}
            className={`group update-card animate-row ${freshness.isRecent ? "update-card-fresh" : ""} ${isContinuation ? "update-card-continuation" : ""}`}
            style={{
              animationDelay: `${Math.min(i, 15) * 30}ms`,
              "--card-accent": sourceColor || avatarColor.bg,
            } as React.CSSProperties}
          >
            {/* Row 1: Avatar + Client name + timestamp + freshness */}
            {isContinuation ? (
              <div className="flex items-center justify-between mb-2 pl-[42px]">
                <span className="text-[10.5px] text-muted-foreground/50 font-mono">
                  — same client
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {time && (
                    <div className="flex items-center gap-1.5">
                      <Clock size={11} className="text-muted-foreground/50" />
                      <span
                        className="text-[11px] text-muted-foreground/60 tabular-nums"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {time}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between mb-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="avatar-initials shrink-0"
                    style={{
                      backgroundColor: avatarColor.bg,
                      color: avatarColor.fg,
                      boxShadow: freshness.isRecent
                        ? `0 0 0 2px ${sourceColor || avatarColor.bg}40`
                        : undefined,
                    }}
                  >
                    {initials}
                  </span>
                  <span className="text-[13px] font-semibold text-foreground truncate">
                    {client}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {freshness.label && (
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md ${
                        freshness.isRecent
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 ring-1 ring-emerald-200/50 dark:ring-emerald-800/30"
                          : "text-muted-foreground/50 bg-muted/30"
                      }`}
                    >
                      {freshness.label}
                    </span>
                  )}
                  {time && (
                    <div className="flex items-center gap-1.5">
                      <Clock size={11} className="text-muted-foreground/50" />
                      <span
                        className="text-[11px] text-muted-foreground/60 tabular-nums"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {time}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Row 2: Update content with 3-line clamp */}
            <ContentWithClamp content={content} forceExpand={expandAll} />

            {/* Row 3: Metadata badges */}
            <div className="flex items-center gap-2 pl-[42px] mt-3">
              <Badge
                variant="outline"
                className="text-[10.5px] font-mono tabular-nums gap-1.5 py-0.5 px-2 text-muted-foreground/80 border-border/50 bg-muted/30 rounded-md"
              >
                <Hash size={10} className="opacity-40" />
                {u.case_id}
              </Badge>
              {vehicle && (
                <Badge
                  variant="outline"
                  className="text-[10.5px] font-mono gap-1.5 py-0.5 px-2 text-muted-foreground/80 border-border/50 bg-muted/30 rounded-md"
                >
                  <Car size={10} className="opacity-40" />
                  {vehicle}
                </Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
