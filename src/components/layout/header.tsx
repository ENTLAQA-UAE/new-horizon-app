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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
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
  Sun,
  Moon,
  Monitor,
  Palette,
  CalendarDays,
  FileText,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n"
import { useBranding } from "@/lib/branding/branding-context"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { cn } from "@/lib/utils"
import { useTheme } from "@/lib/theme/theme-context"

interface HeaderProps {
  title?: string
  titleAr?: string
}

interface UserProfile {
  first_name: string | null
  last_name: string | null
  email: string | null
  avatar_url: string | null
}

export function Header({ title, titleAr }: HeaderProps) {
  const router = useRouter()
  const { language, setLanguage, t, isRTL } = useI18n()
  const branding = useBranding()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [commandOpen, setCommandOpen] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const displayTitle = language === "ar" && titleAr ? titleAr : title || t("nav.dashboard")

  // Fetch user profile
  useEffect(() => {
    let isMounted = true

    async function fetchProfile() {
      const supabase = createClient()

      try {
        // Use getUser to verify the session is still valid (prevents showing wrong user)
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user || !isMounted) return

        // Add timeout to profile fetch to prevent hanging
        const profilePromise = supabase
          .from("profiles")
          .select("first_name, last_name, email, avatar_url")
          .eq("id", user.id)
          .single()

        const timeoutPromise = new Promise<{ data: null }>((resolve) =>
          setTimeout(() => resolve({ data: null }), 5000)
        )

        const { data } = await Promise.race([profilePromise, timeoutPromise])

        if (data && isMounted) {
          setProfile(data)
        }
      } catch (error) {
        // Silently handle errors - profile will show default values
        console.error("Error fetching profile:", error)
      }
    }

    fetchProfile()

    return () => {
      isMounted = false
    }
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

      // Add timeout to signOut to prevent hanging on stale sessions
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise<{ error: Error }>((resolve) =>
        setTimeout(() => resolve({ error: new Error("Sign out timeout") }), 3000)
      )

      const { error } = await Promise.race([signOutPromise, timeoutPromise])

      if (error) {
        console.error("Error signing out:", error)
        // Don't show error toast, just proceed with redirect
      }
    } catch (err) {
      console.error("Logout error:", err)
      // Continue to redirect even if there's an error
    }

    // Always redirect to login, even if signOut had issues
    window.location.href = "/login"
  }

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en")
  }

  const getFullName = () => {
    if (!profile?.first_name && !profile?.last_name) return null
    return `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim()
  }

  const getInitials = () => {
    const first = profile?.first_name?.[0] || ""
    const last = profile?.last_name?.[0] || ""
    return (first + last).toUpperCase() || "U"
  }

  const ThemeIcon = resolvedTheme === "dark" ? Moon : Sun

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-6">
        {/* Left side - Title & Search */}
        <div className="flex items-center gap-4">
          {/* Page Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">{displayTitle}</h1>
          </div>

          {/* Search Bar */}
          <button
            onClick={() => setCommandOpen(true)}
            className={cn(
              "hidden lg:flex items-center gap-3 h-10 w-80 px-4 rounded-xl",
              "bg-muted/40 hover:bg-muted/60 text-muted-foreground",
              "transition-all duration-200",
              "border border-border/50 hover:border-border"
            )}
          >
            <Search className="h-4 w-4" />
            <span className="text-sm flex-1 text-left">{t("common.search")}...</span>
            <kbd className="pointer-events-none hidden h-6 select-none items-center gap-1 rounded-md border border-border bg-muted/50 px-2 font-mono text-[10px] font-medium sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-1">
          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCommandOpen(true)}
            className="lg:hidden h-9 w-9 rounded-xl hover:bg-muted/60"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-muted/60"
              >
                <ThemeIcon className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}>
                <DropdownMenuRadioItem value="light" className="gap-2 cursor-pointer">
                  <Sun className="h-4 w-4" />
                  {language === "ar" ? "فاتح" : "Light"}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark" className="gap-2 cursor-pointer">
                  <Moon className="h-4 w-4" />
                  {language === "ar" ? "داكن" : "Dark"}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system" className="gap-2 cursor-pointer">
                  <Monitor className="h-4 w-4" />
                  {language === "ar" ? "النظام" : "System"}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLanguage}
            className="h-9 w-9 rounded-xl hover:bg-muted/60"
            title={language === "en" ? "العربية" : "English"}
          >
            <Globe className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <NotificationBell />

          {/* Divider */}
          <div className="h-6 w-px bg-border/50 mx-2" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 gap-3 rounded-xl px-2 hover:bg-muted/60 transition-all"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8 ring-2 ring-border">
                    <AvatarImage src={profile?.avatar_url || ""} alt={getFullName() || "User"} />
                    <AvatarFallback
                      className="text-xs font-semibold text-white"
                      style={{ background: `var(--brand-gradient)` }}
                    >
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online indicator */}
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium leading-tight">
                    {getFullName() || "User"}
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-tight">
                    {branding.orgName}
                  </span>
                </div>
                <ChevronRight className={cn(
                  "h-4 w-4 text-muted-foreground hidden md:block transition-transform",
                  isRTL && "rotate-180"
                )} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end">
              {/* User Info Header */}
              <div className="p-3 bg-muted/30 rounded-lg mx-2 mt-2 mb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-border">
                    <AvatarImage src={profile?.avatar_url || ""} alt={getFullName() || "User"} />
                    <AvatarFallback
                      className="text-sm font-semibold text-white"
                      style={{ background: `var(--brand-gradient)` }}
                    >
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{getFullName() || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                  </div>
                </div>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => router.push("/org/settings")}
                className="gap-3 cursor-pointer py-2.5"
              >
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{language === "ar" ? "الملف الشخصي" : "Profile"}</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => router.push("/org/settings")}
                className="gap-3 cursor-pointer py-2.5"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>{t("nav.settings")}</span>
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-3 py-2.5">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <span>{language === "ar" ? "المظهر" : "Appearance"}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}>
                    <DropdownMenuRadioItem value="light" className="gap-2">
                      <Sun className="h-4 w-4" />
                      {language === "ar" ? "فاتح" : "Light"}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark" className="gap-2">
                      <Moon className="h-4 w-4" />
                      {language === "ar" ? "داكن" : "Dark"}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system" className="gap-2">
                      <Monitor className="h-4 w-4" />
                      {language === "ar" ? "النظام" : "System"}
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuItem className="gap-3 cursor-pointer py-2.5">
                <Keyboard className="h-4 w-4 text-muted-foreground" />
                <span>{language === "ar" ? "اختصارات لوحة المفاتيح" : "Keyboard shortcuts"}</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                className="gap-3 text-destructive cursor-pointer py-2.5 focus:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                <span>{t("nav.logout")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Command Palette */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <div className="flex items-center border-b px-4 gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <CommandInput
            placeholder={language === "ar" ? "ابحث أو اكتب أمر..." : "Search or type a command..."}
            className="border-0 focus:ring-0"
          />
        </div>
        <CommandList className="max-h-[400px]">
          <CommandEmpty className="py-12 text-center">
            <div className="flex flex-col items-center gap-2">
              <Search className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">{language === "ar" ? "لا توجد نتائج" : "No results found"}</p>
            </div>
          </CommandEmpty>

          <CommandGroup heading={language === "ar" ? "تنقل سريع" : "Quick Navigation"}>
            <CommandItem
              onSelect={() => { router.push("/org"); setCommandOpen(false) }}
              className="gap-3 py-3"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{language === "ar" ? "لوحة التحكم" : "Dashboard"}</span>
                <span className="text-xs text-muted-foreground">{language === "ar" ? "عرض التحليلات والإحصائيات" : "View analytics and statistics"}</span>
              </div>
            </CommandItem>
            <CommandItem
              onSelect={() => { router.push("/org/jobs"); setCommandOpen(false) }}
              className="gap-3 py-3"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
                <Briefcase className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{language === "ar" ? "الوظائف" : "Jobs"}</span>
                <span className="text-xs text-muted-foreground">{language === "ar" ? "إدارة الوظائف المفتوحة" : "Manage open positions"}</span>
              </div>
            </CommandItem>
            <CommandItem
              onSelect={() => { router.push("/org/candidates"); setCommandOpen(false) }}
              className="gap-3 py-3"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
                <Users className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{language === "ar" ? "المرشحين" : "Candidates"}</span>
                <span className="text-xs text-muted-foreground">{language === "ar" ? "عرض وإدارة المرشحين" : "View and manage candidates"}</span>
              </div>
            </CommandItem>
            <CommandItem
              onSelect={() => { router.push("/org/interviews"); setCommandOpen(false) }}
              className="gap-3 py-3"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
                <CalendarDays className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{language === "ar" ? "المقابلات" : "Interviews"}</span>
                <span className="text-xs text-muted-foreground">{language === "ar" ? "جدولة المقابلات" : "Schedule and manage interviews"}</span>
              </div>
            </CommandItem>
            <CommandItem
              onSelect={() => { router.push("/org/applications"); setCommandOpen(false) }}
              className="gap-3 py-3"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{language === "ar" ? "الطلبات" : "Applications"}</span>
                <span className="text-xs text-muted-foreground">{language === "ar" ? "مراجعة طلبات التوظيف" : "Review job applications"}</span>
              </div>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading={language === "ar" ? "الإعدادات" : "Settings"}>
            <CommandItem
              onSelect={() => { router.push("/org/settings"); setCommandOpen(false) }}
              className="gap-3 py-3"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
                <Settings className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{language === "ar" ? "الإعدادات العامة" : "General Settings"}</span>
                <span className="text-xs text-muted-foreground">{language === "ar" ? "تخصيص إعدادات المؤسسة" : "Customize organization settings"}</span>
              </div>
            </CommandItem>
            <CommandItem
              onSelect={() => { router.push("/org/branding"); setCommandOpen(false) }}
              className="gap-3 py-3"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{language === "ar" ? "الهوية البصرية" : "Branding"}</span>
                <span className="text-xs text-muted-foreground">{language === "ar" ? "تخصيص المظهر والألوان" : "Customize appearance and colors"}</span>
              </div>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
