// app/test-email/page.tsx
"use client";

import { useState } from "react";

export default function TestEmailPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
    details?: Record<string, unknown>;
  } | null>(null);

  const testEmail = async () => {
    if (!email || !email.includes("@")) {
      setResult({
        success: false,
        error: "Please enter a valid email address",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log("📧 Sending test email to:", email);

      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log("📬 Response:", data);

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || "Email sent successfully!",
          details: data,
        });
      } else {
        setResult({
          success: false,
          error: data.error || "Failed to send email",
          details: data,
        });
      }
    } catch (error) {
      console.error("❌ Fetch error:", error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Network error",
        details: { error: String(error) },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      minHeight: "100vh",
      background: "#0D0D0D",
      color: "#fff",
      fontFamily: "'DM Sans', sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{
        maxWidth: 500,
        width: "100%",
        background: "#0a0a0a",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: "2.5rem",
      }}>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "2rem",
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "-0.02em",
          marginBottom: "1.5rem",
          textAlign: "center",
        }}>
          📧 <span style={{ color: "#B6FF00" }}>Email</span> Test
        </h1>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{
            display: "block",
            fontSize: "0.78rem",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "#4B5563",
            marginBottom: "0.4rem",
          }}>
            Test Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            onKeyDown={(e) => e.key === "Enter" && testEmail()}
            style={{
              width: "100%",
              background: "#111",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              padding: "0.85rem 1rem",
              color: "#fff",
              fontSize: "0.95rem",
              outline: "none",
            }}
          />
        </div>

        <button
          onClick={testEmail}
          disabled={loading}
          style={{
            width: "100%",
            background: loading ? "rgba(182,255,0,0.6)" : "#B6FF00",
            border: "none",
            borderRadius: 8,
            padding: "1rem",
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "1.05rem",
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#0D0D0D",
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: "1.5rem",
          }}
        >
          {loading ? "SENDING..." : "SEND TEST EMAIL"}
        </button>

        {/* Result Display */}
        {result && (
          <div style={{
            background: result.success 
              ? "rgba(182,255,0,0.05)" 
              : "rgba(255,107,107,0.1)",
            border: `1px solid ${
              result.success 
                ? "rgba(182,255,0,0.2)" 
                : "rgba(255,107,107,0.2)"
            }`,
            borderRadius: 8,
            padding: "1rem",
            marginTop: "1rem",
          }}>
            {result.success ? (
              <p style={{ color: "#B6FF00", marginBottom: "0.5rem", fontWeight: 600 }}>
                ✅ {result.message}
              </p>
            ) : (
              <p style={{ color: "#ff6b6b", marginBottom: "0.5rem", fontWeight: 600 }}>
                ❌ {result.error}
              </p>
            )}
            
            {/* Debug Details */}
            {result.details && (
              <details style={{ marginTop: "0.75rem" }}>
                <summary style={{
                  color: "#6B7280",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                }}>
                  Debug Details
                </summary>
                <pre style={{
                  background: "#111",
                  padding: "0.75rem",
                  borderRadius: 4,
                  fontSize: "0.75rem",
                  color: "#9CA3AF",
                  overflow: "auto",
                  marginTop: "0.5rem",
                  maxHeight: 300,
                }}>
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Environment Check */}
        <div style={{
          marginTop: "2rem",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingTop: "1rem",
        }}>
          <p style={{
            fontSize: "0.7rem",
            color: "#374151",
            textAlign: "center",
          }}>
            Make sure your .env.local has:<br/>
            RESEND_API_KEY=your_api_key_here<br/>
            RESEND_FROM_EMAIL=Fittrybe &lt;hello@fittrybe.co.uk&gt;
          </p>
        </div>
      </div>
    </main>
  );
}