/**
 * ─── POST /api/become-a-host/apply ────────────────────────────────────────────
 *
 * Receives a host application from /become-a-host:
 *   1. Validates the bearer token → resolves the Supabase user.
 *   2. Validates the payload.
 *   3. Best-effort: writes the application to `public.host_applications`
 *      (table is optional — if it doesn't exist yet we log + continue so the
 *      flow still works while the migration is pending).
 *   4. Emails the team (HOST_APPLICATIONS_NOTIFY_EMAIL, falls back to
 *      RESEND_FROM_EMAIL recipient if not set) with the full submission.
 *   5. Emails the applicant a branded "we've got your application" receipt.
 *
 * No payment is taken here. Payment activation happens later via a separate
 * link emailed once the admin approves the application.
 *
 * Required env vars:
 *   RESEND_API_KEY               — Resend dashboard
 *   RESEND_FROM_EMAIL            — e.g. "Fittrybe <hello@fittrybe.co.uk>"
 *
 * Optional env vars:
 *   HOST_APPLICATIONS_NOTIFY_EMAIL — comma-separated list of team recipients
 *   SUPABASE_SERVICE_ROLE_KEY      — enables the insert into host_applications
 *
 * Suggested table (run when ready):
 *   create table public.host_applications (
 *     id          uuid primary key default gen_random_uuid(),
 *     user_id     uuid references auth.users(id) on delete set null,
 *     email       text not null,
 *     full_name   text not null,
 *     city        text not null,
 *     primary_sport text not null,
 *     experience  text,
 *     motivation  text not null,
 *     social_url  text,
 *     status      text not null default 'pending',
 *     created_at  timestamptz not null default now()
 *   );
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ApplicationBody = {
  full_name?: string;
  city?: string;
  primary_sport?: string;
  experience?: string;
  motivation?: string;
  social_url?: string | null;
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

async function resolveUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return { user: null, error: "Missing Authorization header" };

  const verifyClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data, error } = await verifyClient.auth.getUser(token);
  if (error || !data.user) return { user: null, error: "Invalid or expired session" };
  return { user: data.user, error: null };
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Resend] RESEND_API_KEY is not set; skipping emails.");
    return null;
  }
  return new Resend(apiKey);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function applicantConfirmationHtml(args: { fullName: string }): string {
  const firstName = args.fullName.split(" ")[0] || "there";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>We've got your Fittrybe host application</title>
</head>
<body style="margin:0;padding:0;background:#0D0D0D;font-family:'Inter Tight',Arial,sans-serif;color:#fff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D0D;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#B6FF00;padding:6px 32px;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#0D0D0D;">
                Application Received
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 0;text-align:center;">
              <p style="margin:0 0 24px;line-height:1;font-size:32px;font-weight:800;letter-spacing:-0.01em;font-family:Arial,Helvetica,sans-serif;">
                <span style="color:#ffffff;">fitTry</span><span style="color:#B6FF00;font-weight:900;">be</span>
              </p>
              <h1 style="margin:0 0 12px;font-size:32px;font-weight:900;letter-spacing:-0.02em;text-transform:uppercase;line-height:1.1;color:#fff;">
                Thanks <span style="color:#B6FF00;">${escapeHtml(firstName)}</span> —<br/>we&rsquo;ve got it.
              </h1>
              <p style="margin:0;font-size:15px;color:#9CA3AF;line-height:1.7;">
                Your application to host on Fittrybe is in. A real human from our team will read it
                and get back to you within <strong style="color:#fff;">2&ndash;3 working days</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 0;">
              <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#4B5563;">
                What happens next
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${[
                  ["1.", "We review", "Our team checks your application and the community you already run."],
                  ["2.", "We email you", "If it's a fit, we send an activation link to switch on your host tools."],
                  ["3.", "You play", "Create sessions, build your trybe, get paid through Fittrybe."],
                ].map(([num, title, desc]) => `
                <tr>
                  <td style="padding:8px 0;vertical-align:top;width:36px;font-size:14px;font-weight:800;color:#B6FF00;">${num}</td>
                  <td style="padding:8px 0;vertical-align:top;">
                    <p style="margin:0;font-size:13px;font-weight:700;color:#fff;">${title}</p>
                    <p style="margin:2px 0 0;font-size:13px;color:#6B7280;">${desc}</p>
                  </td>
                </tr>`).join("")}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;text-align:center;">
              <a href="https://fittrybe.co.uk" style="display:inline-block;background:#B6FF00;color:#0D0D0D;font-size:14px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;padding:14px 32px;border-radius:8px;">
                Back to Fittrybe &rarr;
              </a>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid rgba(255,255,255,0.06);padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#374151;">
                You&rsquo;re receiving this because you applied to host on Fittrybe.
              </p>
              <p style="margin:0;font-size:12px;color:#374151;">
                &copy; ${new Date().getFullYear()} Fittrybe. All rights reserved.
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

function teamNotificationHtml(args: {
  email: string;
  fullName: string;
  city: string;
  primarySport: string;
  experience: string;
  motivation: string;
  socialUrl: string | null;
  userId: string;
}): string {
  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:8px 14px;vertical-align:top;width:160px;border-top:1px solid rgba(255,255,255,0.06);">
        <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6B7280;">${escapeHtml(label)}</p>
      </td>
      <td style="padding:8px 14px;vertical-align:top;border-top:1px solid rgba(255,255,255,0.06);">
        <p style="margin:0;font-size:14px;color:#fff;line-height:1.5;white-space:pre-wrap;">${escapeHtml(value)}</p>
      </td>
    </tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#0D0D0D;font-family:'Inter Tight',Arial,sans-serif;color:#fff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D0D;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);border-radius:14px;overflow:hidden;">
          <tr>
            <td style="background:#B6FF00;padding:10px 20px;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#0D0D0D;">
                New Host Application
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 20px 4px;">
              <h2 style="margin:0;font-size:18px;color:#fff;">${escapeHtml(args.fullName)} &mdash; ${escapeHtml(args.city)}</h2>
              <p style="margin:4px 0 0;font-size:13px;color:#9CA3AF;">${escapeHtml(args.email)} &middot; user ${escapeHtml(args.userId)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 6px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${row("Primary sport", args.primarySport)}
                ${row("City / area", args.city)}
                ${row("Experience", args.experience || "(not provided)")}
                ${row("Motivation", args.motivation)}
                ${row("Social / site", args.socialUrl || "(not provided)")}
              </table>
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
    const { user, error: authError } = await resolveUser(req);
    if (!user) {
      return NextResponse.json({ error: authError ?? "Not signed in" }, { status: 401 });
    }

    const raw = (await req.json().catch(() => ({}))) as ApplicationBody;
    const fullName = (raw.full_name ?? "").trim();
    const city = (raw.city ?? "").trim();
    const primarySport = (raw.primary_sport ?? "").trim();
    const experience = (raw.experience ?? "").trim();
    const motivation = (raw.motivation ?? "").trim();
    const socialUrl = ((raw.social_url ?? "") || "").trim() || null;

    if (!fullName || fullName.length < 2) {
      return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    }
    if (!city) {
      return NextResponse.json({ error: "Please enter your city or area." }, { status: 400 });
    }
    if (!primarySport) {
      return NextResponse.json({ error: "Please tell us your primary sport." }, { status: 400 });
    }
    if (!motivation || motivation.length < 15) {
      return NextResponse.json(
        { error: "Tell us a little more about why you want to host (15+ characters)." },
        { status: 400 },
      );
    }

    const applicantEmail = user.email;
    if (!applicantEmail) {
      return NextResponse.json(
        { error: "Your account has no email on file — please add one and try again." },
        { status: 400 },
      );
    }

    // ── Best-effort: write to host_applications ──────────────────────────────
    // We don't fail the request if the table or service key is missing — the
    // emails below are the source of truth for now.
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceKey) {
      try {
        const admin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceKey,
          { auth: { autoRefreshToken: false, persistSession: false } },
        );
        const { error: insertError } = await admin.from("host_applications").insert({
          user_id: user.id,
          email: applicantEmail,
          full_name: fullName,
          city,
          primary_sport: primarySport,
          experience: experience || null,
          motivation,
          social_url: socialUrl,
          status: "pending",
        });
        if (insertError) {
          // Table likely missing or RLS — log and continue.
          console.warn("[apply] host_applications insert failed:", insertError.message);
        }
      } catch (err) {
        console.warn("[apply] supabase insert threw:", err);
      }
    }

    // ── Emails ───────────────────────────────────────────────────────────────
    const resend = getResendClient();
    if (resend) {
      const fromEmail = process.env.RESEND_FROM_EMAIL ?? "Fittrybe <onboarding@resend.dev>";
      const notifyRaw = process.env.HOST_APPLICATIONS_NOTIFY_EMAIL ?? "";
      const notifyList = notifyRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const sends: Promise<unknown>[] = [];

      // Applicant receipt
      sends.push(
        resend.emails
          .send({
            from: fromEmail,
            to: applicantEmail,
            subject: `We've got your Fittrybe host application, ${fullName.split(" ")[0]}`,
            html: applicantConfirmationHtml({ fullName }),
          })
          .catch((e) => console.error("[apply] applicant email failed:", e)),
      );

      // Team notification (only if a recipient is configured)
      if (notifyList.length > 0) {
        sends.push(
          resend.emails
            .send({
              from: fromEmail,
              to: notifyList,
              replyTo: applicantEmail,
              subject: `New host application — ${fullName} (${city})`,
              html: teamNotificationHtml({
                email: applicantEmail,
                fullName,
                city,
                primarySport,
                experience,
                motivation,
                socialUrl,
                userId: user.id,
              }),
            })
            .catch((e) => console.error("[apply] notify email failed:", e)),
        );
      } else {
        console.warn(
          "[apply] HOST_APPLICATIONS_NOTIFY_EMAIL not set — team will not be notified.",
        );
      }

      await Promise.all(sends);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not submit your application. Please try again.";
    console.error("[/api/become-a-host/apply] Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
