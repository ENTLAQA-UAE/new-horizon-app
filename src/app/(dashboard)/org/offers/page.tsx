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
        departments (
          name
        ),
        location_id,
        job_locations (
          name,
          city
        )
      )
    `)
    .eq("organization_id", orgId)
    .eq("status", "offer")
    .order("created_at", { ascending: false })

  return (
    <OffersClient
      offers={offers || []}
      templates={templates || []}
      applications={applications || []}
      organizationId={orgId}
    />
  )
}
