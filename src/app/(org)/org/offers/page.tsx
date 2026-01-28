import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OffersClient } from "./offers-client"

export default async function OffersPage() {
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

  // Fetch organization settings for default currency
  const { data: organization } = await supabase
    .from("organizations")
    .select("currency")
    .eq("id", orgId)
    .single()

  const defaultCurrency = organization?.currency || "SAR"

  // Fetch offers with related data for this organization
  const { data: offers } = await supabase
    .from("offers")
    .select(`
      *,
      applications (
        id,
        candidates (
          id,
          first_name,
          last_name,
          email,
          phone,
          current_title
        ),
        jobs (
          id,
          title,
          title_ar
        )
      )
    `)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  // Fetch offer templates for this organization
  const { data: templates } = await supabase
    .from("offer_templates")
    .select("*")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("name")

  // Fetch applications eligible for offers (not rejected, not already hired)
  // Include applications in interview, assessment, and offer stages
  const { data: applications } = await supabase
    .from("applications")
    .select(`
      id,
      job_id,
      status,
      candidates (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq("org_id", orgId)
    .not("status", "in", '("rejected","hired","withdrawn")')
    .order("created_at", { ascending: false })

  // Get unique job IDs from applications
  const jobIds = [...new Set(applications?.map(a => a.job_id).filter(Boolean) || [])]

  // Fetch jobs, departments, and locations separately
  const [{ data: jobs }, { data: departments }, { data: locations }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, department_id, location_id")
      .in("id", jobIds.length > 0 ? jobIds : [""]),
    supabase
      .from("departments")
      .select("id, name")
      .eq("org_id", orgId),
    supabase
      .from("job_locations")
      .select("id, name, city")
      .eq("org_id", orgId)
  ])

  // Create lookup maps for efficient joining
  const jobMap = new Map(jobs?.map(j => [j.id, j]) || [])
  const deptMap = new Map(departments?.map(d => [d.id, d]) || [])
  const locMap = new Map(locations?.map(l => [l.id, l]) || [])

  // Enrich applications with job, department, and location data
  const enrichedApplications = applications?.map(app => {
    const job = jobMap.get(app.job_id)
    return {
      ...app,
      jobs: job ? {
        ...job,
        departments: job.department_id ? deptMap.get(job.department_id) : null,
        job_locations: job.location_id ? locMap.get(job.location_id) : null,
      } : null
    }
  }) || []

  return (
    <OffersClient
      offers={offers || []}
      templates={templates || []}
      applications={enrichedApplications}
      organizationId={orgId}
      defaultCurrency={defaultCurrency}
    />
  )
}
