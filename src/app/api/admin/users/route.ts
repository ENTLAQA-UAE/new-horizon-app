/**
 * Admin User Management API
 *
 * Provides server-side operations that require the service role:
 * - Create a new user with auto-confirmed email
 * - Generate magic link for any user
 *
 * All endpoints verify the caller is a super_admin via their session.
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

async function verifySuperAdmin(request: NextRequest): Promise<{ userId: string } | NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .single()

  if (!roleData) {
    return NextResponse.json({ error: "Forbidden: super_admin only" }, { status: 403 })
  }

  return { userId: user.id }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifySuperAdmin(request)
    if (authResult instanceof NextResponse) return authResult

    const body = await request.json()
    const { action } = body

    switch (action) {
      case "create_user_for_org":
        return handleCreateUserForOrg(body, request)
      case "generate_magic_link":
        return handleGenerateMagicLink(body, request)
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[admin/users] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Create a new user, assign them to an org as org_admin, and generate a magic link.
 * The user is created with email auto-confirmed so they can login immediately.
 */
async function handleCreateUserForOrg(
  body: { email: string; orgId: string; firstName?: string; lastName?: string },
  request: NextRequest
) {
  const { email, orgId, firstName, lastName } = body

  if (!email || !orgId) {
    return NextResponse.json(
      { error: "email and orgId are required" },
      { status: 400 }
    )
  }

  const serviceClient = createServiceClient()
  const productionUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  // Check if user already exists
  const { data: existingUsers } = await serviceClient.auth.admin.listUsers()
  const existingUser = existingUsers?.users?.find(
    (u: any) => u.email?.toLowerCase() === email.toLowerCase()
  )

  let userId: string

  if (existingUser) {
    userId = existingUser.id

    // Update their profile to link to this org
    await serviceClient
      .from("profiles")
      .update({ org_id: orgId })
      .eq("id", userId)

    // Check if they already have org_admin role
    const { data: existingRole } = await serviceClient
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "org_admin")
      .single()

    if (!existingRole) {
      await serviceClient.from("user_roles").insert({
        user_id: userId,
        role: "org_admin",
        org_id: orgId,
      })
    }
  } else {
    // Create new user with email auto-confirmed
    const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        first_name: firstName || "",
        last_name: lastName || "",
      },
    })

    if (createError) {
      console.error("[admin/users] createUser error:", createError)
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      )
    }

    userId = newUser.user.id

    // Wait briefly for the trigger to create the profile
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Update profile with org_id and name
    await serviceClient
      .from("profiles")
      .update({
        org_id: orgId,
        first_name: firstName || "",
        last_name: lastName || "",
        email: email.toLowerCase(),
      })
      .eq("id", userId)

    // Assign org_admin role
    await serviceClient.from("user_roles").insert({
      user_id: userId,
      role: "org_admin",
      org_id: orgId,
    })
  }

  // Generate a password setup link (recovery type) so the user can create their password
  const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
    type: "recovery",
    email,
  })

  if (linkError) {
    console.error("[admin/users] generateLink error:", linkError)
    return NextResponse.json({
      success: true,
      userId,
      inviteLink: null,
      warning: "User created and assigned, but invite link generation failed: " + linkError.message,
    })
  }

  // Build a clean invite link on our own domain using the OTP token
  const otp = linkData.properties?.email_otp
  const inviteLink = otp
    ? `${productionUrl}/reset-password?token=${encodeURIComponent(otp)}&email=${encodeURIComponent(email)}&type=recovery`
    : null

  return NextResponse.json({
    success: true,
    userId,
    inviteLink,
    isExistingUser: !!existingUser,
  })
}

/**
 * Generate an invite link (password setup) for any existing user.
 */
async function handleGenerateMagicLink(
  body: { email: string },
  request: NextRequest
) {
  const { email } = body

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const productionUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
    type: "recovery",
    email,
  })

  if (linkError) {
    console.error("[admin/users] generateLink error:", linkError)
    return NextResponse.json(
      { error: linkError.message },
      { status: 400 }
    )
  }

  // Build a clean invite link on our own domain using the OTP token
  const otp = linkData.properties?.email_otp
  const inviteLink = otp
    ? `${productionUrl}/reset-password?token=${encodeURIComponent(otp)}&email=${encodeURIComponent(email)}&type=recovery`
    : null

  return NextResponse.json({
    success: true,
    inviteLink,
  })
}

