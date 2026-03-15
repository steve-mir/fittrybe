/**
 * ─── POST /api/waitlist ───────────────────────────────────────────────────────
 *
 * 1. Validates payload (name, email, sports)
 * 2. Checks for duplicate email in Firestore
 * 3. Writes new waitlist doc
 * 4. Sends branded confirmation email via Resend
 *
 * Required env vars:
 *   RESEND_API_KEY      — from resend.com dashboard
 *   RESEND_FROM_EMAIL   — e.g. "Fittrybe <hello@fittrybe.com>"  (must be a verified domain)
 */

import { NextRequest, NextResponse } from "next/server";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Resend } from "resend";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Resend] RESEND_API_KEY is not set; skipping confirmation emails.");
    return null;
  }
  return new Resend(apiKey);
}

async function sendConfirmationEmail(name: string, to: string, sports: string[]) {
  const resend = getResendClient();
  if (!resend) return;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Fittrybe <hello@fittrybe.com>",
      to,
      subject: `You're on the Fittrybe waitlist, ${name.split(" ")[0]}! 🎉`,
      html: buildEmailHtml(name, sports),
    });
  } catch (err) {
    console.error("[Resend] Failed to send confirmation email:", err);
  }
}

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildEmailHtml(name: string, sports: string[]): string {
  const sportsList = sports.length
    ? sports.map(s => `<li style="margin:4px 0;">${s}</li>`).join("")
    : "<li>All sports</li>";

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

          <!-- Sports card -->
          <tr>
            <td style="padding:32px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(182,255,0,0.04);border:1px solid rgba(182,255,0,0.12);border-radius:12px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#B6FF00;">
                      Your Sports
                    </p>
                    <ul style="margin:0;padding:0 0 0 18px;font-size:14px;color:#d1d5db;line-height:1.8;">
                      ${sportsList}
                    </ul>
                  </td>
                </tr>
              </table>
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
              <a href="https://fittrybe.com" style="display:inline-block;background:#B6FF00;color:#0D0D0D;font-size:14px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;padding:14px 32px;border-radius:8px;">
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

/* ─── route handler ───────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, sports } = body as {
      name?: string;
      email?: string;
      sports?: string[];
    };

    // ── Validate ──────────────────────────────────────────────────────────────
    if (!name?.trim()) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    }
    if (!email?.trim() || !isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!sports || sports.length === 0) {
      return NextResponse.json({ error: "Please select at least one sport." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    // ── Duplicate check ───────────────────────────────────────────────────────
    const q = query(collection(db, "waitlist"), where("email", "==", cleanEmail));
    const existing = await getDocs(q);
    if (!existing.empty) {
      return NextResponse.json({ error: "already_exists" }, { status: 409 });
    }

    // ── Write to Firestore ────────────────────────────────────────────────────
    const docRef = await addDoc(collection(db, "waitlist"), {
      name: cleanName,
      email: cleanEmail,
      sports,
      createdAt: serverTimestamp(),
    });

    // ── Send confirmation email (fire-and-forget) ─────────────────────────────
    void sendConfirmationEmail(cleanName, cleanEmail, sports);

    return NextResponse.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (err) {
    console.error("[/api/waitlist] Unexpected error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}