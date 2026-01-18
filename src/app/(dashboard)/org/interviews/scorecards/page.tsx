import { createClient } from "@/lib/supabase/server"
import { ScorecardsClient } from "./scorecards-client"

export default async function ScorecardsPage() {
  const supabase = await createClient()

  // Fetch scorecard templates
  const { data: templates } = await supabase
    .from("scorecard_templates")
    .select("*")
    .order("created_at", { ascending: false })

  return <ScorecardsClient templates={templates || []} />
}
