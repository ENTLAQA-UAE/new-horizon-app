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

  // Get user's organization
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single()

  if (!membership) {
    redirect("/organizations")
  }

  // Get documents
  const { data: documents } = await supabase
    .from("documents")
    .select(`
      *,
      candidates (id, first_name, last_name),
      applications (id, jobs (title))
    `)
    .eq("organization_id", membership.organization_id)
    .order("created_at", { ascending: false })

  // Get candidates for filtering
  const { data: candidates } = await supabase
    .from("candidates")
    .select("id, first_name, last_name")
    .eq("organization_id", membership.organization_id)
    .order("first_name", { ascending: true })

  return (
    <DocumentsClient
      documents={documents || []}
      candidates={candidates || []}
      organizationId={membership.organization_id}
    />
  )
}
