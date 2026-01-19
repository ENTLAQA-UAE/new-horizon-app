// @ts-nocheck
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { NotificationSettingsClient } from "./notifications-client"

export default async function NotificationSettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // Get user profile and check permissions
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single()

  if (!profile?.org_id) {
    redirect("/onboarding")
  }

  // Only org_admin and super_admin can access
  if (!["org_admin", "super_admin"].includes(profile.role || "")) {
    redirect("/org")
  }

  // Get organization
  const { data: organization } = await supabase
    .from("organizations")
    .select("id, name, logo_url, primary_color")
    .eq("id", profile.org_id)
    .single()

  // Get all notification events
  const { data: events } = await supabase
    .from("notification_events")
    .select("*")
    .order("category")
    .order("name")

  // Get organization notification settings
  const { data: settings } = await supabase
    .from("org_notification_settings")
    .select("*")
    .eq("org_id", profile.org_id)

  // Get organization email templates
  const { data: templates } = await supabase
    .from("org_email_templates")
    .select("*")
    .eq("org_id", profile.org_id)

  // Get default email templates
  const { data: defaultTemplates } = await supabase
    .from("default_email_templates")
    .select("*")

  // Get team members for audience selection
  const { data: teamMembers } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("org_id", profile.org_id)
    .order("full_name")

  return (
    <NotificationSettingsClient
      organization={organization}
      events={events || []}
      settings={settings || []}
      templates={templates || []}
      defaultTemplates={defaultTemplates || []}
      teamMembers={teamMembers || []}
    />
  )
}
