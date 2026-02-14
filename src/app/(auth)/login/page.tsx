import type { Metadata } from "next"
import { cookies } from "next/headers"
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js"
import LoginContent, { type OrgBranding } from "./login-content"

/**
 * Fetch org branding server-side using the x-org-slug cookie set by middleware.
 * Uses the service role client to bypass RLS (the login page is unauthenticated).
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
      .select("name, logo_url, favicon_url, primary_color, secondary_color, login_image_url")
      .eq("slug", orgSlug)
      .single()

    if (!data) return null

    return {
      name: data.name,
      logo_url: data.logo_url,
      favicon_url: (data as Record<string, unknown>).favicon_url as string | null ?? null,
      primary_color: data.primary_color || "#2D4CFF",
      secondary_color: data.secondary_color || "#6B7FFF",
      login_image_url: data.login_image_url || null,
    }
  } catch {
    return null
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getOrgBranding()

  if (branding) {
    return {
      title: `Login | ${branding.name}`,
      icons: branding.favicon_url
        ? { icon: branding.favicon_url }
        : branding.logo_url
          ? { icon: branding.logo_url }
          : undefined,
    }
  }

  return {
    title: "Login | Kawadir ATS",
  }
}

export default async function LoginPage() {
  const orgBranding = await getOrgBranding()

  return <LoginContent initialOrgBranding={orgBranding} />
}
