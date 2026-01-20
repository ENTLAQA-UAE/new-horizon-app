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

  // Convert array to object for easier access, parsing JSON values
  const settingsMap: Record<string, any> = {}
  settings.forEach((s) => {
    try {
      // Parse the JSON value - values are stored as JSON strings
      settingsMap[s.key] = typeof s.value === 'string' ? JSON.parse(s.value) : s.value
    } catch {
      // If parsing fails, use the raw value
      settingsMap[s.key] = s.value
    }
  })

  return <SettingsClient initialSettings={settingsMap} settingsRecords={settings} />
}
