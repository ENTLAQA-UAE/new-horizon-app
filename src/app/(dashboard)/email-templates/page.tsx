import { createClient } from "@/lib/supabase/server"
import { EmailTemplatesClient } from "./email-templates-client"

async function getEmailTemplates() {
  const supabase = await createClient()

  const { data: templates, error } = await supabase
    .from("email_templates")
    .select("*")
    .is("org_id", null)
    .eq("is_system", true)
    .order("category")
    .order("name")

  if (error) {
    console.error("Error fetching email templates:", error)
    return []
  }

  return templates || []
}

export default async function EmailTemplatesPage() {
  const templates = await getEmailTemplates()

  return <EmailTemplatesClient initialTemplates={templates} />
}
