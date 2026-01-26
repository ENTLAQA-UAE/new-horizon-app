// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    // Use regular client for auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use service client to bypass RLS
    const serviceClient = createServiceClient()

    // Get user's org_id
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single()

    if (!profile?.org_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Fetch scorecard templates for the organization
    const { data: templates, error } = await serviceClient
      .from("scorecard_templates")
      .select("*")
      .eq("org_id", profile.org_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching templates:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ templates: templates || [] })
  } catch (error) {
    console.error("Error in scorecard-templates GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
