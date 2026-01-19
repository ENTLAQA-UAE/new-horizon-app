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

  // Fetch applications that are in offer stage for this organization
  // Split into simpler queries to avoid TypeScript "excessively deep" type inference
  const { data: applications } = await supabase
    .from("applications")
    .select(`
      id,
      candidates (
        id,
        first_name,
        last_name,
        email
      ),
      jobs (
        id,
        title,
        department_id,
        location_id
      )
    `)
    .eq("organization_id", orgId)
    .eq("status", "offer")
    .order("created_at", { ascending: false })

  // Fetch departments and locations separately to avoid deep nesting
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .eq("org_id", orgId)

  const { data: locations } = await supabase
    .from("job_locations")
    .select("id, name, city")
    .eq("org_id", orgId)

  // Create lookup maps for efficient joining
  const deptMap = new Map(departments?.map(d => [d.id, d]) || [])
  const locMap = new Map(locations?.map(l => [l.id, l]) || [])

  // Enrich applications with department and location data
  const enrichedApplications = applications?.map(app => ({
    ...app,
    jobs: app.jobs ? {
      ...app.jobs,
      departments: app.jobs.department_id ? deptMap.get(app.jobs.department_id) : null,
      job_locations: app.jobs.location_id ? locMap.get(app.jobs.location_id) : null,
    } : null
  })) || []

  return (
    <OffersClient
      offers={offers || []}
      templates={templates || []}
      applications={enrichedApplications}
      organizationId={orgId}
    />
  )
}
