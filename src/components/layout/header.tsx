"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Search, LogOut, User, Settings, Globe } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n"

interface HeaderProps {
  title?: string
  titleAr?: string
}

export function Header({ title, titleAr }: HeaderProps) {
  const router = useRouter()
  const { language, setLanguage, t } = useI18n()

  const displayTitle = language === "ar" && titleAr ? titleAr : title || t.nav.dashboard

  const handleLogout = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error("Error signing out")
      return
    }
    router.push("/login")
    router.refresh()
  }

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en")
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-6">
      {/* Title & Search */}
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-semibold">{displayTitle}</h1>
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:left-auto rtl:right-3" />
          <Input
            placeholder={t.common.search + "..."}
            className="w-64 pl-9 rtl:pl-3 rtl:pr-9 bg-muted/50"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Language Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleLanguage} title={language === "en" ? "العربية" : "English"}>
          <Globe className="h-5 w-5" />
          <span className="sr-only">{language === "en" ? "العربية" : "English"}</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 rtl:right-auto rtl:left-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src="" alt="User" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>{language === "ar" ? "حسابي" : "My Account"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 rtl:mr-0 rtl:ml-2 h-4 w-4" />
              {language === "ar" ? "الملف الشخصي" : "Profile"}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 rtl:mr-0 rtl:ml-2 h-4 w-4" />
              {t.nav.settings}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 rtl:mr-0 rtl:ml-2 h-4 w-4" />
              {t.nav.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
