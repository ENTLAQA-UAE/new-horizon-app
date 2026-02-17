// @ts-nocheck
// Note: candidate_documents table types not yet generated
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

  // Get all candidate documents for this org
  const { data: candidateDocuments } = await supabase
    .from("candidate_documents")
    .select(`
      id,
      file_name,
      file_url,
      file_size,
      mime_type,
      created_at,
      candidate_id,
      candidates (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  // Get all candidates for the upload dropdown
  const { data: candidates } = await supabase
    .from("candidates")
    .select("id, first_name, last_name, email")
    .eq("org_id", orgId)
    .order("first_name", { ascending: true })

  // Transform data for the client component
  const documents = (candidateDocuments || []).map((doc) => ({
    id: doc.id,
    name: doc.file_name,
    file_url: doc.file_url,
    file_size: doc.file_size,
    mime_type: doc.mime_type,
    candidate_id: doc.candidate_id,
    candidate_name: doc.candidates
      ? `${(doc.candidates as any).first_name} ${(doc.candidates as any).last_name}`
      : "Unknown",
    candidate_email: doc.candidates ? (doc.candidates as any).email : "",
    created_at: doc.created_at,
  }))

  return (
    <DocumentsClient
      documents={documents}
      candidates={candidates || []}
      organizationId={orgId}
    />
  )
}
