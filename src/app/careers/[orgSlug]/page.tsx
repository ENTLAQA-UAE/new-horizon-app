import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase/service"
import { CareerPageClient } from "./career-page-client"

interface CareerPageProps {
  params: Promise<{ orgSlug: string }>
}

export default async function CareerPage({ params }: CareerPageProps) {
  const { orgSlug } = await params
  const supabase = createServiceClient()

  // Get organization by slug with career page config
  const { data: organization } = await supabase
    .from("organizations")
    .select("id, name, name_ar, slug, logo_url, primary_color, secondary_color, career_page_config, career_page_published")
    .eq("slug", orgSlug)
    .single()

  if (!organization) {
    notFound()
  }

  // Get published jobs for this organization with related data
  const { data: jobsRaw } = await supabase
    .from("jobs")
    .select(
      `
      id,
      title,
      title_ar,
      slug,
      description,
      description_ar,
      location_id,
      department_id,
      job_type,
      experience_level,
      salary_min,
      salary_max,
      salary_currency,
      is_remote,
      published_at,
      closing_date,
      thumbnail_url,
      departments:department_id(id, name, name_ar),
      locations:location_id(id, name, name_ar, city)
    `
    )
    .eq("org_id", organization.id)
    .eq("status", "open")
    .order("published_at", { ascending: false })

  // Transform jobs data to match client interface
  const jobs = (jobsRaw || []).map((job: any) => ({
    id: job.id,
    title: job.title,
    title_ar: job.title_ar,
    slug: job.slug,
    description: job.description,
    description_ar: job.description_ar,
    // Map nested location to flat string
    location: job.locations?.name
      ? `${job.locations.name}${job.locations.city ? `, ${job.locations.city}` : ''}`
      : null,
    location_ar: job.locations?.name_ar || null,
    // Map nested department to flat string
    department: job.departments?.name || null,
    department_ar: job.departments?.name_ar || null,
    // Map field names
    employment_type: job.job_type,
    experience_level: job.experience_level,
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    salary_currency: job.salary_currency,
    remote_allowed: job.is_remote,
    published_at: job.published_at,
    closing_date: job.closing_date,
    thumbnail_url: job.thumbnail_url,
  }))

  // Get job types for this organization (from vacancy settings)
  const { data: jobTypesRaw } = await supabase
    .from("job_types")
    .select("id, name, name_ar")
    .eq("org_id", organization.id)
    .eq("is_active", true)
    .order("name")

  const jobTypes = (jobTypesRaw || []).map((jt: any) => ({
    value: jt.name.toLowerCase().replace(/\s+/g, '_'),
    label: jt.name,
    labelAr: jt.name_ar,
  }))

  // Get career page blocks
  const { data: blocks } = await supabase
    .from("career_page_blocks")
    .select("*")
    .eq("org_id", organization.id)
    .eq("enabled", true)
    .order("block_order", { ascending: true })

  // Parse career page config
  const careerPageConfig = organization.career_page_config || {}
  const pageStyles = careerPageConfig.styles || {
    primaryColor: organization.primary_color || "#3B82F6",
    secondaryColor: organization.secondary_color || "#10B981",
    backgroundColor: "#FFFFFF",
    textColor: "#1F2937",
    fontFamily: "Inter",
    borderRadius: "8px",
    headerStyle: "standard",
    footerStyle: "standard",
  }
  const pageSettings = careerPageConfig.settings || {
    showHeader: true,
    showFooter: true,
    showLogo: true,
    showJobSearch: true,
    showJobFilters: true,
    language: "both",
    defaultLanguage: "en",
  }

  // Transform blocks to the expected format
  const careerBlocks = (blocks || []).map((b) => ({
    id: b.id,
    type: b.block_type,
    order: b.block_order,
    enabled: b.enabled,
    content: b.content || {},
    styles: b.styles || {},
  }))

  return (
    <CareerPageClient
      organization={{
        id: organization.id,
        name: organization.name,
        nameAr: organization.name_ar,
        slug: organization.slug,
        logoUrl: organization.logo_url,
      }}
      jobs={jobs || []}
      jobTypes={jobTypes}
      blocks={careerBlocks}
      styles={pageStyles}
      settings={pageSettings}
    />
  )
}
