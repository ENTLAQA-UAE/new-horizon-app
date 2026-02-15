import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { apiLimiter, getRateLimitKey, rateLimitResponse } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single()

  if (!profile?.org_id) {
    return NextResponse.json({ error: "No organization" }, { status: 400 })
  }

  const { data: workflows, error } = await supabase
    .from("workflows")
    .select("*, workflow_executions(id, status, started_at, completed_at)")
    .eq("organization_id", profile.org_id)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ workflows })
}

export async function POST(request: NextRequest) {
  const rlKey = getRateLimitKey(request)
  const rl = apiLimiter.check(`workflows:${rlKey}`)
  if (!rl.success) return rateLimitResponse(rl)

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single()

  if (!profile?.org_id) {
    return NextResponse.json({ error: "No organization" }, { status: 400 })
  }

  const body = await request.json()
  const { name, description, trigger_type, trigger_config, actions, is_active } = body

  if (!name || !trigger_type) {
    return NextResponse.json({ error: "Name and trigger type are required" }, { status: 400 })
  }

  const { data: workflow, error } = await supabase
    .from("workflows")
    .insert({
      organization_id: profile.org_id,
      name,
      description: description || null,
      trigger_type,
      trigger_config: trigger_config || {},
      actions: actions || [],
      is_active: is_active ?? true,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ workflow }, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { id, name, description, trigger_type, trigger_config, actions, is_active } = body

  if (!id) {
    return NextResponse.json({ error: "Workflow ID is required" }, { status: 400 })
  }

  const { data: workflow, error } = await supabase
    .from("workflows")
    .update({
      name,
      description: description || null,
      trigger_type,
      trigger_config: trigger_config || {},
      actions: actions || [],
      is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ workflow })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Workflow ID is required" }, { status: 400 })
  }

  const { error } = await supabase.from("workflows").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
