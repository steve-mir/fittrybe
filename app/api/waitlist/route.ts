/**
 * ─── POST /api/waitlist ───────────────────────────────────────────────────────
 *
 * 1. Validates payload (name, email)
 * 2. Checks for duplicate email in Supabase
 * 3. Writes new waitlist row
 * 4. Sends branded confirmation email via Resend
 * 5. Fires Meta Conversions API `Lead` event server-side
 *
 * Required env vars:
 *   RESEND_API_KEY          — from resend.com dashboard
 *   RESEND_FROM_EMAIL       — e.g. "Fittrybe <hello@fittrybe.co.uk>"  (must be a verified domain)
 *   META_PIXEL_ID           — Meta Pixel ID (1461832162343936)
 *   META_CAPI_ACCESS_TOKEN  — Generated from Events Manager → Settings → Conversions API
 *   META_CAPI_TEST_EVENT_CODE — Optional: for testing only (remove in production)
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";
import crypto from "crypto";

/* ─── Resend (email) ──────────────────────────────────────────────────────── */

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Resend] RESEND_API_KEY is not set; skipping confirmation emails.");
    return null;
  }
  return new Resend(apiKey);
}

async function sendConfirmationEmail(name: string, to: string) {
  const resend = getResendClient();
  if (!resend) {
    console.warn("[Resend] Skipping — no API key");
    return;
  }

  console.log("[Resend] Sending confirmation to:", to);

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "Fittrybe <onboarding@resend.dev>",
    to,
    subject: `You're on the Fittrybe waitlist, ${name.split(" ")[0]}! 🎉`,
    html: buildEmailHtml(name),
  });

  if (error) {
    console.error("[Resend] Error:", error);
  } else {
    console.log("[Resend] Sent successfully:", data?.id);
  }
}

/* ─── Meta Conversions API (Lead event) ──────────────────────────────────── */

const sha256 = (value: string): string =>
  crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");

async function sendLeadToMeta(
  email: string,
  fullName: string,
  req: NextRequest
): Promise<void> {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  const testEventCode = process.env.META_CAPI_TEST_EVENT_CODE;

  if (!pixelId || !accessToken) {
    console.warn("[Meta CAPI] Missing env vars — skipping Lead event");
    return;
  }

  const [firstName, ...rest] = fullName.trim().split(/\s+/);
  const lastName = rest.join(" ");

  const userAgent = req.headers.get("user-agent") ?? "";
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "";

  // Meta's browser pixel sets _fbp and _fbc cookies — forward them to improve match quality
  const fbp = req.cookies.get("_fbp")?.value;
  const fbc = req.cookies.get("_fbc")?.value;

  const payload = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: `lead_${email}_${Date.now()}`, // for deduplication
        action_source: "website",
        event_source_url: "https://fittrybe.co.uk/waitlist",
        user_data: {
          em: [sha256(email)],
          ...(firstName ? { fn: [sha256(firstName)] } : {}),
          ...(lastName ? { ln: [sha256(lastName)] } : {}),
          ...(clientIp ? { client_ip_address: clientIp } : {}),
          ...(userAgent ? { client_user_agent: userAgent } : {}),
          ...(fbp ? { fbp } : {}),
          ...(fbc ? { fbc } : {}),
        },
        custom_data: {
          content_name: "Waitlist Signup",
          content_category: "waitlist",
          currency: "GBP",
          value: 0,
        },
      },
    ],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error("[Meta CAPI] Non-OK response:", response.status, errBody);
    } else {
      console.log("[Meta CAPI] Lead event sent for:", email);
    }
  } catch (err) {
    // Don't fail the signup if tracking fails
    console.error("[Meta CAPI] Lead event threw:", err);
  }
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildEmailHtml(name: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're on the Fittrybe waitlist!</title>
</head>
<body style="margin:0;padding:0;background:#0D0D0D;font-family:'DM Sans',Arial,sans-serif;color:#fff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D0D;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">

          <!-- Header bar -->
          <tr>
            <td style="background:#B6FF00;padding:6px 32px;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#0D0D0D;">
                Early Access Confirmed
              </p>
            </td>
          </tr>

          <!-- Logo + hero -->
          <tr>
            <td style="padding:40px 40px 0;text-align:center;">
              <p style="margin:0 0 24px;font-size:32px;font-weight:900;letter-spacing:-0.02em;text-transform:uppercase;line-height:1;">
                <span style="color:#fff;">fit</span><span style="color:#B6FF00;">trybe</span>
              </p>
              <h1 style="margin:0 0 12px;font-size:36px;font-weight:900;letter-spacing:-0.02em;text-transform:uppercase;line-height:1.1;color:#fff;">
                You're <span style="color:#B6FF00;">In,</span><br/>${name.split(" ")[0]}! 🎉
              </h1>
              <p style="margin:0;font-size:15px;color:#6B7280;line-height:1.7;">
                Welcome to the Fittrybe waitlist. We'll notify you<br/>the moment we launch local sports sessions in your city.
              </p>
            </td>
          </tr>

          <!-- What happens next -->
          <tr>
            <td style="padding:32px 40px 0;">
              <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#4B5563;">
                What happens next
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${[
                  ["🏟️", "City launch", "We'll email you the moment Fittrybe goes live in your area."],
                  ["⚡", "Early access", "Waitlist members get first access — before the public launch."],
                  ["🤝", "Find your trybe", "Browse real sessions, join teams, and play the sports you love."],
                ].map(([icon, title, desc]) => `
                <tr>
                  <td style="padding:8px 0;vertical-align:top;width:36px;font-size:18px;">${icon}</td>
                  <td style="padding:8px 0;vertical-align:top;">
                    <p style="margin:0;font-size:13px;font-weight:700;color:#fff;">${title}</p>
                    <p style="margin:2px 0 0;font-size:13px;color:#6B7280;">${desc}</p>
                  </td>
                </tr>`).join("")}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:32px 40px;text-align:center;">
              <a href="https://fittrybe.co.uk" style="display:inline-block;background:#B6FF00;color:#0D0D0D;font-size:14px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;padding:14px 32px;border-radius:8px;">
                Explore Fittrybe →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid rgba(255,255,255,0.06);padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#374151;">
                You're receiving this because you joined the Fittrybe waitlist.
              </p>
              <p style="margin:0;font-size:12px;color:#374151;">
                © ${new Date().getFullYear()} Fittrybe. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ─── Route handler ───────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email } = body as { name?: string; email?: string };

    // ── Validate ──────────────────────────────────────────────────────────────
    if (!name?.trim()) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    }
    if (!email?.trim() || !isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    // ── Duplicate check ───────────────────────────────────────────────────────
    const { data: existing } = await supabase
      .from("waitlist")
      .select("id")
      .eq("email", cleanEmail)
      .single();

    if (existing) {
      return NextResponse.json({ error: "already_exists" }, { status: 409 });
    }

    // ── Write to Supabase ─────────────────────────────────────────────────────
    const { data: docRef, error: insertError } = await supabase
      .from("waitlist")
      .insert({
        name: cleanName,
        email: cleanEmail,
        createdAt: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    // ── Side effects: email + Meta CAPI (fire-and-forget, don't block response) ──
    // Run in parallel for faster response time
    await Promise.all([
      sendConfirmationEmail(cleanName, cleanEmail),
      sendLeadToMeta(cleanEmail, cleanName, req),
    ]);

    return NextResponse.json({ success: true, id: docRef?.id }, { status: 201 });
  } catch (err) {
    console.error("[/api/waitlist] Unexpected error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
