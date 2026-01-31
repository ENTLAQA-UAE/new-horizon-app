import { cookies } from "next/headers"
import { t as translate, type Language } from "./messages"

const STORAGE_KEY = "jadarat-lang"

/**
 * Get the current language from cookies (for server components)
 */
export async function getServerLanguage(): Promise<Language> {
  const cookieStore = await cookies()
  const lang = cookieStore.get(STORAGE_KEY)?.value
  if (lang === "ar" || lang === "en") {
    return lang
  }
  return "en" // Default to English
}

/**
 * Get a translation function bound to the current server language
 * Usage in server components:
 *   const { t, language, isRTL } = await getServerTranslation()
 *   t("common.save") // Returns translated string
 */
export async function getServerTranslation() {
  const language = await getServerLanguage()
  return {
    language,
    isRTL: language === "ar",
    dir: (language === "ar" ? "rtl" : "ltr") as "ltr" | "rtl",
    t: (keyPath: string, variables?: Record<string, string | number>) =>
      translate(language, keyPath, variables),
  }
}
