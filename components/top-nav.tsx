"use client";

import { clientConfig } from "@/lib/client-config";

export function TopNav() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="top-nav">
      <div className="mx-auto w-full max-w-7xl h-full px-6 flex items-center justify-between">
        {/* Left: Logo + Brand */}
        <div className="flex items-center gap-3">
          <div className="logo-glow">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/pvt-logo.png"
              alt="PVT"
              className="h-9 w-auto brightness-0 invert"
            />
          </div>
          <div className="header-divider" />
          <div className="flex flex-col -space-y-0.5">
            <span className="font-display text-[15px] font-bold text-white tracking-tight leading-tight">
              New Update Intelligence
            </span>
            <span className="header-subtitle">
              {clientConfig.clientName}
            </span>
          </div>
        </div>

        {/* Right: Status cluster */}
        <div className="header-status-group">
          <span className="header-date">{today}</span>
          <div className="header-status-sep" />
          <div className="header-live-badge">
            <span className="header-live-dot" />
            <span className="header-live-text">Live</span>
          </div>
        </div>
      </div>
    </header>
  );
}
