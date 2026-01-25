// @ts-nocheck
// Note: This file uses field names and tables that don't match the database schema
import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase/service"
import { JobDetailClient } from "./job-detail-client"

interface JobDetailPageProps {
  params: Promise<{ orgSlug: string; jobId: string }>
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { orgSlug, jobId } = await params
  const supabase = createServiceClient()

  // Get organization by slug
  const { data: organization } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", orgSlug)
    .single()

  if (!organization) {
    notFound()
  }

  // Get job details
  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("org_id", organization.id)
    .eq("status", "open")
    .single()

  if (!job) {
    notFound()
  }

  // Get organization branding
  const { data: branding } = await supabase
    .from("organization_branding")
    .select("*")
    .eq("org_id", organization.id)
    .single()

  // Get enabled screening questions for this job
  const { data: jobScreeningQuestions } = await supabase
    .from("job_screening_questions")
    .select(`
      id,
      question_id,
      is_enabled,
      sort_order,
      question:screening_questions(
        id,
        question,
        question_ar,
        description,
        description_ar,
        question_type,
        options,
        is_required,
        is_knockout,
        knockout_value,
        min_value,
        max_value,
        min_length,
        max_length
      )
    `)
    .eq("job_id", jobId)
    .eq("is_enabled", true)
    .order("sort_order", { ascending: true })

  // Transform to flat array of questions
  const screeningQuestions = (jobScreeningQuestions || [])
    .filter((jsq: any) => jsq.question)
    .map((jsq: any) => jsq.question)

  return (
    <JobDetailClient
      organization={organization}
      job={job}
      branding={branding}
      screeningQuestions={screeningQuestions}
    />
  )
}
