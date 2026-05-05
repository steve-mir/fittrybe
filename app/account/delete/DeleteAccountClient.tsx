"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0D0D0D; color: #fff; font-family: var(--font-dm-sans, 'DM Sans', sans-serif); min-height: 100vh; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
  .card { animation: fadeUp 0.5s ease forwards; }
  .shake { animation: shake 0.5s ease; }
  :focus-visible { outline: 2px solid #B6FF00; outline-offset: 3px; border-radius: 4px; }
  input:-webkit-autofill { -webkit-box-shadow: 0 0 0 1000px #111 inset !important; -webkit-text-fill-color: #fff !important; }
`;

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#111",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  padding: "0.85rem 1rem",
  color: "#fff",
  fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
  fontSize: "0.95rem",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.78rem",
  fontWeight: 600,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "#4B5563",
  marginBottom: "0.4rem",
};

export default function DeleteAccountClient() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  // login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  // confirm form
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  async function handleSignIn() {
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      triggerShake();
      return;
    }
    setSigningIn(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSigningIn(false);
    if (err) {
      setError(err.message);
      triggerShake();
      return;
    }
    setPassword("");
  }

  async function handleDelete() {
    if (!user) return;
    setError(null);
    if (confirmText !== "DELETE") {
      setError('Type "DELETE" exactly to confirm.');
      triggerShake();
      return;
    }
    setDeleting(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setDeleting(false);
      setError("Your session expired. Sign in again.");
      setUser(null);
      return;
    }

    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ confirm: "DELETE", email: user.email }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleting(false);
        setError(body?.error ?? "Could not delete account. Please try again.");
        triggerShake();
        return;
      }
      // Server-side admin.deleteUser already invalidated the auth row.
      // Clear the local session and redirect to confirmation.
      await supabase.auth.signOut();
      router.replace("/account/delete/done");
    } catch (err) {
      console.error(err);
      setDeleting(false);
      setError("Network error. Please try again.");
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />

      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          padding: "1.5rem 5vw",
        }}
      >
        <Link
          href="/"
          aria-label="Back to Fittrybe homepage"
          style={{
            color: "#4B5563",
            textDecoration: "none",
            fontSize: "0.85rem",
            fontWeight: 600,
            letterSpacing: "0.03em",
          }}
        >
          ← Back to Home
        </Link>
      </div>

      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "100px 5vw 60px",
        }}
      >
        <div className={`card ${shake ? "shake" : ""}`} style={{ width: "100%", maxWidth: 480 }}>
          <div style={{ marginBottom: "2rem", textAlign: "center" }}>
            <Link href="/" aria-label="Fittrybe — return to homepage" style={{ display: "inline-block" }}>
              <Image
                src="/wordmark-white.png"
                alt="Fittrybe"
                width={132}
                height={50}
                priority
                style={{ display: "block", height: "30px", width: "auto" }}
              />
            </Link>
          </div>

          <div
            style={{
              background: "#0a0a0a",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: "2.5rem",
            }}
          >
            <h1
              style={{
                fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)",
                fontWeight: 900,
                fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
                marginBottom: "0.75rem",
              }}
            >
              Delete <span style={{ color: "#ff6b6b" }}>Your Account</span>
            </h1>

            <p style={{ fontSize: "0.92rem", color: "#6B7280", lineHeight: 1.6, marginBottom: "1.75rem" }}>
              This is permanent. Your profile, sessions you hosted, posts, chat messages, ratings,
              wallet balance and all related data will be deleted. This cannot be undone.
            </p>

            {checking ? (
              <p style={{ color: "#6B7280", fontSize: "0.85rem", textAlign: "center" }}>
                Checking session…
              </p>
            ) : !user ? (
              /* ── Step 1: sign in ────────────────────────────────────────── */
              <>
                <p style={{ fontSize: "0.85rem", color: "#9CA3AF", marginBottom: "1.25rem" }}>
                  Sign in to confirm you own this account.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                  <div>
                    <label htmlFor="del-email" style={labelStyle}>Email</label>
                    <input
                      id="del-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label htmlFor="del-pass" style={labelStyle}>Password</label>
                    <input
                      id="del-pass"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                      style={inputStyle}
                    />
                  </div>

                  {error && (
                    <p role="alert" style={{ fontSize: "0.82rem", color: "#ff6b6b", textAlign: "center" }}>
                      {error}
                    </p>
                  )}

                  <button
                    onClick={handleSignIn}
                    disabled={signingIn}
                    style={{
                      width: "100%",
                      background: signingIn ? "rgba(182,255,0,0.6)" : "#B6FF00",
                      border: "none",
                      borderRadius: 8,
                      padding: "1rem",
                      fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)",
                      fontSize: "1.05rem",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#0D0D0D",
                      cursor: signingIn ? "not-allowed" : "pointer",
                    }}
                  >
                    {signingIn ? "Signing in…" : "Sign in to continue"}
                  </button>
                </div>
              </>
            ) : (
              /* ── Step 2: confirm + delete ──────────────────────────────── */
              <>
                <div
                  style={{
                    background: "rgba(255,107,107,0.08)",
                    border: "1px solid rgba(255,107,107,0.25)",
                    borderRadius: 8,
                    padding: "0.9rem 1rem",
                    marginBottom: "1.25rem",
                  }}
                >
                  <p style={{ fontSize: "0.78rem", color: "#9CA3AF", marginBottom: "0.25rem" }}>
                    Signed in as
                  </p>
                  <p style={{ fontSize: "0.95rem", color: "#fff", fontWeight: 600, wordBreak: "break-all" }}>
                    {user.email}
                  </p>
                </div>

                <ul
                  style={{
                    listStyle: "none",
                    fontSize: "0.85rem",
                    color: "#9CA3AF",
                    marginBottom: "1.5rem",
                    lineHeight: 1.7,
                  }}
                >
                  <li>• Your profile, posts, and stories will be removed</li>
                  <li>• Sessions you hosted will be deleted (participants notified)</li>
                  <li>• Wallet balance and pending payouts will be forfeited</li>
                  <li>• Chat history and ratings you wrote will be removed</li>
                </ul>

                <div>
                  <label htmlFor="del-confirm" style={labelStyle}>
                    Type <span style={{ color: "#ff6b6b" }}>DELETE</span> to confirm
                  </label>
                  <input
                    id="del-confirm"
                    type="text"
                    autoComplete="off"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleDelete()}
                    style={inputStyle}
                    placeholder="DELETE"
                  />
                </div>

                {error && (
                  <p role="alert" style={{ fontSize: "0.82rem", color: "#ff6b6b", textAlign: "center", marginTop: "0.9rem" }}>
                    {error}
                  </p>
                )}

                <button
                  onClick={handleDelete}
                  disabled={deleting || confirmText !== "DELETE"}
                  style={{
                    width: "100%",
                    background:
                      deleting || confirmText !== "DELETE"
                        ? "rgba(255,107,107,0.4)"
                        : "#ff6b6b",
                    border: "none",
                    borderRadius: 8,
                    padding: "1rem",
                    fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)",
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#0D0D0D",
                    cursor:
                      deleting || confirmText !== "DELETE" ? "not-allowed" : "pointer",
                    marginTop: "1.25rem",
                  }}
                >
                  {deleting ? "Deleting your account…" : "Permanently delete my account"}
                </button>

                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.push("/");
                  }}
                  disabled={deleting}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    padding: "0.85rem",
                    fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
                    fontSize: "0.85rem",
                    color: "#9CA3AF",
                    cursor: deleting ? "not-allowed" : "pointer",
                    marginTop: "0.75rem",
                  }}
                >
                  Cancel — keep my account
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
