/**
 * Tests for RLS policy correctness.
 * Ensures critical security policies reference the right tables/columns.
 */
import * as fs from "fs"
import * as path from "path"

const MIGRATIONS_DIR = path.resolve(__dirname, "../../../supabase/migrations")

describe("RLS policy audit", () => {
  describe("career_page_blocks fix migration", () => {
    it("fix migration file exists", () => {
      const fixFile = path.join(MIGRATIONS_DIR, "20260215_fix_career_page_blocks_rls.sql")
      expect(fs.existsSync(fixFile)).toBe(true)
    })

    it("fix migration drops broken policies", () => {
      const fixFile = path.join(MIGRATIONS_DIR, "20260215_fix_career_page_blocks_rls.sql")
      const content = fs.readFileSync(fixFile, "utf-8")

      expect(content).toContain('DROP POLICY IF EXISTS "Admins can manage career page blocks"')
      expect(content).toContain('DROP POLICY IF EXISTS "Admins can manage assets"')
    })

    it("fix migration uses has_role() instead of profiles.role", () => {
      const fixFile = path.join(MIGRATIONS_DIR, "20260215_fix_career_page_blocks_rls.sql")
      const content = fs.readFileSync(fixFile, "utf-8")

      // Must use the has_role function (checks user_roles table)
      expect(content).toContain("has_role(auth.uid(), 'org_admin')") // public.has_role matches this
      // Must NOT reference the old profiles.role column in SQL (comments ok)
      const sqlLines = content.split("\n").filter((l: string) => !l.trim().startsWith("--"))
      const sqlContent = sqlLines.join("\n")
      expect(sqlContent).not.toContain("profiles.role")
      expect(sqlContent).not.toMatch(/AND role IN/)
    })

    it("fix migration includes is_super_admin() check", () => {
      const fixFile = path.join(MIGRATIONS_DIR, "20260215_fix_career_page_blocks_rls.sql")
      const content = fs.readFileSync(fixFile, "utf-8")

      expect(content).toContain("is_super_admin(auth.uid())")
    })

    it("fix migration includes org_id ownership check", () => {
      const fixFile = path.join(MIGRATIONS_DIR, "20260215_fix_career_page_blocks_rls.sql")
      const content = fs.readFileSync(fixFile, "utf-8")

      // Must verify user belongs to the org that owns the blocks
      expect(content).toContain("org_id IN (SELECT p.org_id FROM public.profiles p WHERE p.id = auth.uid())")
    })
  })

  describe("user_roles RLS policies", () => {
    it("radical RLS fix migration exists", () => {
      const fixFile = path.join(MIGRATIONS_DIR, "20260121_radical_rls_fix.sql")
      expect(fs.existsSync(fixFile)).toBe(true)
    })

    it("SELECT policy uses simple user_id check (no functions)", () => {
      const fixFile = path.join(MIGRATIONS_DIR, "20260121_radical_rls_fix.sql")
      const content = fs.readFileSync(fixFile, "utf-8")

      // The SELECT policy should use a simple comparison to avoid recursion
      expect(content).toContain("user_id = auth.uid()")
    })

    it("INSERT policy restricts to super_admins only", () => {
      const fixFile = path.join(MIGRATIONS_DIR, "20260121_radical_rls_fix.sql")
      const content = fs.readFileSync(fixFile, "utf-8")

      // INSERT is restricted - this is WHY org creation needs service role
      expect(content).toContain("Super admins can insert roles")
      expect(content).toContain("is_super_admin(auth.uid())")
    })
  })

  describe("no migrations reference profiles.role column", () => {
    it("fix migration for career_page_blocks does not use profiles.role", () => {
      const fixFile = path.join(MIGRATIONS_DIR, "20260215_fix_career_page_blocks_rls.sql")
      const content = fs.readFileSync(fixFile, "utf-8")

      // profiles.role was removed during RBAC refactor
      // All new policies should use user_roles table via has_role()
      const lines = content.split("\n")
      const policyLines = lines.filter(
        (l) => !l.trim().startsWith("--") && l.includes("role")
      )

      // No policy line should reference profiles.role directly
      policyLines.forEach((line) => {
        expect(line).not.toMatch(/profiles\s*WHERE.*AND\s+role\s+IN/)
      })
    })
  })
})
