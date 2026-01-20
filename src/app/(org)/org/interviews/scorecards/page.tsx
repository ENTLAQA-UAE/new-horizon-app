import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ScorecardsClient, ScorecardTemplate } from "./scorecards-client"

export default async function ScorecardsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user's profile with organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single()

  if (!profile?.org_id) {
    redirect("/org")
  }

  const orgId = profile.org_id

  // Fetch scorecard templates for this organization
  const { data: templates } = await supabase
    .from("scorecard_templates")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  // Cast to proper type (Supabase returns Json for JSONB fields)
  const typedTemplates = (templates || []) as unknown as ScorecardTemplate[]

  return <ScorecardsClient templates={typedTemplates} organizationId={orgId} />
}
