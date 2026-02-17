import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServiceClient } from "@/lib/supabase/server"

async function getStripeKeys(supabase: any) {
  const { data } = await supabase
    .from("platform_settings")
    .select("key, value")
    .in("key", ["stripe_secret_key"])

  const keys: Record<string, string> = {}
  data?.forEach((s: any) => {
    let val = s.value
    if (typeof val === "string" && val.startsWith('"') && val.endsWith('"')) {
      try { val = JSON.parse(val) } catch { /* keep as-is */ }
    }
    keys[s.key] = val
  })

  return keys
}

export async function POST(request: NextRequest) {
  try {
    const { org_id } = await request.json()

    if (!org_id) {
      return NextResponse.json({ error: "org_id is required" }, { status: 400 })
    }

    const supabase = createServiceClient()

    const stripeKeys = await getStripeKeys(supabase)
    if (!stripeKeys.stripe_secret_key) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 })
    }

    const stripe = new Stripe(stripeKeys.stripe_secret_key, { apiVersion: "2026-01-28.clover" })

    // Get the org's Stripe customer ID
    let customerId: string | null = null
    try {
      const { data: org } = await supabase
        .from("organizations")
        .select("stripe_customer_id")
        .eq("id", org_id)
        .single()
      customerId = org?.stripe_customer_id || null
    } catch {
      // Column may not exist
    }

    if (!customerId) {
      return NextResponse.json({ error: "No active Stripe subscription found. Please subscribe first." }, { status: 400 })
    }

    const origin = request.headers.get("origin") || request.nextUrl.origin

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/org/billing`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error: any) {
    console.error("Stripe portal error:", error)
    return NextResponse.json({ error: error.message || "Failed to create portal session" }, { status: 500 })
  }
}
