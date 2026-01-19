"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
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
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Search,
  LogOut,
  User,
  Settings,
  Globe,
  Sparkles,
  Keyboard,
  Briefcase,
  Users,
  BarChart3,
} from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n"
import { useBranding } from "@/lib/branding/branding-context"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { cn } from "@/lib/utils"

interface HeaderProps {
  title?: string
  titleAr?: string
}

interface UserProfile {
  full_name: string | null
  email: string | null
  avatar_url: string | null
}

export function Header({ title, titleAr }: HeaderProps) {
  const router = useRouter()
  const { language, setLanguage, t } = useI18n()
  const branding = useBranding()
  const [commandOpen, setCommandOpen] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const displayTitle = language === "ar" && titleAr ? titleAr : title || t("nav.dashboard")

  // Fetch user profile
  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, email, avatar_url")
          .eq("id", user.id)
          .single()
        if (data) {
          setProfile(data)
        }
      }
    }
    fetchProfile()
  }, [])

  // Keyboard shortcut for search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Error signing out:", error)
        toast.error("Error signing out")
      }
    } catch (err) {
      console.error("Logout error:", err)
    }
    window.location.href = "/login"
  }

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en")
  }

  const getInitials = (name: string | null) => {
    if (!name) return "U"
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-xl px-6">
        {/* Left side - Title & Search */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div
              className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg"
              style={{ background: `var(--brand-gradient-subtle)` }}
            >
              <Sparkles
                className="h-4 w-4"
                style={{ color: `var(--brand-primary)` }}
              />
            </div>
            <h1 className="text-xl font-semibold">{displayTitle}</h1>
          </div>

          {/* Search Bar */}
          <button
            onClick={() => setCommandOpen(true)}
            className={cn(
              "hidden md:flex items-center gap-3 h-10 w-72 px-4 rounded-xl",
              "bg-muted/50 hover:bg-muted text-muted-foreground",
              "transition-all duration-200 hover:shadow-sm",
              "border border-transparent hover:border-border"
            )}
          >
            <Search className="h-4 w-4" />
            <span className="text-sm flex-1 text-left">{t("common.search")}...</span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLanguage}
            className="h-9 w-9 rounded-xl hover:bg-muted"
            title={language === "en" ? "العربية" : "English"}
          >
            <Globe className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <NotificationBell />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 gap-2 rounded-xl px-2 hover:bg-muted"
              >
                <Avatar className="h-8 w-8 border-2 border-border">
                  <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || "User"} />
                  <AvatarFallback
                    className="text-xs font-medium text-white"
                    style={{ background: `var(--brand-gradient)` }}
                  >
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">
                    {profile?.full_name || "User"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {branding.orgName}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile?.full_name || "User"}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 cursor-pointer">
                <User className="h-4 w-4" />
                {language === "ar" ? "الملف الشخصي" : "Profile"}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer">
                <Settings className="h-4 w-4" />
                {t("nav.settings")}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer">
                <Keyboard className="h-4 w-4" />
                {language === "ar" ? "اختصارات لوحة المفاتيح" : "Keyboard shortcuts"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive cursor-pointer">
                <LogOut className="h-4 w-4" />
                {t("nav.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Command Palette */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder={language === "ar" ? "ابحث عن..." : "Type a command or search..."} />
        <CommandList>
          <CommandEmpty>{language === "ar" ? "لا توجد نتائج" : "No results found."}</CommandEmpty>
          <CommandGroup heading={language === "ar" ? "تنقل سريع" : "Quick Navigation"}>
            <CommandItem onSelect={() => { router.push("/org"); setCommandOpen(false) }}>
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>{language === "ar" ? "لوحة التحكم" : "Dashboard"}</span>
            </CommandItem>
            <CommandItem onSelect={() => { router.push("/org/jobs"); setCommandOpen(false) }}>
              <Briefcase className="mr-2 h-4 w-4" />
              <span>{language === "ar" ? "الوظائف" : "Jobs"}</span>
            </CommandItem>
            <CommandItem onSelect={() => { router.push("/org/candidates"); setCommandOpen(false) }}>
              <Users className="mr-2 h-4 w-4" />
              <span>{language === "ar" ? "المرشحين" : "Candidates"}</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading={language === "ar" ? "الإعدادات" : "Settings"}>
            <CommandItem onSelect={() => { router.push("/org/settings"); setCommandOpen(false) }}>
              <Settings className="mr-2 h-4 w-4" />
              <span>{language === "ar" ? "الإعدادات العامة" : "General Settings"}</span>
            </CommandItem>
            <CommandItem onSelect={() => { router.push("/org/branding"); setCommandOpen(false) }}>
              <Sparkles className="mr-2 h-4 w-4" />
              <span>{language === "ar" ? "الهوية البصرية" : "Branding"}</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
