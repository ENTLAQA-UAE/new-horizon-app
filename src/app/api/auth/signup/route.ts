import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { createTenantFolders } from "@/lib/bunny"

/**
 * Signup API that handles both flows:
 * 1. Create new organization (mode: "create_org") - creates user + org + assigns org_admin
 * 2. Join existing organization (mode: "join_org") - creates user + accepts invite
 *
 * Uses service role client since the user doesn't exist yet at the time of the request.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mode, firstName, lastName, email, password } = body

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()

    // Create the auth user
    const { data: authData, error: signUpError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    })

    if (signUpError) {
      // Handle duplicate email
      if (signUpError.message?.includes("already been registered") || signUpError.message?.includes("already exists")) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in instead." },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      )
    }

    if (!authData?.user) {
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // Ensure profile exists
    await serviceClient
      .from("profiles")
      .upsert({
        id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
      }, { onConflict: "id" })

    if (mode === "create_org") {
      return handleCreateOrg(serviceClient, userId, body)
    } else if (mode === "join_org") {
      return handleJoinOrg(serviceClient, userId, authData.user, body)
    } else {
      return NextResponse.json({ success: true, userId })
    }
  } catch (err: any) {
    console.error("Signup error:", err)
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

async function handleCreateOrg(
  serviceClient: any,
  userId: string,
  body: { orgName: string; orgSlug: string }
) {
  const { orgName, orgSlug } = body

  if (!orgName || !orgSlug) {
    return NextResponse.json(
      { error: "Organization name is required" },
      { status: 400 }
    )
  }

  // Validate slug format
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  if (!slugRegex.test(orgSlug)) {
    return NextResponse.json(
      { error: "Organization URL must contain only lowercase letters, numbers, and hyphens" },
      { status: 400 }
    )
  }

  // Check slug availability
  const { data: existing } = await serviceClient
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .single()

  if (existing) {
    return NextResponse.json(
      { error: "This organization URL is already taken. Please choose another." },
      { status: 409 }
    )
  }

  // Create organization
  const { data: org, error: orgError } = await serviceClient
    .from("organizations")
    .insert({
      name: orgName,
      slug: orgSlug,
      owner_id: userId,
    })
    .select("id, slug")
    .single()

  if (orgError) {
    console.error("Org creation error:", orgError)
    return NextResponse.json(
      { error: "Failed to create organization: " + orgError.message },
      { status: 500 }
    )
  }

  // Update profile with org_id
  await serviceClient
    .from("profiles")
    .update({ org_id: org.id })
    .eq("id", userId)

  // Assign org_admin role
  const { error: roleError } = await serviceClient
    .from("user_roles")
    .upsert({
      user_id: userId,
      org_id: org.id,
      role: "org_admin",
    }, { onConflict: "user_id,org_id" })

  if (roleError) {
    console.error("Role assignment error:", roleError)
    return NextResponse.json(
      { error: "Organization created but role assignment failed. Please contact support." },
      { status: 500 }
    )
  }

  // Create tenant folders in Bunny Storage for document storage
  try {
    await createTenantFolders(org.id)
  } catch (bunnyError) {
    console.error("Failed to create Bunny tenant folders:", bunnyError)
    // Non-blocking: folders will be created on first upload if this fails
  }

  return NextResponse.json({
    success: true,
    userId,
    orgId: org.id,
    orgSlug: org.slug,
  })
}

async function handleJoinOrg(
  serviceClient: any,
  userId: string,
  user: any,
  body: { inviteId: string }
) {
  const { inviteId } = body

  if (!inviteId) {
    return NextResponse.json(
      { error: "Invite ID is required to join an organization" },
      { status: 400 }
    )
  }

  // Fetch invite
  const { data: invite, error: inviteError } = await serviceClient
    .from("team_invites")
    .select("id, email, role, org_id, status, expires_at, department_id")
    .eq("id", inviteId)
    .single()

  if (inviteError || !invite) {
    return NextResponse.json(
      { error: "Invalid invite" },
      { status: 400 }
    )
  }

  // Validate invite
  if (invite.status && invite.status !== "pending") {
    return NextResponse.json(
      { error: "This invite has already been used" },
      { status: 400 }
    )
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "This invite has expired" },
      { status: 400 }
    )
  }

  if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json(
      { error: "Email does not match the invite" },
      { status: 400 }
    )
  }

  // Update profile with org_id
  await serviceClient
    .from("profiles")
    .update({
      org_id: invite.org_id,
      department: invite.role === "hiring_manager" && invite.department_id ? invite.department_id : undefined,
    })
    .eq("id", userId)

  // Assign role
  const { error: roleError } = await serviceClient
    .from("user_roles")
    .upsert({
      user_id: userId,
      org_id: invite.org_id,
      role: invite.role,
    }, { onConflict: "user_id,org_id" })

  if (roleError) {
    console.error("Role assignment error:", roleError)
    return NextResponse.json(
      { error: "Account created but role assignment failed. Please contact your admin." },
      { status: 500 }
    )
  }

  // If hiring_manager with department, assign department access
  if (invite.role === "hiring_manager" && invite.department_id) {
    await serviceClient
      .from("user_role_departments")
      .upsert({
        user_id: userId,
        org_id: invite.org_id,
        department_id: invite.department_id,
      }, { onConflict: "user_id,org_id,department_id" })
  }

  // Mark invite as accepted
  await serviceClient
    .from("team_invites")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_by: userId,
    })
    .eq("id", inviteId)

  return NextResponse.json({
    success: true,
    userId,
    orgId: invite.org_id,
  })
}
