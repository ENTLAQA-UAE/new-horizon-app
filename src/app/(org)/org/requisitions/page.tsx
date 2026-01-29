// @ts-nocheck
// Note: Type instantiation is excessively deep error
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getDepartmentAccess } from "@/lib/auth/get-department-access"
import { RequisitionsClient } from "./requisitions-client"

export default async function RequisitionsPage() {
  const access = await getDepartmentAccess()

  if (!access) {
    redirect("/login")
  }

  const supabase = await createClient()
  const orgId = access.orgId
  const user = { id: access.userId }

  // Get job requisitions with department filtering
  let requisitionsQuery = supabase
    .from("job_requisitions")
    .select(`
      *,
      departments (id, name),
      locations (id, name, city)
    `)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  if (access.departmentIds) {
    requisitionsQuery = requisitionsQuery.in("department_id", access.departmentIds.length > 0 ? access.departmentIds : ["__none__"])
  }

  const { data: requisitions } = await requisitionsQuery

  // Get requisition approvals
  const { data: approvals } = await supabase
    .from("requisition_approvals")
    .select("*")

  // Get departments (filtered by user's assigned departments for hiring managers)
  let departmentsQuery = supabase
    .from("departments")
    .select("id, name, name_ar")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("name")

  if (access.departmentIds) {
    departmentsQuery = departmentsQuery.in("id", access.departmentIds.length > 0 ? access.departmentIds : ["__none__"])
  }

  const { data: departments } = await departmentsQuery

  // Get locations from locations table (managed by Vacancy Settings)
  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, city")
    .eq("org_id", orgId)
    .order("name")

  // Get job types from org's configured job_types
  const { data: jobTypes } = await supabase
    .from("job_types")
    .select("id, name, name_ar")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("name")

  // Get org's default currency from settings (org-specific key)
  const { data: currencySetting } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", `org_settings_currency_${orgId}`)
    .single()

  // Fallback to global setting if org-specific not found
  let defaultCurrency = "SAR"
  if (currencySetting?.value) {
    defaultCurrency = typeof currencySetting.value === 'string'
      ? JSON.parse(currencySetting.value)
      : currencySetting.value
  } else {
    // Try global setting as fallback
    const { data: globalCurrency } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "org_settings_currency")
      .single()
    if (globalCurrency?.value) {
      defaultCurrency = typeof globalCurrency.value === 'string'
        ? JSON.parse(globalCurrency.value)
        : globalCurrency.value
    }
  }

  // Get team members for approvers
  const { data: teamMembers } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .eq("org_id", orgId)

  return (
    <RequisitionsClient
      requisitions={requisitions || []}
      approvals={approvals || []}
      departments={departments || []}
      locations={locations || []}
      jobTypes={jobTypes || []}
      defaultCurrency={defaultCurrency}
      teamMembers={
        teamMembers?.map((m) => ({
          id: m.id,
          name: m.first_name && m.last_name
            ? `${m.first_name} ${m.last_name}`
            : m.email || "Unknown",
        })) || []
      }
      organizationId={orgId}
      currentUserId={user.id}
    />
  )
}
