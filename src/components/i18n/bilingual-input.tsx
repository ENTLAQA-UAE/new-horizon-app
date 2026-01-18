"use client"

import { useState } from "react"
import { Languages } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export interface BilingualValue {
  en: string
  ar: string
}

interface BilingualInputProps {
  id?: string
  label?: string
  value: BilingualValue
  onChange: (value: BilingualValue) => void
  placeholder?: { en?: string; ar?: string }
  required?: boolean
  disabled?: boolean
  className?: string
  error?: string
}

/**
 * Bilingual text input for English and Arabic content
 */
export function BilingualInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  className,
  error,
}: BilingualInputProps) {
  const [activeTab, setActiveTab] = useState<"en" | "ar">("en")

  const handleChange = (lang: "en" | "ar", text: string) => {
    onChange({
      ...value,
      [lang]: text,
    })
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={id} className="flex items-center gap-2">
          <Languages className="h-4 w-4 text-muted-foreground" />
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "en" | "ar")}>
        <TabsList className="grid w-full grid-cols-2 h-8">
          <TabsTrigger value="en" className="text-xs">
            English
          </TabsTrigger>
          <TabsTrigger value="ar" className="text-xs font-arabic">
            العربية
          </TabsTrigger>
        </TabsList>
        <TabsContent value="en" className="mt-2">
          <Input
            id={id}
            dir="ltr"
            value={value.en}
            onChange={(e) => handleChange("en", e.target.value)}
            placeholder={placeholder?.en || "Enter text in English..."}
            disabled={disabled}
            className={cn(error && "border-destructive")}
          />
        </TabsContent>
        <TabsContent value="ar" className="mt-2">
          <Input
            id={`${id}-ar`}
            dir="rtl"
            value={value.ar}
            onChange={(e) => handleChange("ar", e.target.value)}
            placeholder={placeholder?.ar || "أدخل النص بالعربية..."}
            disabled={disabled}
            className={cn("font-arabic text-right", error && "border-destructive")}
          />
        </TabsContent>
      </Tabs>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

interface BilingualTextareaProps extends BilingualInputProps {
  rows?: number
}

/**
 * Bilingual textarea for English and Arabic content
 */
export function BilingualTextarea({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  className,
  error,
  rows = 4,
}: BilingualTextareaProps) {
  const [activeTab, setActiveTab] = useState<"en" | "ar">("en")

  const handleChange = (lang: "en" | "ar", text: string) => {
    onChange({
      ...value,
      [lang]: text,
    })
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={id} className="flex items-center gap-2">
          <Languages className="h-4 w-4 text-muted-foreground" />
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "en" | "ar")}>
        <TabsList className="grid w-full grid-cols-2 h-8">
          <TabsTrigger value="en" className="text-xs">
            English
          </TabsTrigger>
          <TabsTrigger value="ar" className="text-xs font-arabic">
            العربية
          </TabsTrigger>
        </TabsList>
        <TabsContent value="en" className="mt-2">
          <Textarea
            id={id}
            dir="ltr"
            rows={rows}
            value={value.en}
            onChange={(e) => handleChange("en", e.target.value)}
            placeholder={placeholder?.en || "Enter text in English..."}
            disabled={disabled}
            className={cn(error && "border-destructive")}
          />
        </TabsContent>
        <TabsContent value="ar" className="mt-2">
          <Textarea
            id={`${id}-ar`}
            dir="rtl"
            rows={rows}
            value={value.ar}
            onChange={(e) => handleChange("ar", e.target.value)}
            placeholder={placeholder?.ar || "أدخل النص بالعربية..."}
            disabled={disabled}
            className={cn("font-arabic text-right", error && "border-destructive")}
          />
        </TabsContent>
      </Tabs>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

interface BilingualSideBySideInputProps extends BilingualInputProps {
  labelEn?: string
  labelAr?: string
}

/**
 * Side-by-side bilingual input showing both languages at once
 */
export function BilingualSideBySideInput({
  id,
  label,
  labelEn = "English",
  labelAr = "العربية",
  value,
  onChange,
  placeholder,
  required,
  disabled,
  className,
  error,
}: BilingualSideBySideInputProps) {
  const handleChange = (lang: "en" | "ar", text: string) => {
    onChange({
      ...value,
      [lang]: text,
    })
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="flex items-center gap-2">
          <Languages className="h-4 w-4 text-muted-foreground" />
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor={id} className="text-xs text-muted-foreground">
            {labelEn}
          </Label>
          <Input
            id={id}
            dir="ltr"
            value={value.en}
            onChange={(e) => handleChange("en", e.target.value)}
            placeholder={placeholder?.en || "Enter text in English..."}
            disabled={disabled}
            className={cn(error && "border-destructive")}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${id}-ar`} className="text-xs text-muted-foreground font-arabic">
            {labelAr}
          </Label>
          <Input
            id={`${id}-ar`}
            dir="rtl"
            value={value.ar}
            onChange={(e) => handleChange("ar", e.target.value)}
            placeholder={placeholder?.ar || "أدخل النص بالعربية..."}
            disabled={disabled}
            className={cn("font-arabic text-right", error && "border-destructive")}
          />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

/**
 * Display bilingual content with automatic language switching
 */
interface BilingualDisplayProps {
  value: BilingualValue
  className?: string
  fallbackToOther?: boolean
}

export function BilingualDisplay({
  value,
  className,
  fallbackToOther = true,
}: BilingualDisplayProps) {
  // This would typically use the useI18n hook, but for simplicity
  // we'll check the document direction
  const isRTL = typeof document !== "undefined" && document.dir === "rtl"
  const currentLang = isRTL ? "ar" : "en"
  const otherLang = isRTL ? "en" : "ar"

  let displayValue = value[currentLang]
  if (!displayValue && fallbackToOther) {
    displayValue = value[otherLang]
  }

  return (
    <span
      className={cn(currentLang === "ar" && "font-arabic", className)}
      dir={currentLang === "ar" ? "rtl" : "ltr"}
    >
      {displayValue}
    </span>
  )
}

/**
 * Hook for managing bilingual form values
 */
export function useBilingualValue(initialValue?: BilingualValue) {
  const [value, setValue] = useState<BilingualValue>(
    initialValue || { en: "", ar: "" }
  )

  const reset = () => setValue({ en: "", ar: "" })

  const isValid = (requireBoth = false) => {
    if (requireBoth) {
      return value.en.trim() !== "" && value.ar.trim() !== ""
    }
    return value.en.trim() !== "" || value.ar.trim() !== ""
  }

  return {
    value,
    setValue,
    reset,
    isValid,
    isEmpty: !value.en && !value.ar,
  }
}
