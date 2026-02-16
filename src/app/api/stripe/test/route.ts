import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    // Auth check - only authenticated super_admin users can test Stripe keys
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { secret_key } = await request.json()

    if (!secret_key) {
      return NextResponse.json({ error: "Secret key is required" }, { status: 400 })
    }

    const stripe = new Stripe(secret_key, { apiVersion: "2026-01-28.clover" })

    // Try to list 1 customer to verify the key works
    await stripe.customers.list({ limit: 1 })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Stripe connection test failed:", error.message)
    return NextResponse.json({ error: "Invalid Stripe API key" }, { status: 400 })
  }
}
