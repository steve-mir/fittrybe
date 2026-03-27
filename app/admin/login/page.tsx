// app/admin/login/page.tsx — Admin login form
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    setLoading(true);
    try {
      const user = await signIn(email, password);
      // Get the ID token and store as a session cookie
      const token = await user.getIdToken();
      // Set session cookie (expires in 1 hour, matches Firebase token lifetime)
      document.cookie = `fittrybe_admin_session=${token}; path=/; max-age=3600; SameSite=Strict`;
      router.push(redirect);
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleLogin();
  }

  return (
    <main className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <span className="font-[family-name:var(--font-barlow-condensed)] text-4xl font-black tracking-tight text-[#B6FF00]">
            FITTRYBE
          </span>
          <p className="text-white/40 text-sm mt-2 font-[family-name:var(--font-dm-sans)]">
            Admin Dashboard
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-6 font-[family-name:var(--font-barlow-condensed)]">
            Sign in
          </h1>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-[family-name:var(--font-dm-sans)]">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5 font-[family-name:var(--font-dm-sans)]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="admin@fittrybe.com"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#B6FF00]/50 transition-colors font-[family-name:var(--font-dm-sans)]"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-1.5 font-[family-name:var(--font-dm-sans)]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#B6FF00]/50 transition-colors font-[family-name:var(--font-dm-sans)]"
                autoComplete="current-password"
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading || !email || !password}
              className="w-full py-3 bg-[#B6FF00] text-black font-bold rounded-xl hover:bg-[#B6FF00]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-[family-name:var(--font-barlow-condensed)] text-lg uppercase tracking-wide mt-2"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <LoginForm />
    </Suspense>
  );
}
