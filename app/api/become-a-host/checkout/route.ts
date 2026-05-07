/**
 * ─── POST /api/become-a-host/checkout ─────────────────────────────────────────
 *
 * Creates a Stripe Checkout subscription session for the verified-host plan
 * and returns the redirect URL. The actual subscription side-effects
 * (flipping profiles.is_verified / partner_host) happen in the webhook.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY        — sk_live_… / sk_test_…
 *   STRIPE_HOST_PRICE_ID     — Stripe price id for the £9.99/mo plan
 *   NEXT_PUBLIC_SITE_URL     — already used elsewhere; e.g. https://fittrybe.co.uk
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function getSiteUrl(req: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  // Fallback: derive from the incoming request (works on Vercel preview URLs)
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("host");
  return host ? `${proto}://${host}` : "https://fittrybe.co.uk";
}

export async function POST(req: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_HOST_PRICE_ID;
    if (!secretKey) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
    }
    if (!priceId) {
      return NextResponse.json({ error: "Host plan is not configured." }, { status: 500 });
    }

    const { user, error: authError } = await resolveUser(req);
    if (!user) {
      return NextResponse.json({ error: authError ?? "Not signed in" }, { status: 401 });
    }

    const stripe = new Stripe(secretKey);
    const siteUrl = getSiteUrl(req);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      // Tie the Checkout session and the resulting subscription back to our
      // Supabase user.id so the webhook can update the right profile.
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
      metadata: { supabase_user_id: user.id },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      success_url: `${siteUrl}/become-a-host/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/become-a-host?step=checkout&cancelled=1`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
    }

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not start checkout. Please try again.";
    console.error("[/api/become-a-host/checkout] Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
