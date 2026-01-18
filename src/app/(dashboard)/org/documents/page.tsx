import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DocumentsClient } from "./documents-client"

export default async function DocumentsPage() {
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

  // Get documents
  const { data: documents } = await supabase
    .from("documents")
    .select(`
      *,
      candidates (id, first_name, last_name),
      applications (id, jobs (title))
    `)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })

  // Get candidates for filtering
  const { data: candidates } = await supabase
    .from("candidates")
    .select("id, first_name, last_name")
    .eq("organization_id", orgId)
    .order("first_name", { ascending: true })

  return (
    <DocumentsClient
      documents={documents || []}
      candidates={candidates || []}
      organizationId={orgId}
    />
  )
}
