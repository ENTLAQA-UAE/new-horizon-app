import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

/**
 * Create a new organization and assign org_admin role to the creator.
 * Uses the service role client for the role INSERT to bypass RLS,
 * since the user_roles INSERT policy only allows super_admins.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { name, slug, industry, companySize } = await request.json()

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Organization name and slug are required" },
        { status: 400 }
      )
    }

    // Check if user already has an org
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single()

    if (profile?.org_id) {
      return NextResponse.json(
        { error: "User already belongs to an organization" },
        { status: 400 }
      )
    }

    // Check if slug is available
    const serviceClient = createServiceClient()

    const { data: existing } = await serviceClient
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: "This organization URL is already taken" },
        { status: 409 }
      )
    }

    // Create organization
    const { data: org, error: orgError } = await serviceClient
      .from("organizations")
      .insert({
        name,
        slug,
        industry: industry || null,
        company_size: companySize || null,
        owner_id: user.id,
      })
      .select()
      .single()

    if (orgError) {
      console.error("Org creation error:", orgError)
      return NextResponse.json(
        { error: "Failed to create organization: " + orgError.message },
        { status: 500 }
      )
    }

    // Update user profile with org_id
    const { error: profileError } = await serviceClient
      .from("profiles")
      .update({ org_id: org.id })
      .eq("id", user.id)

    if (profileError) {
      console.error("Profile update error:", profileError)
      return NextResponse.json(
        { error: "Failed to update profile: " + profileError.message },
        { status: 500 }
      )
    }

    // Assign org_admin role using service client to bypass RLS
    const { error: roleError } = await serviceClient
      .from("user_roles")
      .upsert({
        user_id: user.id,
        org_id: org.id,
        role: "org_admin",
      }, {
        onConflict: "user_id,org_id"
      })

    if (roleError) {
      console.error("Role assignment error:", roleError)
      return NextResponse.json(
        { error: "Organization created but role assignment failed: " + roleError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      orgId: org.id,
      slug: org.slug,
    })
  } catch (err: any) {
    console.error("Error creating organization:", err)
    return NextResponse.json(
      { error: err.message || "Failed to create organization" },
      { status: 500 }
    )
  }
}
