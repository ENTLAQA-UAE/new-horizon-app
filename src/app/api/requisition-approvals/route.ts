import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

/**
 * POST /api/requisition-approvals
 * Creates or updates requisition approval records.
 * Uses the service role client to bypass RLS.
 *
 * Two modes:
 * 1. Approve/Reject: HR manager approves or rejects a requisition
 *    Body: { requisition_id, status, comments?, existing_approval_id? }
 *
 * 2. Auto-assign: Bulk-create pending approvals for HR managers
 *    Body: { requisition_id, auto_assign: true, approvers: [{ user_id, approval_order }] }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const serviceClient = createServiceClient()

    // Get user's org for validation
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single()

    if (!profile?.org_id) {
      return NextResponse.json({ error: "User org not found" }, { status: 403 })
    }

    // Verify the requisition belongs to the user's org
    const { data: requisition } = await serviceClient
      .from("job_requisitions")
      .select("id, org_id")
      .eq("id", body.requisition_id)
      .single()

    if (!requisition || requisition.org_id !== profile.org_id) {
      return NextResponse.json({ error: "Requisition not found" }, { status: 404 })
    }

    // Mode 2: Auto-assign pending approvals for HR managers
    if (body.auto_assign && body.approvers) {
      const approvals = []
      for (const approver of body.approvers) {
        const { data, error } = await serviceClient
          .from("requisition_approvals")
          .insert({
            requisition_id: body.requisition_id,
            approver_id: approver.user_id,
            approval_order: approver.approval_order,
            status: "pending",
          })
          .select()
          .single()

        if (error) {
          console.error("Error creating auto-assign approval:", error)
        }
        if (data) approvals.push(data)
      }
      return NextResponse.json({ approvals })
    }

    // Mode 1: Approve/Reject
    const { requisition_id, status, comments, existing_approval_id } = body

    if (!requisition_id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify user has hr_manager or super_admin role for approve/reject
    const { data: userRole } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    if (!userRole || !["hr_manager", "super_admin"].includes(userRole.role)) {
      return NextResponse.json({ error: "Only HR managers can approve requisitions" }, { status: 403 })
    }

    let approval

    if (existing_approval_id) {
      // Update existing approval
      const { data, error } = await serviceClient
        .from("requisition_approvals")
        .update({
          status,
          decided_at: new Date().toISOString(),
          comments: comments || null,
        })
        .eq("id", existing_approval_id)
        .select()
        .single()

      if (error) {
        console.error("Error updating approval:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      approval = data
    } else {
      // Create new approval
      const { data, error } = await serviceClient
        .from("requisition_approvals")
        .insert({
          requisition_id,
          approver_id: user.id,
          approval_order: 1,
          status,
          decided_at: new Date().toISOString(),
          comments: comments || null,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating approval:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      approval = data
    }

    // Update the requisition status
    const newStatus = status === "approved" ? "approved" : "rejected"
    const { error: reqError } = await serviceClient
      .from("job_requisitions")
      .update({ status: newStatus })
      .eq("id", requisition_id)

    if (reqError) {
      console.error("Error updating requisition status:", reqError)
      return NextResponse.json({ error: reqError.message }, { status: 500 })
    }

    return NextResponse.json({ approval, requisition_status: newStatus })
  } catch (error) {
    console.error("Error in requisition-approvals POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/requisition-approvals?requisition_id=xxx
 * Deletes all approval records for a requisition.
 * Uses the service role client to bypass RLS.
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const requisitionId = searchParams.get("requisition_id")

    if (!requisitionId) {
      return NextResponse.json({ error: "Missing requisition_id" }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    const { error } = await serviceClient
      .from("requisition_approvals")
      .delete()
      .eq("requisition_id", requisitionId)

    if (error) {
      console.error("Error deleting approvals:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in requisition-approvals DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
