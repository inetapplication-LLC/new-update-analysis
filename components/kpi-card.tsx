"use client";

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: number;
  sublabel: string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  delay?: number;
}

function useCountUp(target: number, duration = 600) {
  const [current, setCurrent] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number>(0);

  useEffect(() => {
    if (target === 0) return;
    startTime.current = null;

    function step(timestamp: number) {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) {
        rafId.current = requestAnimationFrame(step);
      }
    }

    rafId.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId.current);
  }, [target, duration]);

  return current;
}

export function KpiCard({ label, value, sublabel, icon: Icon, trend, delay = 0 }: KpiCardProps) {
  const displayValue = useCountUp(value);

  return (
    <div
      className="metric-card animate-in"
      style={{ animationDelay: `${delay * 80}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon size={16} strokeWidth={2} />
          <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
        </div>
        {trend && (
          <div
            className={`flex items-center gap-0.5 text-xs font-semibold ${
              trend.positive ? "text-pvt-green" : "text-pvt-red"
            }`}
          >
            {trend.positive ? (
              <ArrowUpRight size={14} strokeWidth={2.5} />
            ) : (
              <ArrowDownRight size={14} strokeWidth={2.5} />
            )}
            {Math.abs(trend.value) > 999
              ? `${Math.round(Math.abs(trend.value) / 100)}x`
              : `${Math.abs(trend.value)}%`}
          </div>
        )}
      </div>
      <p className="data-value text-3xl font-bold tracking-tight text-foreground">
        {displayValue.toLocaleString()}
      </p>
      <p className="text-xs text-muted-foreground mt-1.5">{sublabel}</p>
    </div>
  );
}
