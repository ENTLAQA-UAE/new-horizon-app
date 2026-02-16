import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServiceClient } from "@/lib/supabase/server"

async function getStripeKeys(supabase: any) {
  const { data } = await supabase
    .from("platform_settings")
    .select("key, value")
    .in("key", ["stripe_secret_key", "stripe_publishable_key"])

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
    const { org_id, tier_id, billing_cycle } = await request.json()

    if (!org_id || !tier_id) {
      return NextResponse.json({ error: "org_id and tier_id are required" }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Get Stripe keys from platform_settings
    const stripeKeys = await getStripeKeys(supabase)
    if (!stripeKeys.stripe_secret_key) {
      return NextResponse.json({ error: "Stripe is not configured. Contact your administrator." }, { status: 500 })
    }

    const stripe = new Stripe(stripeKeys.stripe_secret_key, { apiVersion: "2026-01-28.clover" })

    // Get organization details
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, slug")
      .eq("id", org_id)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Get tier details
    const { data: tier, error: tierError } = await supabase
      .from("subscription_tiers")
      .select("*")
      .eq("id", tier_id)
      .single()

    if (tierError || !tier) {
      return NextResponse.json({ error: "Subscription tier not found" }, { status: 404 })
    }

    // Try to get existing Stripe customer ID (column may not exist yet)
    let customerId: string | null = null
    try {
      const { data: stripeData } = await supabase
        .from("organizations")
        .select("stripe_customer_id")
        .eq("id", org_id)
        .single()
      customerId = stripeData?.stripe_customer_id || null
    } catch {
      // Column may not exist yet - that's fine, we'll create a new customer
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        name: org.name,
        metadata: {
          org_id: org.id,
          org_slug: org.slug,
        },
      })
      customerId = customer.id

      // Save customer ID to org
      await supabase
        .from("organizations")
        .update({ stripe_customer_id: customerId })
        .eq("id", org.id)
    }

    // Determine price and Stripe interval based on billing cycle
    const cycle = ["monthly", "quarterly", "annually"].includes(billing_cycle)
      ? (billing_cycle as "monthly" | "quarterly" | "annually")
      : "monthly"

    let amount: number
    let interval: "month" | "year"
    let intervalCount: number
    let cycleLabel: string

    switch (cycle) {
      case "annually":
        amount = Math.round((tier.price_yearly || tier.price_monthly * 12) * 100)
        interval = "year"
        intervalCount = 1
        cycleLabel = "Annual"
        break
      case "quarterly":
        // 10% quarterly discount (same as shown in billing UI)
        amount = Math.round(tier.price_monthly * 3 * 0.9 * 100)
        interval = "month"
        intervalCount = 3
        cycleLabel = "Quarterly"
        break
      default:
        amount = Math.round(tier.price_monthly * 100)
        interval = "month"
        intervalCount = 1
        cycleLabel = "Monthly"
    }

    const currencyMap: Record<string, string> = {
      SAR: "sar", USD: "usd", AED: "aed", EUR: "eur", GBP: "gbp",
      EGP: "egp", KWD: "kwd", QAR: "qar", BHD: "bhd", OMR: "omr",
      JOD: "jod", INR: "inr", PKR: "pkr",
    }
    const currency = currencyMap[tier.currency] || "usd"

    // Build the base URL from the request
    const origin = request.headers.get("origin") || request.nextUrl.origin

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `${tier.name} Plan (${cycleLabel})`,
              description: tier.description || `${tier.name} subscription plan`,
            },
            unit_amount: amount,
            recurring: {
              interval,
              interval_count: intervalCount,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        org_id: org.id,
        tier_id: tier.id,
        billing_cycle: cycle,
      },
      success_url: `${origin}/org/billing?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/org/billing?status=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
