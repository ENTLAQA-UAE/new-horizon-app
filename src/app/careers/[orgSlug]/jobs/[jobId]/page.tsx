// @ts-nocheck
// Note: This file uses field names and tables that don't match the database schema
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { JobDetailClient } from "./job-detail-client"

interface JobDetailPageProps {
  params: Promise<{ orgSlug: string; jobId: string }>
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { orgSlug, jobId } = await params
  const supabase = await createClient()

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
    .eq("organization_id", organization.id)
    .eq("status", "published")
    .single()

  if (!job) {
    notFound()
  }

  // Get organization branding
  const { data: branding } = await supabase
    .from("organization_branding")
    .select("*")
    .eq("organization_id", organization.id)
    .single()

  return (
    <JobDetailClient
      organization={organization}
      job={job}
      branding={branding}
    />
  )
}
