"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar, PanelLeftClose, PanelLeft } from "lucide-react";
import { toast } from "sonner";
import { SourceSidebar } from "@/components/source-sidebar";
import { CategoryTables } from "@/components/category-tables";
import { getSourceColor } from "@/lib/constants";
import { useRealtimeUpdates } from "@/hooks/use-realtime-updates";
import {
  fetchDailyUpdates,
  fetchUpdatesByDay,
  computeSourceCounts,
  computeDaySummary,
  computeCategoryCounts,
  type DailyUpdate,
  type EnrichedUpdate,
  type SourceCount,
  type CategoryCount,
} from "@/lib/queries";

/* ── Hero Summary Bar (Context + Day Selector + Metric Cards) ──── */

function SummaryBar({
  days,
  selectedDay,
  onSelectDay,
  total,
  sourceCounts,
  activeSource,
  onSelectSource,
  isLoading,
}: {
  days: DailyUpdate[];
  selectedDay: string | null;
  onSelectDay: (day: string) => void;
  total: number;
  sourceCounts: SourceCount[];
  activeSource: string | null;
  onSelectSource: (source: string) => void;
  isLoading?: boolean;
}) {
  const currentIndex = days.findIndex((d) => d.day === selectedDay);
  const canPrev = currentIndex > 0;
  const canNext = currentIndex < days.length - 1;
  const maxCount = Math.max(...sourceCounts.map((s) => s.count), 1);

  function formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  const topSources = sourceCounts.filter((s) => s.count > 0).slice(0, 6);

  return (
    <div className="summary-hero animate-in">
      {/* Row 1: Context identity + day selector */}
      <div className="summary-hero-top">
        <div className="summary-context">
          <span className="summary-client-name">Daily Summary</span>
        </div>
        <div className="summary-day-selector">
          <button
            onClick={() => canPrev && onSelectDay(days[currentIndex - 1].day)}
            disabled={!canPrev}
            className="summary-nav-btn"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-[var(--color-pvt-green)] opacity-70" />
            <span className="text-sm font-bold text-foreground font-display tracking-tight">
              {selectedDay ? formatDate(selectedDay) : "Loading..."}
            </span>
          </div>
          <button
            onClick={() => canNext && onSelectDay(days[currentIndex + 1].day)}
            disabled={!canNext}
            className="summary-nav-btn"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Row 2: Metrics strip */}
      <div className="summary-metrics-row">
        {/* Hero total */}
        <div className="summary-total-card">
          {isLoading ? (
            <span className="skeleton-block" style={{ width: 64, height: 40, borderRadius: 8 }} />
          ) : (
            <span className="summary-total-number">{total}</span>
          )}
          <span className="summary-total-label">Total Updates</span>
        </div>

        {/* Source metric cards — clickable, with skeleton loading */}
        <div className="summary-source-cards">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="summary-source-card skeleton-card" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="summary-source-card-inner">
                  <span className="skeleton-block" style={{ width: 44, height: 28, borderRadius: 8 }} />
                  <span className="skeleton-block" style={{ width: 30, height: 14, borderRadius: 4 }} />
                </div>
                <div className="summary-source-bar-track">
                  <div className="skeleton-bar-fill" />
                </div>
                <span className="skeleton-block" style={{ width: 64, height: 11, borderRadius: 4 }} />
              </div>
            ))
          ) : (
            topSources.map((s) => {
              const color = getSourceColor(s.source);
              const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
              const isDominant = s.count >= maxCount * 0.5;
              const isActive = activeSource === s.source;
              return (
                <button
                  key={s.source}
                  onClick={() => onSelectSource(s.source)}
                  className={`summary-source-card ${isDominant ? "dominant" : ""} ${isActive ? "selected" : ""}`}
                  style={{ "--source-color": color, "--source-pct": `${pct}%` } as React.CSSProperties}
                >
                  <div className="summary-source-card-inner">
                    <span className="summary-source-count">{s.count}</span>
                    <span className="summary-source-pct">{pct}%</span>
                  </div>
                  <div className="summary-source-bar-track">
                    <div className="summary-source-bar-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                  <span className="summary-source-name">{s.source}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Updates Page ──────────────────────────────────────── */

export default function UpdatesPage() {
  const [barData, setBarData] = useState<DailyUpdate[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dayUpdates, setDayUpdates] = useState<EnrichedUpdate[]>([]);
  const [dayLoading, setDayLoading] = useState(false);

  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [scrollTarget, setScrollTarget] = useState<{ category: string; ts: number } | null>(null);
  const [visibleCategory, setVisibleCategory] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Fetch available days on mount
  useEffect(() => {
    fetchDailyUpdates()
      .then((result) => {
        setBarData(result);
        if (result.length > 0) {
          setSelectedDay(result[result.length - 1].day);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Fetch day detail when selectedDay changes
  useEffect(() => {
    if (!selectedDay) return;
    setDayLoading(true);
    setActiveCategory(null);
    setScrollTarget(null);
    fetchUpdatesByDay(selectedDay)
      .then((updates) => {
        setDayUpdates(updates);
        const firstWithData = computeSourceCounts(updates).find((s) => s.count > 0);
        if (firstWithData) {
          setActiveSource(firstWithData.source);
        }
      })
      .catch(console.error)
      .finally(() => setDayLoading(false));
  }, [selectedDay]);

  // Derived data
  const sourceCounts = useMemo(() => computeSourceCounts(dayUpdates), [dayUpdates]);
  const daySummary = useMemo(() => computeDaySummary(dayUpdates), [dayUpdates]);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, CategoryCount[]>();
    for (const s of sourceCounts) {
      if (s.count > 0) {
        map.set(s.source, computeCategoryCounts(dayUpdates, s.source));
      }
    }
    return map;
  }, [dayUpdates, sourceCounts]);

  const activeCategories = useMemo(
    () => (activeSource ? categoryCounts.get(activeSource) || [] : []),
    [activeSource, categoryCounts]
  );

  // Handlers
  const handleSelectSource = useCallback((source: string) => {
    setActiveSource(source);
    setActiveCategory(null);
    setScrollTarget(null);
    setVisibleCategory(null);
  }, []);

  const handleSelectCategory = useCallback((source: string, category: string) => {
    setActiveSource(source);
    setActiveCategory(category);
    setVisibleCategory(category);
    setScrollTarget({ category, ts: Date.now() });
  }, []);

  // ── Request desktop notification permission on mount ──
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ── Realtime: desktop notification + toast + auto-refresh on new inserts ──
  const handleNewUpdates = useCallback(
    (updates: { id: number; update_id: number | null; update_type: string | null; update_date: string | null; update_content: string | null }[]) => {
      if (updates.length === 0) return;

      // Determine which day(s) the new updates belong to
      const updateDays = new Set(
        updates
          .map((u) => u.update_date?.substring(0, 10))
          .filter(Boolean) as string[]
      );

      const matchesSelectedDay = selectedDay ? updateDays.has(selectedDay) : false;

      // ── Desktop notification (system-level, grabs attention) ──
      if ("Notification" in window && Notification.permission === "granted") {
        let title: string;
        let body: string;

        if (updates.length === 1) {
          const u = updates[0];
          title = `New ${u.update_type || "Update"} Update`;
          body = u.update_content
            ? u.update_content.substring(0, 120)
            : "A new update has been received.";
        } else {
          title = `${updates.length} New Updates`;
          const types = [...new Set(updates.map((u) => u.update_type).filter(Boolean))];
          body = types.length > 0
            ? `Types: ${types.join(", ")}`
            : `${updates.length} updates received.`;
        }

        const notification = new Notification(title, {
          body,
          icon: "/icons/icon-192x192.png",
          tag: "aims-realtime-update",
          renotify: true,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }

      // ── In-app toast ──
      if (updates.length === 1) {
        const u = updates[0];
        const label = u.update_type || "Unknown";
        if (matchesSelectedDay) {
          toast.info(`New update: ${label}`, {
            description: "Data refreshed automatically.",
            duration: 8000,
          });
        } else {
          toast.info(`New update: ${label}`, {
            description: u.update_date?.substring(0, 10) ?? "",
            duration: 8000,
            action: {
              label: "View",
              onClick: () => {
                const day = u.update_date?.substring(0, 10);
                if (day) setSelectedDay(day);
              },
            },
          });
        }
      } else {
        if (matchesSelectedDay) {
          toast.info(`${updates.length} new updates received`, {
            description: "Data refreshed automatically.",
            duration: 8000,
          });
        } else {
          const firstDay = [...updateDays][0];
          toast.info(`${updates.length} new updates received`, {
            duration: 8000,
            action: firstDay
              ? {
                  label: "View",
                  onClick: () => setSelectedDay(firstDay),
                }
              : undefined,
          });
        }
      }

      // Always refresh bar chart counts
      fetchDailyUpdates()
        .then((result) => setBarData(result))
        .catch(console.error);

      // If updates match the selected day, refetch day detail
      if (matchesSelectedDay && selectedDay) {
        fetchUpdatesByDay(selectedDay)
          .then((dayData) => {
            setDayUpdates(dayData);
            const firstWithData = computeSourceCounts(dayData).find((s) => s.count > 0);
            if (firstWithData && !activeSource) {
              setActiveSource(firstWithData.source);
            }
          })
          .catch(console.error);
      }
    },
    [selectedDay, activeSource]
  );

  useRealtimeUpdates({
    selectedDay,
    onNewUpdates: handleNewUpdates,
  });

  if (loading) {
    return (
      <div className="page-container">
        <div className="metric-card animate-in max-w-md mx-auto text-center py-12">
          <div className="status-dot status-dot--active mb-3 mx-auto" />
          <p className="text-muted-foreground">Loading updates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="metric-card animate-in max-w-md mx-auto text-center py-12">
          <div className="status-dot status-dot--error mb-3 mx-auto" />
          <p className="text-destructive font-medium">Failed to load data</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* ── Unified Summary Bar ──────────────────────── */}
      <SummaryBar
        days={barData}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        total={daySummary.total}
        sourceCounts={sourceCounts}
        activeSource={activeSource}
        onSelectSource={handleSelectSource}
        isLoading={dayLoading}
      />

      {/* ── Workspace: Sidebar + Tables ──────────────── */}
      <div className={`workspace-container animate-in ${sidebarCollapsed ? "sidebar-collapsed" : ""}`} style={{ animationDelay: "200ms" }}>
        {dayLoading ? (
          <div className="flex items-center justify-center h-64 w-full">
            <div className="status-dot status-dot--active mb-2 mx-auto" />
            <p className="text-muted-foreground ml-3">Loading day details...</p>
          </div>
        ) : (
          <>
            {/* Sidebar collapse toggle */}
            <button
              onClick={() => setSidebarCollapsed((v) => !v)}
              className="sidebar-toggle-btn"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
            </button>

            {!sidebarCollapsed && (
              <SourceSidebar
                sources={sourceCounts}
                categoryCounts={categoryCounts}
                activeSource={activeSource}
                activeCategory={activeCategory}
                visibleCategory={visibleCategory}
                onSelectSource={handleSelectSource}
                onSelectCategory={handleSelectCategory}
              />
            )}
            <main className="table-panel">
              {activeSource ? (
                <CategoryTables
                  key={activeSource}
                  updates={dayUpdates}
                  source={activeSource}
                  categories={activeCategories}
                  scrollToCategory={scrollTarget}
                  onVisibleCategory={setVisibleCategory}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <p>Select a source from the sidebar to view updates.</p>
                </div>
              )}
            </main>
          </>
        )}
      </div>
    </div>
  );
}
