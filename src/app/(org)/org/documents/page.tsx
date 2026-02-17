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

  // Fetch all three document sources in parallel
  const [candidateDocsResult, candidateResumesResult, attachmentsResult, candidatesResult] =
    await Promise.all([
      // 1. Candidate documents (uploaded via Documents page)
      supabase
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
        .order("created_at", { ascending: false }),

      // 2. Candidate resumes (from candidates table - original resume_url)
      supabase
        .from("candidates")
        .select("id, first_name, last_name, email, resume_url, created_at")
        .eq("org_id", orgId)
        .not("resume_url", "is", null)
        .order("created_at", { ascending: false }),

      // 3. Application attachments (resumes, cover letters, etc. attached to applications)
      supabase
        .from("application_attachments")
        .select(`
          id,
          file_name,
          file_url,
          file_size,
          mime_type,
          file_type,
          created_at,
          applications!inner (
            id,
            org_id,
            candidates (
              id,
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq("applications.org_id", orgId)
        .order("created_at", { ascending: false }),

      // 4. All candidates for the upload dropdown
      supabase
        .from("candidates")
        .select("id, first_name, last_name, email")
        .eq("org_id", orgId)
        .order("first_name", { ascending: true }),
    ])

  const candidateDocuments = candidateDocsResult.data || []
  const candidateResumes = candidateResumesResult.data || []
  const attachments = attachmentsResult.data || []
  const candidates = candidatesResult.data || []

  // Track seen file URLs to avoid duplicates
  const seenUrls = new Set<string>()

  // 1. Transform candidate_documents
  const docsFromCandidateDocuments = candidateDocuments.map((doc) => {
    if (doc.file_url) seenUrls.add(doc.file_url)
    return {
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
    }
  })

  // 2. Transform candidate resumes (skip if URL already included from candidate_documents)
  const docsFromResumes = candidateResumes
    .filter((c) => c.resume_url && !seenUrls.has(c.resume_url))
    .map((c) => {
      seenUrls.add(c.resume_url!)
      return {
        id: `resume-${c.id}`,
        name: `${c.first_name} ${c.last_name} - Resume`,
        file_url: c.resume_url!,
        file_size: null,
        mime_type: "application/pdf",
        candidate_id: c.id,
        candidate_name: `${c.first_name} ${c.last_name}`,
        candidate_email: c.email,
        created_at: c.created_at,
      }
    })

  // 3. Transform application attachments (skip if URL already included)
  const docsFromAttachments = attachments
    .filter((att) => att.file_url && !seenUrls.has(att.file_url))
    .map((att) => {
      seenUrls.add(att.file_url)
      const candidate = (att.applications as any)?.candidates
      return {
        id: `att-${att.id}`,
        name: att.file_name || "Attachment",
        file_url: att.file_url,
        file_size: att.file_size,
        mime_type: att.mime_type,
        candidate_id: candidate?.id || null,
        candidate_name: candidate
          ? `${candidate.first_name} ${candidate.last_name}`
          : "Unknown",
        candidate_email: candidate?.email || "",
        created_at: att.created_at,
      }
    })

  // Combine all documents and sort by created_at descending
  const allDocuments = [
    ...docsFromCandidateDocuments,
    ...docsFromResumes,
    ...docsFromAttachments,
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <DocumentsClient
      documents={allDocuments}
      candidates={candidates || []}
      organizationId={orgId}
    />
  )
}
