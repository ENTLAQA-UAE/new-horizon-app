"use client"

import { Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useI18n, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface LanguageSwitcherProps {
  variant?: "icon" | "text" | "full"
  className?: string
}

const languages: { code: Language; name: string; nativeName: string; flag: string }[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
]

export function LanguageSwitcher({ variant = "icon", className }: LanguageSwitcherProps) {
  const { language, setLanguage, isRTL } = useI18n()

  const currentLanguage = languages.find((l) => l.code === language)

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
  }

  if (variant === "text") {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleLanguageChange(language === "en" ? "ar" : "en")}
        className={cn("gap-2", className)}
      >
        {language === "en" ? "العربية" : "English"}
      </Button>
    )
  }

  if (variant === "full") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={cn("gap-2", className)}>
            <span>{currentLanguage?.flag}</span>
            <span>{currentLanguage?.nativeName}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isRTL ? "start" : "end"}>
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={cn(
                "gap-2 cursor-pointer",
                language === lang.code && "bg-accent"
              )}
            >
              <span>{lang.flag}</span>
              <span>{lang.nativeName}</span>
              <span className="text-muted-foreground">({lang.name})</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Default: icon variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className}>
          <Globe className="h-5 w-5" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRTL ? "start" : "end"}>
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={cn(
              "gap-2 cursor-pointer",
              language === lang.code && "bg-accent"
            )}
          >
            <span>{lang.flag}</span>
            <span>{lang.nativeName}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Simple toggle button for switching between English and Arabic
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { language, setLanguage } = useI18n()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLanguage(language === "en" ? "ar" : "en")}
      className={cn(
        "min-w-[80px] font-medium",
        language === "ar" && "font-arabic",
        className
      )}
    >
      {language === "en" ? "العربية" : "English"}
    </Button>
  )
}
