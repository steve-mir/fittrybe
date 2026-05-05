/**
 * ─── POST /api/account/delete ────────────────────────────────────────────────
 *
 * Permanently deletes the authenticated user's account.
 *
 * Flow:
 *   1. Read Bearer token from Authorization header
 *   2. Verify it via Supabase → resolve userId
 *   3. Cross-check confirmation payload (must contain `confirm: "DELETE"` and
 *      the email matching the auth user)
 *   4. Cascade-delete every row that references this user
 *   5. Call supabaseAdmin.auth.admin.deleteUser(userId)
 *   6. Return { success: true }
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY  (server-only — Supabase dashboard → Settings → API)
 *
 * Note on financial / audit data:
 *   We DELETE wallets, payments, payout_requests, event_settlements,
 *   wallet_transactions, refund_events. If you must retain these for
 *   accounting compliance, anonymise the user_id (set to NULL) instead.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

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

// Wraps a delete/update so a single failing table doesn't strand the process.
// Supabase query builders are thenable (PromiseLike), not full Promises.
async function tryStep(
  label: string,
  fn: () => PromiseLike<{ error: unknown } | void>,
) {
  try {
    const res = await fn();
    if (res && typeof res === "object" && "error" in res && res.error) {
      console.error(`[delete-account] ${label}:`, res.error);
    }
  } catch (err) {
    console.error(`[delete-account] ${label} threw:`, err);
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await resolveUser(req);
  if (!user) {
    return NextResponse.json({ error: error ?? "Unauthorised" }, { status: 401 });
  }

  let body: { confirm?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.confirm !== "DELETE") {
    return NextResponse.json({ error: "Type DELETE to confirm." }, { status: 400 });
  }
  if (
    !body.email ||
    body.email.trim().toLowerCase() !== (user.email ?? "").toLowerCase()
  ) {
    return NextResponse.json(
      { error: "Email does not match the signed-in account." },
      { status: 400 },
    );
  }

  const uid = user.id;
  const sb = supabaseAdmin;

  // ── 1. Find sessions hosted by this user, plus their children ─────────────
  const { data: hostedSessions } = await sb
    .from("sessions")
    .select("id")
    .eq("host_id", uid);
  const sessionIds = (hostedSessions ?? []).map((s) => s.id);

  let chatIds: string[] = [];
  let bbDetailIds: string[] = [];
  if (sessionIds.length > 0) {
    const { data: chats } = await sb
      .from("chats")
      .select("id")
      .in("session_id", sessionIds);
    chatIds = (chats ?? []).map((c) => c.id);

    const { data: bb } = await sb
      .from("basketball_details")
      .select("id")
      .in("session_id", sessionIds);
    bbDetailIds = (bb ?? []).map((d) => d.id);
  }

  // ── 2. Reviews / votes / views / invites / posts / stories ────────────────
  await tryStep("session_post_match (own)", () =>
    sb.from("session_post_match").delete().eq("submitted_by", uid),
  );
  await tryStep("session_reviews (own)", () =>
    sb.from("session_reviews").delete().or(`reviewer_id.eq.${uid},host_id.eq.${uid}`),
  );
  await tryStep("session_views (own)", () =>
    sb.from("session_views").delete().eq("viewer_id", uid),
  );
  await tryStep("session_votes (own)", () =>
    sb.from("session_votes").delete().eq("user_id", uid),
  );
  await tryStep("session_invites (own)", () =>
    sb.from("session_invites").delete().or(`inviter_id.eq.${uid},invitee_id.eq.${uid}`),
  );
  await tryStep("stories (own)", () =>
    sb.from("stories").delete().eq("host_id", uid),
  );
  await tryStep("posts (own)", () =>
    sb.from("posts").delete().eq("user_id", uid),
  );

  // ── 3. Strikes / scores / reports / blocks ────────────────────────────────
  await tryStep("reliability_log", () =>
    sb.from("reliability_log").delete().eq("user_id", uid),
  );
  await tryStep("score_events", () =>
    sb.from("score_events").delete().eq("user_id", uid),
  );
  await tryStep("host_cancel_strikes", () =>
    sb.from("host_cancel_strikes").delete().eq("user_id", uid),
  );
  await tryStep("player_strikes", () =>
    sb.from("player_strikes").delete().eq("user_id", uid),
  );
  await tryStep("user_reports", () =>
    sb
      .from("user_reports")
      .delete()
      .or(`reporter_id.eq.${uid},reported_user_id.eq.${uid}`),
  );
  await tryStep("user_blocks", () =>
    sb
      .from("user_blocks")
      .delete()
      .or(`blocker_id.eq.${uid},blocked_user_id.eq.${uid}`),
  );

  // ── 4. Notifications / messaging / device tokens ──────────────────────────
  await tryStep("notifications", () =>
    sb.from("notifications").delete().eq("user_id", uid),
  );
  await tryStep("trybe_messages", () =>
    sb.from("trybe_messages").delete().eq("user_id", uid),
  );
  await tryStep("trybe_conversations", () =>
    sb.from("trybe_conversations").delete().eq("user_id", uid),
  );
  await tryStep("device_tokens", () =>
    sb.from("device_tokens").delete().eq("user_id", uid),
  );
  await tryStep("chat_messages (own)", () =>
    sb.from("chat_messages").delete().eq("user_id", uid),
  );
  await tryStep("chat_mutes", () =>
    sb.from("chat_mutes").delete().eq("user_id", uid),
  );
  await tryStep("chat_participants (own)", () =>
    sb.from("chat_participants").delete().eq("user_id", uid),
  );
  await tryStep("chats.created_by → null", () =>
    sb.from("chats").update({ created_by: null }).eq("created_by", uid),
  );

  // ── 5. Challenges / interests / location / play profile ───────────────────
  await tryStep("challenges", () =>
    sb.from("challenges").delete().or(`sender_id.eq.${uid},recipient_id.eq.${uid}`),
  );
  await tryStep("user_interests", () =>
    sb.from("user_interests").delete().eq("user_id", uid),
  );
  await tryStep("user_locations", () =>
    sb.from("user_locations").delete().eq("user_id", uid),
  );
  await tryStep("user_play_profile", () =>
    sb.from("user_play_profile").delete().eq("user_id", uid),
  );

  // ── 6. Event participation & registrations ────────────────────────────────
  await tryStep("registrations (own)", () =>
    sb.from("registrations").delete().eq("user_id", uid),
  );
  await tryStep("event_participants (own)", () =>
    sb.from("event_participants").delete().eq("user_id", uid),
  );
  await tryStep("event_participants.approved_by → null", () =>
    sb.from("event_participants").update({ approved_by: null }).eq("approved_by", uid),
  );
  await tryStep("event_participants.invited_by → null", () =>
    sb.from("event_participants").update({ invited_by: null }).eq("invited_by", uid),
  );
  await tryStep("event_participants.plus_one_of → null", () =>
    sb.from("event_participants").update({ plus_one_of: null }).eq("plus_one_of", uid),
  );

  // ── 7. Basketball players (own + clear approved_by elsewhere) ─────────────
  await tryStep("basketball_players (own)", () =>
    sb.from("basketball_players").delete().eq("user_id", uid),
  );
  await tryStep("basketball_players.approved_by → null", () =>
    sb.from("basketball_players").update({ approved_by: null }).eq("approved_by", uid),
  );

  // ── 8. Financial / audit (DELETE — anonymise instead if compliance needs) ─
  await tryStep("event_settlements (own)", () =>
    sb.from("event_settlements").delete().eq("recipient_id", uid),
  );
  await tryStep("refund_events", () =>
    sb.from("refund_events").delete().or(`user_id.eq.${uid},host_id.eq.${uid}`),
  );
  await tryStep("payments", () =>
    sb.from("payments").delete().eq("user_id", uid),
  );
  await tryStep("payout_requests", () =>
    sb.from("payout_requests").delete().eq("user_id", uid),
  );
  await tryStep("wallet_transactions", () =>
    sb.from("wallet_transactions").delete().eq("user_id", uid),
  );
  await tryStep("wallets", () =>
    sb.from("wallets").delete().eq("user_id", uid),
  );

  // ── 9. Email logs ─────────────────────────────────────────────────────────
  await tryStep("email_log", () =>
    sb.from("email_log").delete().eq("user_id", uid),
  );
  await tryStep("scheduled_emails", () =>
    sb.from("scheduled_emails").delete().eq("user_id", uid),
  );

  // ── 10. Hosted sessions and their children ────────────────────────────────
  if (sessionIds.length > 0) {
    await tryStep("hosted: session_post_match", () =>
      sb.from("session_post_match").delete().in("session_id", sessionIds),
    );
    await tryStep("hosted: session_reviews", () =>
      sb.from("session_reviews").delete().in("session_id", sessionIds),
    );
    await tryStep("hosted: session_views", () =>
      sb.from("session_views").delete().in("session_id", sessionIds),
    );
    await tryStep("hosted: session_votes", () =>
      sb.from("session_votes").delete().in("session_id", sessionIds),
    );
    await tryStep("hosted: session_invites", () =>
      sb.from("session_invites").delete().in("session_id", sessionIds),
    );
    await tryStep("hosted: stories", () =>
      sb.from("stories").delete().in("session_id", sessionIds),
    );
    await tryStep("hosted: event_participants", () =>
      sb.from("event_participants").delete().in("session_id", sessionIds),
    );
    await tryStep("hosted: registrations", () =>
      sb.from("registrations").delete().in("session_id", sessionIds),
    );
    await tryStep("hosted: event_settlements", () =>
      sb.from("event_settlements").delete().in("session_id", sessionIds),
    );
    await tryStep("hosted: refund_events", () =>
      sb.from("refund_events").delete().in("session_id", sessionIds),
    );
    await tryStep("hosted: payments", () =>
      sb.from("payments").delete().in("session_id", sessionIds),
    );
    await tryStep("hosted: email_log", () =>
      sb.from("email_log").delete().in("session_id", sessionIds),
    );
    await tryStep("hosted: reliability_log", () =>
      sb.from("reliability_log").delete().in("session_id", sessionIds),
    );
    await tryStep("hosted: host_cancel_strikes", () =>
      sb.from("host_cancel_strikes").delete().in("session_id", sessionIds),
    );
    await tryStep("hosted: player_strikes", () =>
      sb.from("player_strikes").delete().in("session_id", sessionIds),
    );

    if (bbDetailIds.length > 0) {
      await tryStep("hosted: basketball_players (other players)", () =>
        sb.from("basketball_players").delete().in("basketball_detail_id", bbDetailIds),
      );
    }

    await tryStep("hosted: basketball_details", () =>
      sb.from("basketball_details").delete().in("session_id", sessionIds),
    );
    await tryStep("hosted: football_details", () =>
      sb.from("football_details").delete().in("session_id", sessionIds),
    );
    await tryStep("hosted: running_details", () =>
      sb.from("running_details").delete().in("session_id", sessionIds),
    );
    await tryStep("hosted: cycling_details", () =>
      sb.from("cycling_details").delete().in("session_id", sessionIds),
    );
    await tryStep("hosted: gym_details", () =>
      sb.from("gym_details").delete().in("session_id", sessionIds),
    );
    await tryStep("hosted: racket_details", () =>
      sb.from("racket_details").delete().in("session_id", sessionIds),
    );

    if (chatIds.length > 0) {
      await tryStep("hosted: chat_messages", () =>
        sb.from("chat_messages").delete().in("chat_id", chatIds),
      );
      await tryStep("hosted: chat_participants", () =>
        sb.from("chat_participants").delete().in("chat_id", chatIds),
      );
      await tryStep("hosted: chat_mutes", () =>
        sb.from("chat_mutes").delete().in("chat_id", chatIds),
      );
    }
    await tryStep("hosted: chats", () =>
      sb.from("chats").delete().in("session_id", sessionIds),
    );
    await tryStep("hosted: posts", () =>
      sb.from("posts").delete().in("session_id", sessionIds),
    );

    // Child (recurring) sessions before parents
    await tryStep("hosted: child sessions", () =>
      sb.from("sessions").delete().in("parent_session_id", sessionIds),
    );
    await tryStep("hosted: sessions", () =>
      sb.from("sessions").delete().in("id", sessionIds),
    );
  }

  // ── 11. Cross-references that may still point at uid ──────────────────────
  await tryStep("sessions.mvp_player_id → null", () =>
    sb.from("sessions").update({ mvp_player_id: null }).eq("mvp_player_id", uid),
  );
  await tryStep("basketball_details.mvp_player_id → null", () =>
    sb.from("basketball_details").update({ mvp_player_id: null }).eq("mvp_player_id", uid),
  );
  for (const col of ["player_a_id", "player_b_id", "player_a2_id", "player_b2_id"]) {
    await tryStep(`racket_details.${col} → null`, () =>
      sb.from("racket_details").update({ [col]: null }).eq(col, uid),
    );
  }

  // ── 12. Profile (FK auth.users — must drop before deleting auth user) ────
  await tryStep("profiles", () =>
    sb.from("profiles").delete().eq("id", uid),
  );

  // ── 13. The actual auth user ─────────────────────────────────────────────
  const { error: deleteAuthError } = await sb.auth.admin.deleteUser(uid);
  if (deleteAuthError) {
    console.error("[delete-account] auth.admin.deleteUser failed:", deleteAuthError);
    return NextResponse.json(
      {
        error:
          "We removed your data but could not delete your auth record. Please contact support.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
