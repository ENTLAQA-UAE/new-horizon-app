import { createClient } from "@/lib/supabase/server"
import { ScorecardsClient, ScorecardTemplate } from "./scorecards-client"

export default async function ScorecardsPage() {
  const supabase = await createClient()

  // Fetch scorecard templates
  const { data: templates } = await supabase
    .from("scorecard_templates")
    .select("*")
    .order("created_at", { ascending: false })

  // Cast to proper type (Supabase returns Json for JSONB fields)
  const typedTemplates = (templates || []) as unknown as ScorecardTemplate[]

  return <ScorecardsClient templates={typedTemplates} />
}
