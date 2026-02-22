"use client";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-b from-[#f1f5f9] to-[#e9eff5]">
      {/* Accent top line */}
      <div
        className="h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 10%, rgba(122,188,100,0.3) 40%, rgba(122,188,100,0.5) 50%, rgba(122,188,100,0.3) 60%, transparent 90%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/pvt-logo.png"
            alt="PVT"
            className="h-5 w-auto opacity-25 grayscale"
          />
          <div className="h-3.5 w-px bg-slate-300/50" />
          <span className="font-sans text-[11px] text-slate-400 tracking-wide">
            &copy; {year} Perfect Virtual Team
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500/70 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]" />
          </span>
          <span className="font-sans text-[10px] text-slate-400/80 tracking-wider uppercase">
            All Systems Operational
          </span>
        </div>
      </div>
    </footer>
  );
}
