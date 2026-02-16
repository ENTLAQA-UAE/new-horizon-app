import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServiceClient } from "@/lib/supabase/server"

async function getStripeKeys(supabase: any) {
  const { data } = await supabase
    .from("platform_settings")
    .select("key, value")
    .in("key", ["stripe_secret_key", "stripe_webhook_secret"])

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
  const supabase = createServiceClient()
  const stripeKeys = await getStripeKeys(supabase)

  if (!stripeKeys.stripe_secret_key) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
  }

  const stripe = new Stripe(stripeKeys.stripe_secret_key, { apiVersion: "2026-01-28.clover" })

  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  let event: Stripe.Event

  // Verify webhook signature if secret is configured
  if (stripeKeys.stripe_webhook_secret && signature) {
    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeKeys.stripe_webhook_secret)
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }
  } else {
    // Fallback: parse event without verification (development only)
    event = JSON.parse(body) as Stripe.Event
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const orgId = session.metadata?.org_id
        const tierId = session.metadata?.tier_id
        const billingCycle = session.metadata?.billing_cycle || "monthly"

        if (!orgId) break

        const now = new Date()
        const endDate = new Date(now)
        if (billingCycle === "yearly") {
          endDate.setFullYear(endDate.getFullYear() + 1)
        } else {
          endDate.setMonth(endDate.getMonth() + 1)
        }

        // Get tier limits to apply to the organization
        let tierUpdate: Record<string, any> = {}
        if (tierId) {
          const { data: tier } = await supabase
            .from("subscription_tiers")
            .select("max_jobs, max_candidates, max_users")
            .eq("id", tierId)
            .single()

          if (tier) {
            tierUpdate = {
              max_jobs: tier.max_jobs,
              max_candidates: tier.max_candidates,
              max_users: tier.max_users,
            }
          }
        }

        await supabase
          .from("organizations")
          .update({
            subscription_status: "active",
            subscription_start_date: now.toISOString().split("T")[0],
            subscription_end_date: endDate.toISOString().split("T")[0],
            stripe_subscription_id: typeof session.subscription === "string"
              ? session.subscription
              : session.subscription?.id || null,
            tier_id: tierId || undefined,
            ...tierUpdate,
          })
          .eq("id", orgId)

        console.log(`Subscription activated for org ${orgId}`)
        break
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice
        const subRef = invoice.parent?.subscription_details?.subscription
        const subscriptionId = typeof subRef === "string"
          ? subRef
          : subRef?.id

        if (!subscriptionId) break

        // Find the org by stripe_subscription_id
        const { data: org } = await supabase
          .from("organizations")
          .select("id, subscription_end_date")
          .eq("stripe_subscription_id", subscriptionId)
          .single()

        if (!org) break

        // Extend subscription end date
        const currentEnd = org.subscription_end_date
          ? new Date(org.subscription_end_date)
          : new Date()
        const newEnd = new Date(currentEnd)
        newEnd.setMonth(newEnd.getMonth() + 1)

        await supabase
          .from("organizations")
          .update({
            subscription_status: "active",
            subscription_end_date: newEnd.toISOString().split("T")[0],
          })
          .eq("id", org.id)

        console.log(`Subscription renewed for org ${org.id}`)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const subId = subscription.id

        const { data: org } = await supabase
          .from("organizations")
          .select("id")
          .eq("stripe_subscription_id", subId)
          .single()

        if (!org) break

        await supabase
          .from("organizations")
          .update({
            subscription_status: "cancelled",
            stripe_subscription_id: null,
          })
          .eq("id", org.id)

        console.log(`Subscription cancelled for org ${org.id}`)
        break
      }

      default:
        console.log(`Unhandled webhook event: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
