"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (error) {
        setError(error.message);
      } else {
        setDone(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  };

  if (done) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center">
          <CheckCircle className="h-12 w-12 text-accent" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-nav-text">Check your email</h1>
        <p className="mt-3 text-sm text-nav-muted">
          We sent a confirmation link to{" "}
          <strong className="text-nav-text">{email}</strong>. Click it to
          activate your account and get started.
        </p>
        <Link
          href="/auth/login"
          className="mt-6 inline-block text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-nav-text">Create your account</h1>
        <p className="mt-2 text-sm text-nav-muted">
          Already have one?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
          >
            Sign in
          </Link>
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="mt-6 space-y-4" noValidate>
        <div>
          <label
            htmlFor="reg-email"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-nav-muted"
          >
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-nav-border bg-nav-bg px-3 py-2.5 text-sm text-nav-text outline-none transition placeholder:text-nav-muted/60 focus:border-nav-indigo focus:ring-1 focus:ring-nav-indigo"
          />
        </div>
        <div>
          <label
            htmlFor="reg-password"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-nav-muted"
          >
            Password <span className="font-normal normal-case text-nav-muted/70">(min. 8 characters)</span>
          </label>
          <input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a strong password"
            className="w-full rounded-lg border border-nav-border bg-nav-bg px-3 py-2.5 text-sm text-nav-text outline-none transition placeholder:text-nav-muted/60 focus:border-nav-indigo focus:ring-1 focus:ring-nav-indigo"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !email || !password}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-nav-blue to-nav-indigo px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-indigo"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="relative my-6 flex items-center">
        <div className="flex-1 border-t border-nav-border" />
        <span className="mx-4 text-xs text-nav-muted">or</span>
        <div className="flex-1 border-t border-nav-border" />
      </div>

      <button
        onClick={handleGoogleLogin}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-nav-border bg-nav-panel px-4 py-2.5 text-sm font-semibold text-nav-text transition hover:bg-nav-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </button>

      <p className="mt-6 text-center text-xs text-nav-muted">
        By creating an account you agree to our{" "}
        <a href="#" className="hover:text-nav-text underline">Terms</a> and{" "}
        <a href="#" className="hover:text-nav-text underline">Privacy Policy</a>.
      </p>
    </div>
  );
}
