/**
 * Tests for RBAC navigation configuration and filtering.
 * Tests the pure navigation lookup and filtering functions.
 */

import {
  getNavigationForRole,
  filterNavigationByPermissions,
  superAdminNavigation,
  orgAdminNavigation,
  recruiterNavigation,
  hiringManagerNavigation,
  candidateNavigation,
  type NavigationSection,
} from "@/lib/rbac/navigation"

describe("RBAC Navigation", () => {
  describe("getNavigationForRole", () => {
    it("returns super admin navigation for super_admin role", () => {
      const nav = getNavigationForRole("super_admin")
      expect(nav).toBe(superAdminNavigation)
      expect(nav.length).toBeGreaterThan(0)
    })

    it("returns org admin navigation for org_admin role", () => {
      const nav = getNavigationForRole("org_admin")
      expect(nav).toBe(orgAdminNavigation)
    })

    it("returns org admin navigation for hr_manager role", () => {
      // HR manager gets same structure as org admin, filtered by permissions
      const nav = getNavigationForRole("hr_manager")
      expect(nav).toBe(orgAdminNavigation)
    })

    it("returns recruiter navigation for recruiter role", () => {
      const nav = getNavigationForRole("recruiter")
      expect(nav).toBe(recruiterNavigation)
    })

    it("returns hiring manager navigation for hiring_manager role", () => {
      const nav = getNavigationForRole("hiring_manager")
      expect(nav).toBe(hiringManagerNavigation)
    })

    it("returns candidate navigation for candidate role", () => {
      const nav = getNavigationForRole("candidate")
      expect(nav).toBe(candidateNavigation)
    })

    it("returns empty array for unknown role", () => {
      const nav = getNavigationForRole("unknown_role" as any)
      expect(nav).toEqual([])
    })
  })

  describe("navigation structure", () => {
    it("super admin has platform section with dashboard", () => {
      const platform = superAdminNavigation.find((s) => s.id === "platform")
      expect(platform).toBeDefined()
      const dashboard = platform!.items.find((i) => i.id === "dashboard")
      expect(dashboard).toBeDefined()
      expect(dashboard!.href).toBe("/")
    })

    it("super admin has organizations, users, tiers, billing items", () => {
      const platform = superAdminNavigation.find((s) => s.id === "platform")
      const itemIds = platform!.items.map((i) => i.id)
      expect(itemIds).toContain("organizations")
      expect(itemIds).toContain("users")
      expect(itemIds).toContain("tiers")
      expect(itemIds).toContain("billing")
    })

    it("org admin has recruitment section with jobs, candidates, applications", () => {
      const recruitment = orgAdminNavigation.find(
        (s) => s.id === "recruitment"
      )
      expect(recruitment).toBeDefined()
      const itemIds = recruitment!.items.map((i) => i.id)
      expect(itemIds).toContain("jobs")
      expect(itemIds).toContain("candidates")
      expect(itemIds).toContain("applications")
    })

    it("recruiter navigation has recruitment section", () => {
      const recruitment = recruiterNavigation.find(
        (s) => s.id === "recruitment"
      )
      expect(recruitment).toBeDefined()
      const itemIds = recruitment!.items.map((i) => i.id)
      expect(itemIds).toContain("jobs")
      expect(itemIds).toContain("candidates")
    })

    it("candidate navigation has portal section", () => {
      const portal = candidateNavigation.find((s) => s.id === "portal")
      expect(portal).toBeDefined()
      const itemIds = portal!.items.map((i) => i.id)
      expect(itemIds).toContain("dashboard")
      expect(itemIds).toContain("applications")
      expect(itemIds).toContain("interviews")
      expect(itemIds).toContain("profile")
    })

    it("all navigation items have both English and Arabic titles", () => {
      const allNavs = [
        ...superAdminNavigation,
        ...orgAdminNavigation,
        ...recruiterNavigation,
        ...hiringManagerNavigation,
        ...candidateNavigation,
      ]

      for (const section of allNavs) {
        expect(section.title).toBeTruthy()
        expect(section.titleAr).toBeTruthy()
        for (const item of section.items) {
          expect(item.title).toBeTruthy()
          expect(item.titleAr).toBeTruthy()
        }
      }
    })
  })

  describe("filterNavigationByPermissions", () => {
    it("filters out sections that require roles the user does not have", () => {
      const sections: NavigationSection[] = [
        {
          id: "admin",
          title: "Admin",
          titleAr: "إدارة",
          roles: ["super_admin"],
          items: [
            {
              id: "dash",
              title: "Dashboard",
              titleAr: "لوحة",
              href: "/admin",
              icon: {} as any,
            },
          ],
        },
        {
          id: "general",
          title: "General",
          titleAr: "عام",
          items: [
            {
              id: "home",
              title: "Home",
              titleAr: "الرئيسية",
              href: "/",
              icon: {} as any,
            },
          ],
        },
      ]

      const result = filterNavigationByPermissions(sections, [], ["org_admin"])
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe("general")
    })

    it("keeps sections when user has the required role", () => {
      const sections: NavigationSection[] = [
        {
          id: "admin",
          title: "Admin",
          titleAr: "إدارة",
          roles: ["super_admin"],
          items: [
            {
              id: "dash",
              title: "Dashboard",
              titleAr: "لوحة",
              href: "/admin",
              icon: {} as any,
            },
          ],
        },
      ]

      const result = filterNavigationByPermissions(
        sections,
        [],
        ["super_admin"]
      )
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe("admin")
    })

    it("filters out items that require permissions the user does not have", () => {
      const sections: NavigationSection[] = [
        {
          id: "tools",
          title: "Tools",
          titleAr: "أدوات",
          items: [
            {
              id: "jobs",
              title: "Jobs",
              titleAr: "وظائف",
              href: "/jobs",
              icon: {} as any,
              permissions: ["jobs.read" as any],
            },
            {
              id: "settings",
              title: "Settings",
              titleAr: "إعدادات",
              href: "/settings",
              icon: {} as any,
              permissions: ["organization.settings.read" as any],
            },
          ],
        },
      ]

      const result = filterNavigationByPermissions(
        sections,
        ["jobs.read" as any],
        ["recruiter"]
      )
      expect(result).toHaveLength(1)
      expect(result[0].items).toHaveLength(1)
      expect(result[0].items[0].id).toBe("jobs")
    })

    it("keeps items with no permission requirements", () => {
      const sections: NavigationSection[] = [
        {
          id: "overview",
          title: "Overview",
          titleAr: "نظرة",
          items: [
            {
              id: "home",
              title: "Home",
              titleAr: "الرئيسية",
              href: "/",
              icon: {} as any,
            },
          ],
        },
      ]

      const result = filterNavigationByPermissions(sections, [], [])
      expect(result).toHaveLength(1)
      expect(result[0].items).toHaveLength(1)
    })

    it("removes sections that become empty after filtering items", () => {
      const sections: NavigationSection[] = [
        {
          id: "admin",
          title: "Admin",
          titleAr: "إدارة",
          items: [
            {
              id: "settings",
              title: "Settings",
              titleAr: "إعدادات",
              href: "/settings",
              icon: {} as any,
              permissions: ["platform.manage" as any],
            },
          ],
        },
      ]

      const result = filterNavigationByPermissions(sections, [], ["recruiter"])
      expect(result).toHaveLength(0)
    })
  })
})
