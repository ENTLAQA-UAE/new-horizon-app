// @ts-nocheck
// Note: This file uses field names that don't match the database schema
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CareerPageClient } from "./career-page-client"

interface CareerPageProps {
  params: Promise<{ orgSlug: string }>
}

export default async function CareerPage({ params }: CareerPageProps) {
  const { orgSlug } = await params
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

  // Get published jobs for this organization
  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      `
      id,
      title,
      title_ar,
      description,
      description_ar,
      location,
      department,
      employment_type,
      experience_level,
      salary_min,
      salary_max,
      salary_currency,
      remote_allowed,
      published_at,
      closes_at
    `
    )
    .eq("organization_id", organization.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })

  // Get organization branding
  const { data: branding } = await supabase
    .from("organization_branding")
    .select("*")
    .eq("organization_id", organization.id)
    .single()

  return (
    <CareerPageClient
      organization={organization}
      jobs={jobs || []}
      branding={branding}
    />
  )
}
