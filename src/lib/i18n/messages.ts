/**
 * Message loading utilities for i18n
 * Loads translation files from the messages directory
 */

// English translations
import commonEn from '@/messages/en/common.json'
import authEn from '@/messages/en/auth.json'
import dashboardEn from '@/messages/en/dashboard.json'
import jobsEn from '@/messages/en/jobs.json'
import candidatesEn from '@/messages/en/candidates.json'
import applicationsEn from '@/messages/en/applications.json'
import interviewsEn from '@/messages/en/interviews.json'
import offersEn from '@/messages/en/offers.json'
import settingsEn from '@/messages/en/settings.json'
import errorsEn from '@/messages/en/errors.json'
import navEn from '@/messages/en/nav.json'

// Arabic translations
import commonAr from '@/messages/ar/common.json'
import authAr from '@/messages/ar/auth.json'
import dashboardAr from '@/messages/ar/dashboard.json'
import jobsAr from '@/messages/ar/jobs.json'
import candidatesAr from '@/messages/ar/candidates.json'
import applicationsAr from '@/messages/ar/applications.json'
import interviewsAr from '@/messages/ar/interviews.json'
import offersAr from '@/messages/ar/offers.json'
import settingsAr from '@/messages/ar/settings.json'
import errorsAr from '@/messages/ar/errors.json'
import navAr from '@/messages/ar/nav.json'

export const messages = {
  en: {
    common: commonEn,
    auth: authEn,
    dashboard: dashboardEn,
    jobs: jobsEn,
    candidates: candidatesEn,
    applications: applicationsEn,
    interviews: interviewsEn,
    offers: offersEn,
    settings: settingsEn,
    errors: errorsEn,
    nav: navEn,
  },
  ar: {
    common: commonAr,
    auth: authAr,
    dashboard: dashboardAr,
    jobs: jobsAr,
    candidates: candidatesAr,
    applications: applicationsAr,
    interviews: interviewsAr,
    offers: offersAr,
    settings: settingsAr,
    errors: errorsAr,
    nav: navAr,
  },
} as const

export type Language = keyof typeof messages
export type MessageNamespace = keyof typeof messages.en
export type Messages = typeof messages.en

/**
 * Get all messages for a specific language
 */
export function getMessages(language: Language) {
  return messages[language]
}

/**
 * Get a specific namespace of messages
 */
export function getNamespaceMessages<T extends MessageNamespace>(
  language: Language,
  namespace: T
): typeof messages.en[T] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (messages[language] as any)[namespace]
}

/**
 * Helper to get nested translation value by key path
 * e.g., getTranslation('en', 'common.actions.save')
 */
export function getTranslation(
  language: Language,
  keyPath: string
): string {
  const keys = keyPath.split('.')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = messages[language]

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key]
    } else {
      return keyPath // Return the key path if translation not found
    }
  }

  return typeof value === 'string' ? value : keyPath
}

/**
 * Interpolate variables in a translation string
 * e.g., interpolate('Hello {name}', { name: 'John' }) => 'Hello John'
 */
export function interpolate(
  template: string,
  variables: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return key in variables ? String(variables[key]) : match
  })
}

/**
 * Get translation with variable interpolation
 */
export function t(
  language: Language,
  keyPath: string,
  variables?: Record<string, string | number>
): string {
  const translation = getTranslation(language, keyPath)
  return variables ? interpolate(translation, variables) : translation
}
