import { redirect } from "next/navigation"
import { getDepartmentAccess } from "@/lib/auth/get-department-access"
import { OrgAdminDashboard } from "./dashboards/org-admin-dashboard"
import { HrManagerDashboard } from "./dashboards/hr-manager-dashboard"
import { RecruiterDashboard } from "./dashboards/recruiter-dashboard"
import { HiringManagerDashboard } from "./dashboards/hiring-manager-dashboard"
import { InterviewerDashboard } from "./dashboards/interviewer-dashboard"

export default async function OrgDashboardPage() {
  const access = await getDepartmentAccess()

  if (!access) {
    redirect("/login")
  }

  const { role, orgId, userId, departmentIds } = access

  switch (role) {
    case "org_admin":
      return <OrgAdminDashboard orgId={orgId} />

    case "hr_manager":
      return <HrManagerDashboard orgId={orgId} />

    case "recruiter":
      return <RecruiterDashboard orgId={orgId} />

    case "hiring_manager":
      return <HiringManagerDashboard orgId={orgId} departmentIds={departmentIds || []} />

    case "interviewer":
      return <InterviewerDashboard orgId={orgId} userId={userId} />

    default:
      // Fallback to HR Manager dashboard for unrecognized roles
      return <HrManagerDashboard orgId={orgId} />
  }
}
