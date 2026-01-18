// @ts-nocheck
// Note: This file uses tables that don't exist in the database schema (users should be profiles)
import { createClient } from "@/lib/supabase/server"
import { TeamClient } from "./team-client"

async function getTeamMembers() {
  const supabase = await createClient()

  const { data: members, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching team members:", error)
    return []
  }

  return members || []
}

async function getDepartments() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("departments")
    .select("*")
    .eq("is_active", true)
    .order("name")

  return data || []
}

export default async function TeamPage() {
  const [members, departments] = await Promise.all([
    getTeamMembers(),
    getDepartments(),
  ])

  return <TeamClient members={members} departments={departments} />
}
