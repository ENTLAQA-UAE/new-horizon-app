"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { messages, getTranslation, interpolate, type Language, type Messages, type MessageNamespace } from "./messages"

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  messages: Messages
  t: (keyPath: string, variables?: Record<string, string | number>) => string
  dir: "ltr" | "rtl"
  isRTL: boolean
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const STORAGE_KEY = "kawadir-lang"

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Check localStorage for saved language preference
    const savedLang = localStorage.getItem(STORAGE_KEY) as Language
    if (savedLang && (savedLang === "en" || savedLang === "ar")) {
      setLanguageState(savedLang)
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    // Update document direction and lang when language changes
    if (mounted) {
      document.documentElement.dir = language === "ar" ? "rtl" : "ltr"
      document.documentElement.lang = language
      // Update font family based on language
      document.body.style.fontFamily = language === "ar"
        ? '"IBM Plex Sans Arabic", system-ui, -apple-system, sans-serif'
        : '"Poppins", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }
  }, [language, mounted])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(STORAGE_KEY, lang)
    // Also set a cookie so server components can read the language
    document.cookie = `${STORAGE_KEY}=${lang};path=/;max-age=31536000;SameSite=Lax`
  }, [])

  const t = useCallback((keyPath: string, variables?: Record<string, string | number>) => {
    const translation = getTranslation(language, keyPath)
    return variables ? interpolate(translation, variables) : translation
  }, [language])

  const value: I18nContextType = {
    language,
    setLanguage,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: messages[language] as any,
    t,
    dir: language === "ar" ? "rtl" : "ltr",
    isRTL: language === "ar",
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}

/**
 * Hook for getting translations
 */
export function useTranslation() {
  const { t, language, isRTL, messages } = useI18n()
  return { t, language, isRTL, messages }
}

/**
 * Hook for getting a specific namespace of translations
 */
export function useNamespace<T extends MessageNamespace>(namespace: T) {
  const { messages, language, isRTL } = useI18n()
  return {
    messages: messages[namespace] as Messages[T],
    language,
    isRTL,
  }
}

/**
 * Hook for RTL-aware styling
 */
export function useRTL() {
  const { isRTL, dir } = useI18n()

  return {
    isRTL,
    dir,
    // Returns the appropriate value based on direction
    rtlValue: <T,>(ltrValue: T, rtlValue: T) => isRTL ? rtlValue : ltrValue,
    // Returns RTL-aware class names
    rtlClass: (ltrClass: string, rtlClass: string) => isRTL ? rtlClass : ltrClass,
    // Flip left/right in class names
    flipClass: (className: string) => {
      if (!isRTL) return className
      return className
        .replace(/\bleft\b/g, '__RIGHT__')
        .replace(/\bright\b/g, 'left')
        .replace(/__RIGHT__/g, 'right')
        .replace(/\bpl-/g, '__PR__')
        .replace(/\bpr-/g, 'pl-')
        .replace(/__PR__/g, 'pr-')
        .replace(/\bml-/g, '__MR__')
        .replace(/\bmr-/g, 'ml-')
        .replace(/__MR__/g, 'mr-')
    },
  }
}
