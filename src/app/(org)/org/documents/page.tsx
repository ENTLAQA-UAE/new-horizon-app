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

  // Get applications with their attachments and candidate info
  const { data: applications } = await supabase
    .from("applications")
    .select(`
      id,
      created_at,
      candidates (
        id,
        first_name,
        last_name,
        email,
        resume_url
      ),
      jobs (
        id,
        title
      )
    `)
    .order("created_at", { ascending: false })

  // Get application attachments
  const { data: attachments } = await supabase
    .from("application_attachments")
    .select(`
      id,
      application_id,
      file_name,
      file_type,
      file_url,
      file_size,
      mime_type,
      description,
      created_at
    `)
    .order("created_at", { ascending: false })

  // Get jobs for filtering
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title")
    .order("title", { ascending: true })

  // Transform data for the client component
  // Combine resumes from candidates and attachments
  const documents: Array<{
    id: string
    name: string
    file_url: string
    file_type: string
    file_size: number | null
    document_type: string
    candidate_id: string | null
    candidate_name: string
    application_id: string | null
    job_id: string | null
    job_title: string
    created_at: string
  }> = []

  // Add resumes from applications
  applications?.forEach((app) => {
    if (app.candidates?.resume_url) {
      documents.push({
        id: `resume-${app.id}`,
        name: `${app.candidates.first_name} ${app.candidates.last_name} - Resume`,
        file_url: app.candidates.resume_url,
        file_type: "pdf",
        file_size: null,
        document_type: "resume",
        candidate_id: app.candidates.id,
        candidate_name: `${app.candidates.first_name} ${app.candidates.last_name}`,
        application_id: app.id,
        job_id: app.jobs?.id || null,
        job_title: app.jobs?.title || "Unknown Job",
        created_at: app.created_at,
      })
    }
  })

  // Add attachments
  attachments?.forEach((att) => {
    const application = applications?.find((a) => a.id === att.application_id)
    if (application) {
      documents.push({
        id: att.id,
        name: att.file_name,
        file_url: att.file_url,
        file_type: att.file_type || "unknown",
        file_size: att.file_size,
        document_type: att.file_type || "attachment",
        candidate_id: application.candidates?.id || null,
        candidate_name: application.candidates
          ? `${application.candidates.first_name} ${application.candidates.last_name}`
          : "Unknown",
        application_id: att.application_id,
        job_id: application.jobs?.id || null,
        job_title: application.jobs?.title || "Unknown Job",
        created_at: att.created_at,
      })
    }
  })

  return (
    <DocumentsClient
      documents={documents}
      jobs={jobs || []}
      organizationId={orgId}
    />
  )
}
