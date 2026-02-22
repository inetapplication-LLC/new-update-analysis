"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { ChevronDown, ChevronRight, Search, Eye } from "lucide-react";
import type { SourceCount, CategoryCount } from "@/lib/queries";
import { getSourceColor } from "@/lib/constants";
import { formatCategoryName } from "@/lib/utils";

interface SourceSidebarProps {
  sources: SourceCount[];
  categoryCounts: Map<string, CategoryCount[]>;
  activeSource: string | null;
  activeCategory: string | null;
  visibleCategory?: string | null;
  onSelectSource: (source: string) => void;
  onSelectCategory: (source: string, category: string) => void;
}

export function SourceSidebar({
  sources,
  categoryCounts,
  activeSource,
  activeCategory,
  visibleCategory,
  onSelectSource,
  onSelectCategory,
}: SourceSidebarProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() =>
    new Set(sources.filter((s) => s.count > 0).map((s) => s.source))
  );
  const [filter, setFilter] = useState("");
  const navRef = useRef<HTMLElement>(null);

  // Auto-expand all sources when sources change (e.g. date navigation)
  useEffect(() => {
    setExpanded(new Set(sources.filter((s) => s.count > 0).map((s) => s.source)));
  }, [sources]);

  const filteredSources = useMemo(() => {
    const q = filter.toLowerCase().trim();
    if (!q) return sources.filter((s) => s.count > 0);
    return sources.filter(
      (s) =>
        s.count > 0 &&
        (s.source.toLowerCase().includes(q) ||
          (categoryCounts.get(s.source) || []).some((c) =>
            formatCategoryName(c.category).toLowerCase().includes(q)
          ))
    );
  }, [sources, filter, categoryCounts]);

  const totalCount = useMemo(
    () => sources.reduce((sum, s) => sum + s.count, 0),
    [sources]
  );

  function toggleExpand(source: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(source)) next.delete(source);
      else next.add(source);
      return next;
    });
    onSelectSource(source);
  }

  // Keyboard navigation within the sidebar nav
  const handleNavKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      const nav = navRef.current;
      if (!nav) return;
      const focusable = Array.from(
        nav.querySelectorAll<HTMLButtonElement>("button:not([disabled])")
      );
      const idx = focusable.indexOf(document.activeElement as HTMLButtonElement);
      if (idx === -1) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        focusable[Math.min(idx + 1, focusable.length - 1)]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        focusable[Math.max(idx - 1, 0)]?.focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        focusable[0]?.focus();
      } else if (e.key === "End") {
        e.preventDefault();
        focusable[focusable.length - 1]?.focus();
      }
    },
    []
  );

  return (
    <aside className="source-sidebar" role="navigation" aria-label="Update sources">
      {/* Header */}
      <div className="sidebar-header">
        <div className="flex items-center justify-between w-full">
          <span className="sidebar-title">Sources</span>
          <span className="sidebar-total-badge">{totalCount}</span>
        </div>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <Search size={13} className="text-white/30 shrink-0" />
        <input
          type="text"
          placeholder="Filter sources..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="sidebar-search-input"
          aria-label="Filter sources"
        />
      </div>

      {/* Source list with keyboard nav */}
      <nav
        ref={navRef}
        className="sidebar-nav"
        role="tree"
        aria-label="Source categories"
        onKeyDown={handleNavKeyDown}
      >
        {filteredSources.map((s) => {
          const isActive = activeSource === s.source;
          const isExpanded = expanded.has(s.source);
          const categories = categoryCounts.get(s.source) || [];
          const color = getSourceColor(s.source);
          const pct = totalCount > 0 ? Math.round((s.count / totalCount) * 100) : 0;

          return (
            <div key={s.source} className="sidebar-source-group" role="treeitem" aria-expanded={isExpanded}>
              <button
                onClick={() => toggleExpand(s.source)}
                className={`sidebar-source-btn ${isActive ? "active" : ""}`}
                aria-current={isActive ? "true" : undefined}
                tabIndex={0}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  {isExpanded ? (
                    <ChevronDown size={13} className="shrink-0 opacity-40" />
                  ) : (
                    <ChevronRight size={13} className="shrink-0 opacity-40" />
                  )}
                  <span
                    className="sidebar-source-dot"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate font-medium">{s.source}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="sidebar-mini-bar">
                    <span
                      className="sidebar-mini-bar-fill"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </span>
                  <span
                    className="sidebar-count"
                    style={{
                      color,
                      backgroundColor: `${color}18`,
                    }}
                  >
                    {s.count}
                  </span>
                </span>
              </button>

              {isExpanded && categories.length > 0 && (
                <div className="sidebar-categories" role="group">
                  <div
                    className="category-connector"
                    style={{ backgroundColor: `${color}40` }}
                  />
                  {categories.map((cat) => {
                    const isCatActive =
                      isActive && activeCategory === cat.category;
                    const isVisible =
                      isActive && visibleCategory === cat.category;
                    return (
                      <button
                        key={cat.category}
                        onClick={() => onSelectCategory(s.source, cat.category)}
                        className={`sidebar-category-btn ${isCatActive ? "active" : ""} ${isVisible && !isCatActive ? "visible-in-viewport" : ""} ${categories.length === 1 ? "sole-category" : ""}`}
                        style={
                          isCatActive
                            ? { backgroundColor: `${color}20`, borderLeftColor: color }
                            : isVisible
                            ? { borderLeftColor: `${color}60` }
                            : undefined
                        }
                        aria-current={isCatActive ? "true" : undefined}
                        tabIndex={0}
                      >
                        <span className="flex items-center gap-1.5 min-w-0">
                          {isVisible && !isCatActive && (
                            <Eye size={10} className="shrink-0 opacity-50" aria-hidden="true" />
                          )}
                          <span className="truncate">
                            {formatCategoryName(cat.category)}
                          </span>
                        </span>
                        <span className="cat-count">{cat.count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filteredSources.length === 0 && (
          <div className="px-4 py-6 text-center text-white/30 text-xs">
            No sources match &ldquo;{filter}&rdquo;
          </div>
        )}
      </nav>
    </aside>
  );
}
