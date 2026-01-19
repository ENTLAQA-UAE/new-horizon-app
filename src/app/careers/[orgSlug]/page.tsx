// @ts-nocheck
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CareerPageClient } from "./career-page-client"

interface CareerPageProps {
  params: Promise<{ orgSlug: string }>
}

export default async function CareerPage({ params }: CareerPageProps) {
  const { orgSlug } = await params
  const supabase = await createClient()

  // Get organization by slug with career page config
  const { data: organization } = await supabase
    .from("organizations")
    .select("id, name, name_ar, slug, logo_url, primary_color, secondary_color, career_page_config, career_page_published")
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
    .eq("org_id", organization.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })

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
      blocks={careerBlocks}
      styles={pageStyles}
      settings={pageSettings}
    />
  )
}
