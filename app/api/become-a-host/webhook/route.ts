/**
 * ─── POST /api/become-a-host/webhook ──────────────────────────────────────────
 *
 * Stripe webhook for the verified-host subscription lifecycle. We listen for:
 *   • checkout.session.completed       → first-time subscription started
 *   • customer.subscription.updated    → renewal / status change
 *   • customer.subscription.deleted    → cancellation / payment failure
 *
 * On an active subscription we flip:
 *   profiles.is_verified   = true
 *   profiles.partner_host  = true
 *   profiles.account_tier  = "pro"
 *   profiles.tier_expires_at = current_period_end
 *
 * On cancellation / inactive state we set those back to free / null.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET   — from Stripe dashboard → Developers → Webhooks
 *   SUPABASE_SERVICE_ROLE_KEY (used by getSupabaseAdmin)
 *
 * Stripe configuration:
 *   Add an endpoint at /api/become-a-host/webhook subscribed to the three
 *   events above and paste the signing secret as STRIPE_WEBHOOK_SECRET.
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
// Stripe signature verification needs the raw bytes of the request body.
// Disable Next.js body parsing implicitly by reading req.text() ourselves.
export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

async function setHostStatus(
  userId: string,
  active: boolean,
  expiresAtUnix?: number | null,
) {
  const admin = getSupabaseAdmin();
  const update: Record<string, unknown> = active
    ? {
        is_verified: true,
        partner_host: true,
        verified_at: new Date().toISOString(),
        account_tier: "pro",
        tier_expires_at: expiresAtUnix ? new Date(expiresAtUnix * 1000).toISOString() : null,
      }
    : {
        is_verified: false,
        partner_host: false,
        account_tier: "free",
        tier_expires_at: null,
      };

  const { error } = await admin.from("profiles").update(update).eq("id", userId);
  if (error) {
    console.error(`[become-a-host/webhook] profile update failed for ${userId}:`, error);
    throw error;
  }
}

function resolveUserIdFromSubscription(sub: Stripe.Subscription): string | null {
  const meta = sub.metadata?.supabase_user_id;
  if (typeof meta === "string" && meta.length > 0) return meta;
  return null;
}

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 500 },
    );
  }

  const stripe = new Stripe(secretKey);
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[become-a-host/webhook] signature verification failed:", message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          (session.metadata?.supabase_user_id as string | undefined) ??
          (session.client_reference_id ?? null);
        if (!userId) {
          console.warn("[become-a-host/webhook] checkout.session.completed without user id");
          break;
        }
        // The session's subscription is created right around the same time;
        // pull it so we can use current_period_end.
        let expiresAt: number | null = null;
        if (typeof session.subscription === "string") {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          expiresAt = (sub as unknown as { current_period_end?: number }).current_period_end ?? null;
        }
        await setHostStatus(userId, true, expiresAt);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = resolveUserIdFromSubscription(sub);
        if (!userId) {
          console.warn("[become-a-host/webhook] subscription.updated without supabase_user_id metadata");
          break;
        }
        const isActive = ACTIVE_STATUSES.has(sub.status);
        const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end ?? null;
        await setHostStatus(userId, isActive, periodEnd);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = resolveUserIdFromSubscription(sub);
        if (!userId) {
          console.warn("[become-a-host/webhook] subscription.deleted without supabase_user_id metadata");
          break;
        }
        await setHostStatus(userId, false);
        break;
      }

      default:
        // Ignore everything else — keeps the endpoint quiet.
        break;
    }
  } catch (err) {
    console.error("[become-a-host/webhook] handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
