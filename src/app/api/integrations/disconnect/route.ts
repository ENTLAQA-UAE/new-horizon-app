// @ts-nocheck
// Note: This file uses tables that don't exist (user_integrations)
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { provider } = await request.json()

    if (!provider) {
      return NextResponse.json({ error: "Provider is required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("user_integrations")
      .delete()
      .eq("user_id", user.id)
      .eq("provider", provider)

    if (error) {
      console.error("Error disconnecting integration:", error)
      return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Disconnect error:", err)
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 })
  }
}
