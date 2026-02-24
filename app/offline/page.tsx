"use client";

import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-800">
          <WifiOff className="h-10 w-10 text-slate-400" />
        </div>
        <h1 className="mb-3 font-urbanist text-2xl font-bold text-white">
          You&apos;re Offline
        </h1>
        <p className="mb-8 text-slate-400">
          It looks like you&apos;ve lost your internet connection. Check your
          network and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-lg bg-[#7abc64] px-6 py-3 font-medium text-white transition-colors hover:bg-[#6aad54]"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
