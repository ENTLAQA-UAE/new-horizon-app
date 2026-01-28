import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getOrgAIConfigs, getAllAIProviderInfos } from "@/lib/ai/org-ai-config"

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get("orgId")

    if (!orgId) {
      return NextResponse.json({ error: "Missing orgId" }, { status: 400 })
    }

    // Get user's org membership to verify access
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single()

    if (!profile || profile.org_id !== orgId) {
      // Check if super admin using user_roles table
      const { data: superAdminRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .eq("role", "super_admin")
        .single()

      if (!superAdminRole) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 })
      }
    }

    // Get AI configurations for the org
    const configs = await getOrgAIConfigs(supabase, orgId)

    // Get provider info for setup guides
    const providerInfos = getAllAIProviderInfos()

    return NextResponse.json({
      configs,
      providerInfos,
    })
  } catch (err) {
    console.error("Error fetching AI configs:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
