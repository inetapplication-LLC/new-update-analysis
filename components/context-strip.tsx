"use client";

import { useState, useEffect } from "react";
import { clientConfig } from "@/lib/client-config";

export function ContextStrip() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const date = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const time = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="context-strip">
      <div className="mx-auto w-full max-w-7xl h-full px-6 flex items-center justify-between">
        {/* Left: Client identity */}
        <div className="flex items-center gap-2.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[#7abc64] live-glow-pulse" />
          <span className="font-display text-[15px] font-semibold text-foreground tracking-tight">
            {clientConfig.clientName}
          </span>
        </div>

        {/* Right: Live date/time */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="text-[12px] font-mono tabular-nums">{date}</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-[12px] font-mono tabular-nums">{time}</span>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#7abc64] live-glow-pulse ml-1" />
        </div>
      </div>
    </div>
  );
}
