// app/admin/signup/page.tsx — Admin account creation
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth";
import Link from "next/link";

export default function AdminSignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password);
      router.push("/admin/login");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create account. Please try again.";
      setError(errorMessage || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSignup();
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
            Create Account
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
                placeholder="admin@fittrybe.co.uk"
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
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-1.5 font-[family-name:var(--font-dm-sans)]">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#B6FF00]/50 transition-colors font-[family-name:var(--font-dm-sans)]"
                autoComplete="new-password"
              />
            </div>

            <button
              onClick={handleSignup}
              disabled={loading || !email || !password || !confirmPassword}
              className="w-full py-3 bg-[#B6FF00] text-black font-bold rounded-xl hover:bg-[#B6FF00]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-[family-name:var(--font-barlow-condensed)] text-lg uppercase tracking-wide mt-2"
            >
              {loading ? "Creating Account…" : "Create Account"}
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/admin/login"
              className="text-sm text-white/60 hover:text-[#B6FF00] transition-colors font-[family-name:var(--font-dm-sans)]"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
