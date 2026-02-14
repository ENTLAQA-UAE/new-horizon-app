import { createClient } from "@/lib/supabase/server"
import { SettingsClient } from "./settings-client"

async function getSettings() {
  const supabase = await createClient()

  const { data: settings, error } = await supabase
    .from("platform_settings")
    .select("*")
    .order("category")
    .order("key")

  if (error) {
    console.error("Error fetching settings:", error)
    return []
  }

  return settings || []
}

export default async function SettingsPage() {
  const settings = await getSettings()

  // Convert array to object for easier access.
  // JSONB values are already parsed by the Supabase client, so use them directly.
  // Also strip extra quotes from previously double-encoded string values.
  const settingsMap: Record<string, any> = {}
  settings.forEach((s) => {
    let val = s.value
    // Handle legacy double-encoded strings (e.g. '"Kawadir ATS"' stored in JSONB)
    if (typeof val === 'string' && val.length >= 2 && val.startsWith('"') && val.endsWith('"')) {
      try {
        val = JSON.parse(val)
      } catch {
        // keep as-is if parse fails
      }
    }
    settingsMap[s.key] = val
  })

  return <SettingsClient initialSettings={settingsMap} settingsRecords={settings} />
}
