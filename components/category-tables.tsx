"use client";

import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { Clock, ChevronsDownUp, ChevronsUpDown, ShieldAlert } from "lucide-react";
import { UpdateTable } from "./update-table";
import { Badge } from "@/components/ui/badge";
import type { EnrichedUpdate, CategoryCount } from "@/lib/queries";
import { getUpdatesForSourceCategory } from "@/lib/queries";
import { getSourceColor } from "@/lib/constants";
import { formatCategoryName } from "@/lib/utils";

interface CategoryTablesProps {
  updates: EnrichedUpdate[];
  source: string;
  categories: CategoryCount[];
  scrollToCategory: string | null;
  onVisibleCategory?: (category: string) => void;
}

/** Get a human-readable "last updated X ago" string from the most recent update in a list */
function getLastUpdatedLabel(updates: EnrichedUpdate[]): string {
  if (updates.length === 0) return "";
  const latest = updates.reduce((a, b) => {
    const ta = new Date(a.update_date || 0).getTime();
    const tb = new Date(b.update_date || 0).getTime();
    return ta > tb ? a : b;
  });
  if (!latest.update_date) return "";
  const diff = Date.now() - new Date(latest.update_date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 0) return "";
  if (mins < 1) return "Updated just now";
  if (mins < 60) return `Last update ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Last update ${hrs}h ago`;
  return `Last update ${Math.floor(hrs / 24)}d ago`;
}

export function CategoryTables({
  updates,
  source,
  categories,
  scrollToCategory,
  onVisibleCategory,
}: CategoryTablesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const headerRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    if (scrollToCategory) {
      const el = sectionRefs.current.get(scrollToCategory);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [scrollToCategory]);

  // Scroll-spy: observe which category section is in viewport
  useEffect(() => {
    if (!onVisibleCategory || categories.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const cat = entry.target.getAttribute("data-category");
            if (cat) onVisibleCategory(cat);
          }
        }
      },
      { rootMargin: "-110px 0px -60% 0px", threshold: 0 }
    );

    const currentRefs = sectionRefs.current;
    for (const el of currentRefs.values()) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [categories, onVisibleCategory]);

  // Sticky detection: toggle .is-stuck when header hits sticky position
  useEffect(() => {
    if (categories.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const header = entry.target.nextElementSibling as HTMLElement | null;
          if (header?.classList.contains("category-section-header")) {
            header.classList.toggle("is-stuck", !entry.isIntersecting);
          }
        }
      },
      { rootMargin: "-87px 0px 0px 0px", threshold: 0 }
    );
    // Observe sentinel elements (we insert tiny sentinels before each header)
    const sentinels = containerRef.current?.querySelectorAll(".sticky-sentinel");
    sentinels?.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [categories]);

  // Pre-compute updates per category for temporal context
  const categoryUpdatesMap = useMemo(() => {
    const map = new Map<string, EnrichedUpdate[]>();
    for (const cat of categories) {
      map.set(cat.category, getUpdatesForSourceCategory(updates, source, cat.category));
    }
    return map;
  }, [updates, source, categories]);

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-30">
          <rect x="8" y="6" width="32" height="36" rx="4" stroke="currentColor" strokeWidth="1.5" />
          <line x1="14" y1="16" x2="34" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <line x1="14" y1="22" x2="28" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
          <line x1="14" y1="28" x2="30" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
          <circle cx="24" cy="35" r="3" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
        </svg>
        <p className="text-sm font-medium">No updates for this source today</p>
        <p className="text-xs opacity-60">Check back later or select a different source</p>
      </div>
    );
  }

  const sourceColor = getSourceColor(source);
  const RECOVERY_CATEGORIES = new Set(["on-hook", "repossessed"]);
  const [expandedAll, setExpandedAll] = useState<Set<string>>(new Set());

  const toggleExpandAll = useCallback((category: string) => {
    setExpandedAll((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  return (
    <div ref={containerRef} className="category-tables-container">
      {categories.map((cat, idx) => {
        const catUpdates = categoryUpdatesMap.get(cat.category) || [];
        const isLarge = cat.count >= 8;
        const lastUpdatedLabel = getLastUpdatedLabel(catUpdates);
        const isAllExpanded = expandedAll.has(cat.category);
        const isRecovery = RECOVERY_CATEGORIES.has(cat.category);
        const headerColor = isRecovery ? "#ef4444" : sourceColor;

        return (
          <section
            key={cat.category}
            data-category={cat.category}
            ref={(el) => {
              if (el) sectionRefs.current.set(cat.category, el);
            }}
            className="category-section animate-in"
            style={{ animationDelay: `${600 + idx * 80}ms` }}
          >
            <div className="sticky-sentinel" style={{ height: 1, marginBottom: -1 }} />
            <div
              ref={(el) => { if (el) headerRefs.current.set(cat.category, el); }}
              className={`category-section-header ${isLarge ? "category-header-large" : ""}`}
              style={{
                borderLeftColor: headerColor,
                borderLeftWidth: 4,
                borderLeftStyle: "solid",
                "--header-accent": headerColor,
                borderBottomColor: headerColor,
                background: isRecovery
                  ? `linear-gradient(135deg, var(--color-pvt-dark) 0%, color-mix(in oklch, var(--color-pvt-dark) 78%, #ef4444) 100%)`
                  : `linear-gradient(135deg, var(--color-pvt-dark) 0%, color-mix(in oklch, var(--color-pvt-dark) 82%, ${sourceColor}) 100%)`,
              } as React.CSSProperties}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: headerColor,
                    boxShadow: `0 0 6px ${headerColor}60`,
                  }}
                />
                <h3
                  className="font-display text-sm font-semibold uppercase tracking-wider"
                  style={{ color: "#ffffff", letterSpacing: "0.1em" }}
                >
                  {formatCategoryName(cat.category)}
                </h3>
                <Badge
                  variant="secondary"
                  className="bg-white/15 text-white border-white/20 text-[11px] font-mono tabular-nums px-2 py-0"
                >
                  {cat.count}
                </Badge>
                {RECOVERY_CATEGORIES.has(cat.category) && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.25)",
                      color: "#fca5a5",
                      border: "1px solid rgba(239, 68, 68, 0.35)",
                    }}
                  >
                    <ShieldAlert size={10} />
                    Recovery
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {cat.count > 2 && (
                  <button
                    onClick={() => toggleExpandAll(cat.category)}
                    className="expand-all-btn"
                    title={isAllExpanded ? "Collapse all" : "Expand all"}
                  >
                    {isAllExpanded ? <ChevronsDownUp size={12} /> : <ChevronsUpDown size={12} />}
                    <span>{isAllExpanded ? "Collapse" : "Expand"}</span>
                  </button>
                )}
                {lastUpdatedLabel && (
                  <span className="category-last-updated">
                    <Clock size={10} />
                    {lastUpdatedLabel}
                  </span>
                )}
              </div>
            </div>
            <UpdateTable updates={catUpdates} sourceColor={sourceColor} expandAll={isAllExpanded} />
          </section>
        );
      })}
    </div>
  );
}
