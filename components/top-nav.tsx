"use client";

import { clientConfig } from "@/lib/client-config";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { PushNotificationToggle } from "@/components/push-notification-toggle";

export function TopNav() {
  const router = useRouter();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

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
              Automated Intelligent Management Suite
            </span>
            <span className="header-subtitle">
              {clientConfig.clientName}
            </span>
          </div>
        </div>

        {/* Right: Status cluster + Logout */}
        <div className="flex items-center gap-3">
          <div className="header-status-group">
            <span className="header-date">{today}</span>
            <div className="header-status-sep" />
            <div className="header-live-badge">
              <span className="header-live-dot" />
              <span className="header-live-text">Live</span>
            </div>
          </div>
          <PushNotificationToggle />
          <button
            onClick={handleLogout}
            title="Sign out"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-transparent border border-white/[0.06] text-white/35 hover:bg-white/[0.06] hover:border-white/10 hover:text-white/70 active:bg-white/10 transition-all duration-150 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
