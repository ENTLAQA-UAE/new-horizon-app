import type { Metadata } from "next"
import { cookies } from "next/headers"
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js"
import ForgotPasswordContent from "./forgot-password-content"

export interface OrgBranding {
  name: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
}

/**
 * Fetch org branding server-side using the x-org-slug cookie set by middleware.
 * Uses the service role client to bypass RLS (this page is unauthenticated).
 */
async function getOrgBranding(): Promise<OrgBranding | null> {
  try {
    const cookieStore = await cookies()
    const orgSlug = cookieStore.get("x-org-slug")?.value

    if (!orgSlug) return null

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) return null

    const supabase = createSupabaseAdmin(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data } = await supabase
      .from("organizations")
      .select("name, logo_url, primary_color, secondary_color")
      .eq("slug", orgSlug)
      .single()

    if (!data) return null

    return {
      name: data.name,
      logo_url: data.logo_url,
      primary_color: data.primary_color || "#2D4CFF",
      secondary_color: data.secondary_color || "#6B7FFF",
    }
  } catch {
    return null
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getOrgBranding()

  if (branding) {
    return {
      title: `Forgot Password | ${branding.name}`,
    }
  }

  return {
    title: "Forgot Password | Kawadir ATS",
  }
}

export default async function ForgotPasswordPage() {
  const orgBranding = await getOrgBranding()

  return <ForgotPasswordContent initialOrgBranding={orgBranding} />
}
