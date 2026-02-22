"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Mail,
  Check,
} from "lucide-react";

type FormMode = "login" | "forgot" | "reset-sent";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<FormMode>("login");
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const resetEmailRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Check if image was already cached before React hydrated
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setImgLoaded(true);
    }
  }, []);

  // Focus the appropriate input when mode changes
  useEffect(() => {
    if (mode === "forgot") {
      resetEmailRef.current?.focus();
    } else if (mode === "login") {
      emailRef.current?.focus();
    }
  }, [mode]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      emailRef.current?.focus();
      return;
    }

    router.push("/updates");
    router.refresh();
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMode("reset-sent");
  }

  return (
    <div className="min-h-screen flex bg-[#0f172a]">
      {/* ── Left: Photo Panel ── */}
      <div className="hidden md:block w-1/2 relative overflow-hidden bg-[#0f172a]">
        {/* Shimmer skeleton while image loads */}
        {!imgLoaded && (
          <div className="absolute inset-0 z-0">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(110deg, rgba(15,23,42,1) 0%, rgba(30,41,59,0.8) 40%, rgba(15,23,42,1) 60%)",
                backgroundSize: "200% 100%",
                animation: "shimmer-slide 1.8s ease-in-out infinite",
              }}
            />
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src="/login-bg.jpg"
          alt=""
          className={`absolute inset-0 w-full h-full object-cover object-[50%_60%] transition-opacity duration-700 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setImgLoaded(true)}
        />
        {/* Cinematic top vignette — blends sky into page bg */}
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(to bottom, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.5) 12%, transparent 30%)",
          }}
        />
        {/* Subtle darken for text legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.55) 100%)",
          }}
        />
        {/* Right-edge blend into form panel */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, transparent 50%, rgba(15, 23, 42, 0.8) 80%, rgba(15, 23, 42, 1) 100%)",
          }}
        />
        {/* Bottom gradient for tagline legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.4) 18%, transparent 35%)",
          }}
        />

        {/* Green brand tint overlay */}
        <div
          className="absolute inset-0 mix-blend-overlay pointer-events-none"
          style={{
            background:
              "linear-gradient(160deg, rgba(122, 188, 100, 0.08) 0%, transparent 40%, rgba(122, 188, 100, 0.05) 100%)",
          }}
        />

        {/* Tagline overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-10 pb-10 lg:px-14 lg:pb-12">
          {/* Green accent bar */}
          <div className="h-[2px] w-12 rounded-full bg-[#7abc64]/70 mb-5 animate-in animate-in-1" />
          {/* Headline */}
          <p className="font-display text-[22px] lg:text-[26px] font-semibold text-white/90 leading-snug tracking-tight mb-5 animate-in animate-in-2">
            Recovery intelligence,<br />
            automated.
          </p>
          {/* Pill tags */}
          <div className="flex items-center gap-2.5 animate-in animate-in-4">
            {["Skip Tracing", "Compliance", "Field Ops", "Analytics"].map((label) => (
              <span
                key={label}
                className="px-3 py-1 rounded-full text-[11px] font-medium tracking-wide text-white/70 border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Form Panel ── */}
      <div
        className="w-full md:w-1/2 relative flex items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(22, 32, 50, 0.98) 100%)",
        }}
      >
        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat",
            backgroundSize: "128px 128px",
          }}
        />

        {/* Subtle green radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 40%, rgba(122, 188, 100, 0.06) 0%, transparent 60%)",
          }}
        />

        {/* Form content */}
        <div className="relative z-10 w-full max-w-[380px] lg:max-w-[420px] mx-6 sm:mx-4">
          {/* Glass card */}
          <div
            className="relative rounded-2xl p-8 sm:p-10 animate-in overflow-hidden"
            style={{
              background: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              boxShadow:
                "0 12px 32px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), 0 1px 8px rgba(122, 188, 100, 0.15)",
            }}
          >
            {/* Gradient top accent */}
            <div
              className="absolute top-0 left-0 right-0 h-[3px]"
              style={{
                background: "linear-gradient(90deg, #5a9a47, #7abc64, #9dd485)",
              }}
            />
            {/* Title */}
            <div className="text-center mb-5 animate-in animate-in-1">
              <h1 className="font-display text-[17px] font-bold text-white tracking-tight leading-snug whitespace-nowrap">
                Automated Intelligent Management Suite
              </h1>
              <p className="mt-1.5 text-[10px] font-medium text-white/60 tracking-[0.12em] uppercase">
                for Repo Industry
              </p>
            </div>

            {/* By PVT */}
            <div className="flex items-center justify-center gap-2.5 mb-8 animate-in animate-in-2">
              <span className="text-[10px] font-medium text-white/55 tracking-[0.08em] uppercase">
                by
              </span>
              <div className="logo-glow">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/pvt-logo.png"
                  alt="Perfect Virtual Team"
                  className="h-7 w-auto brightness-0 invert opacity-85"
                />
              </div>
            </div>

            {/* ── Login Form ── */}
            {mode === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <div className="animate-in animate-in-3">
                  <label
                    htmlFor="email"
                    className="block font-mono text-xs uppercase tracking-[0.08em] text-white/60 mb-2"
                  >
                    Email
                  </label>
                  <input
                    ref={emailRef}
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                    className="w-full px-4 py-3 rounded-xl text-sm bg-white/[0.04] border border-white/[0.06] text-white/85 placeholder:text-white/25 outline-none transition-all focus:border-[rgba(122,188,100,0.4)] focus:bg-white/[0.08] focus:shadow-[0_0_0_3px_rgba(122,188,100,0.06)]"
                    aria-describedby={error ? "login-error" : undefined}
                  />
                </div>

                {/* Password */}
                <div className="animate-in animate-in-4">
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="password"
                      className="block font-mono text-xs uppercase tracking-[0.08em] text-white/60"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-[11px] text-[#7abc64]/70 hover:text-[#7abc64] transition-colors"
                      onClick={() => {
                        setError(null);
                        setMode("forgot");
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 pr-11 rounded-xl text-sm bg-white/[0.04] border border-white/[0.06] text-white/85 placeholder:text-white/25 outline-none transition-all focus:border-[rgba(122,188,100,0.4)] focus:bg-white/[0.08] focus:shadow-[0_0_0_3px_rgba(122,188,100,0.06)]"
                      aria-describedby={error ? "login-error" : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      tabIndex={-1}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <div className="animate-in animate-in-5 flex items-center gap-2.5 pt-0.5">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={rememberMe}
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`flex items-center justify-center h-4 w-4 rounded border transition-all ${
                      rememberMe
                        ? "bg-[#7abc64] border-[#7abc64] text-white"
                        : "border-white/20 bg-white/[0.04] hover:border-white/30"
                    }`}
                  >
                    {rememberMe && <Check className="h-3 w-3" strokeWidth={3} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRememberMe(!rememberMe)}
                    className="text-[12px] text-white/50 hover:text-white/70 transition-colors select-none"
                  >
                    Remember me
                  </button>
                </div>

                {/* Error message */}
                {error && (
                  <div
                    id="login-error"
                    role="alert"
                    className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 animate-in"
                  >
                    {error}
                  </div>
                )}

                {/* Submit button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl font-display text-sm font-semibold text-white tracking-wide flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-br from-[#7abc64] to-[#5a9a47] shadow-[0_2px_8px_rgba(122,188,100,0.2)] hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(122,188,100,0.3)] focus-visible:-translate-y-px focus-visible:shadow-[0_4px_16px_rgba(122,188,100,0.3)]"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ── Forgot Password Form ── */}
            {mode === "forgot" && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <p className="text-sm text-white/60 mb-4 leading-relaxed">
                    Enter your email address and we&apos;ll send you a link to
                    reset your password.
                  </p>
                  <label
                    htmlFor="reset-email"
                    className="block font-mono text-xs uppercase tracking-[0.08em] text-white/60 mb-2"
                  >
                    Email
                  </label>
                  <input
                    ref={resetEmailRef}
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                    className="w-full px-4 py-3 rounded-xl text-sm bg-white/[0.04] border border-white/[0.06] text-white/85 placeholder:text-white/25 outline-none transition-all focus:border-[rgba(122,188,100,0.4)] focus:bg-white/[0.08] focus:shadow-[0_0_0_3px_rgba(122,188,100,0.06)]"
                    aria-describedby={error ? "reset-error" : undefined}
                  />
                </div>

                {/* Error message */}
                {error && (
                  <div
                    id="reset-error"
                    role="alert"
                    className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 animate-in"
                  >
                    {error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl font-display text-sm font-semibold text-white tracking-wide flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-br from-[#7abc64] to-[#5a9a47] shadow-[0_2px_8px_rgba(122,188,100,0.2)] hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(122,188,100,0.3)]"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Send Reset Link
                        <Mail className="h-4 w-4" />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode("login");
                    }}
                    className="w-full py-2.5 rounded-xl text-sm text-white/50 hover:text-white/70 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to sign in
                  </button>
                </div>
              </form>
            )}

            {/* ── Reset Email Sent Confirmation ── */}
            {mode === "reset-sent" && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-12 w-12 rounded-full bg-[#7abc64]/15 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-[#7abc64]" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">
                    Check your email
                  </p>
                  <p className="text-[13px] text-white/45 mt-1.5 leading-relaxed">
                    We sent a password reset link to{" "}
                    <span className="text-white/65 font-medium">{email}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode("login");
                  }}
                  className="w-full py-2.5 rounded-xl text-sm text-white/50 hover:text-white/70 flex items-center justify-center gap-1.5 transition-colors mt-2"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to sign in
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500/70 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]" />
              </span>
              <span className="font-sans text-[10px] text-white/50 tracking-wider uppercase">
                All Systems Operational
              </span>
            </div>
            <p className="font-sans text-[11px] text-white/40 mt-2">
              &copy; {new Date().getFullYear()} Perfect Virtual Team
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer-slide {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
