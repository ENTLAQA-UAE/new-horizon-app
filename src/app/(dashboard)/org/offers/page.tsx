import { createClient } from "@/lib/supabase/server"
import { OffersClient } from "./offers-client"

export default async function OffersPage() {
  const supabase = await createClient()

  // Fetch offers with related data
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
    .order("created_at", { ascending: false })

  // Fetch offer templates
  const { data: templates } = await supabase
    .from("offer_templates")
    .select("*")
    .eq("is_active", true)
    .order("name")

  // Fetch applications that are in offer stage
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
    .eq("status", "offer")
    .order("created_at", { ascending: false })

  return (
    <OffersClient
      offers={offers || []}
      templates={templates || []}
      applications={applications || []}
    />
  )
}
