// =====================================================
// RBAC TYPE DEFINITIONS
// =====================================================

// System role codes
export type SystemRoleCode =
  | "super_admin"
  | "org_admin"
  | "hr_manager"
  | "recruiter"
  | "hiring_manager"
  | "candidate"

// Permission categories
export type PermissionCategory =
  | "platform"
  | "organization"
  | "users"
  | "jobs"
  | "candidates"
  | "applications"
  | "interviews"
  | "offers"
  | "workflows"
  | "communication"
  | "analytics"
  | "compliance"
  | "documents"
  | "audit"
  | "portal"

// All permission codes
export type PermissionCode =
  // Platform
  | "platform.manage"
  | "platform.organizations.create"
  | "platform.organizations.read"
  | "platform.organizations.update"
  | "platform.organizations.delete"
  | "platform.tiers.manage"
  | "platform.billing.manage"
  | "platform.settings.manage"
  | "platform.users.manage"
  // Organization
  | "organization.settings.read"
  | "organization.settings.update"
  | "organization.branding.manage"
  | "organization.departments.manage"
  | "organization.locations.manage"
  | "organization.subscription.view"
  | "organization.subscription.manage"
  // Users
  | "users.create"
  | "users.read"
  | "users.update"
  | "users.delete"
  | "users.invite"
  | "users.roles.assign"
  | "users.roles.manage"
  // Jobs
  | "jobs.create"
  | "jobs.read"
  | "jobs.read.own"
  | "jobs.update"
  | "jobs.update.own"
  | "jobs.delete"
  | "jobs.publish"
  | "jobs.close"
  | "jobs.archive"
  | "jobs.requisition.create"
  | "jobs.requisition.approve"
  // Candidates
  | "candidates.create"
  | "candidates.read"
  | "candidates.read.own"
  | "candidates.update"
  | "candidates.delete"
  | "candidates.export"
  | "candidates.import"
  | "candidates.bulk.manage"
  | "candidates.notes.create"
  | "candidates.notes.read"
  | "candidates.tags.manage"
  // Applications
  | "applications.read"
  | "applications.read.own"
  | "applications.update"
  | "applications.stage.move"
  | "applications.reject"
  | "applications.shortlist"
  | "applications.assign"
  | "applications.score"
  | "applications.bulk.manage"
  // Interviews
  | "interviews.create"
  | "interviews.read"
  | "interviews.read.own"
  | "interviews.update"
  | "interviews.cancel"
  | "interviews.reschedule"
  | "interviews.scorecard.submit"
  | "interviews.scorecard.view"
  | "interviews.feedback.submit"
  | "interviews.feedback.view"
  // Offers
  | "offers.create"
  | "offers.read"
  | "offers.read.own"
  | "offers.update"
  | "offers.approve"
  | "offers.send"
  | "offers.rescind"
  | "offers.templates.manage"
  // Workflows
  | "pipelines.create"
  | "pipelines.read"
  | "pipelines.update"
  | "pipelines.delete"
  | "workflows.create"
  | "workflows.read"
  | "workflows.update"
  | "workflows.delete"
  | "workflows.execute"
  // Communication
  | "emails.send"
  | "emails.templates.create"
  | "emails.templates.read"
  | "emails.templates.update"
  | "emails.templates.delete"
  | "emails.config.manage"
  // Analytics
  | "analytics.dashboard.view"
  | "analytics.reports.view"
  | "analytics.reports.create"
  | "analytics.reports.export"
  | "analytics.reports.schedule"
  // Compliance
  | "compliance.view"
  | "compliance.configure"
  | "compliance.reports.view"
  | "compliance.reports.export"
  | "compliance.saudization.manage"
  | "compliance.emiratization.manage"
  // Documents
  | "documents.upload"
  | "documents.read"
  | "documents.delete"
  | "documents.download"
  // Audit
  | "audit.logs.view"
  | "audit.logs.export"
  // Portal
  | "portal.profile.read"
  | "portal.profile.update"
  | "portal.applications.read"
  | "portal.interviews.read"
  | "portal.interviews.schedule"
  | "portal.offers.read"
  | "portal.offers.respond"
  | "portal.documents.manage"

// Role interface
export interface Role {
  id: string
  org_id: string | null
  code: string
  name: string
  name_ar: string | null
  description: string | null
  description_ar: string | null
  is_system_role: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

// Permission interface
export interface Permission {
  id: string
  code: PermissionCode
  name: string
  name_ar: string | null
  description: string | null
  description_ar: string | null
  category: PermissionCategory
  is_active: boolean
  created_at: string
}

// Role with permissions
export interface RoleWithPermissions extends Role {
  permissions: Permission[]
}

// User role assignment
export interface UserRole {
  id: string
  user_id: string
  role_id: string
  org_id: string | null
  is_primary: boolean
  assigned_at: string
  assigned_by: string | null
  expires_at: string | null
  created_at: string
  role?: Role
}

// User with roles
export interface UserWithRoles {
  id: string
  email: string
  full_name: string
  roles: UserRole[]
  permissions: PermissionCode[]
}

// Role context for current user
export interface RoleContext {
  userId: string
  orgId: string | null
  roles: {
    id: string
    code: string
    name: string
    orgId: string | null
    isPrimary: boolean
  }[]
  permissions: PermissionCode[]
  primaryRole: string | null
  isSuperAdmin: boolean
  isOrgAdmin: boolean
  isHRManager: boolean
  isRecruiter: boolean
  isHiringManager: boolean
  isCandidate: boolean
}

// Role audit log
export interface RoleAuditLog {
  id: string
  user_id: string | null
  target_user_id: string | null
  action: "role_assigned" | "role_removed" | "role_created" | "role_updated" | "permission_changed"
  role_id: string | null
  org_id: string | null
  details: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

// Navigation item with permission requirements
export interface NavItem {
  title: string
  titleAr?: string
  href: string
  icon?: string
  permissions?: PermissionCode[]
  roles?: SystemRoleCode[]
  children?: NavItem[]
}

// Dashboard widget with permission requirements
export interface DashboardWidget {
  id: string
  title: string
  titleAr?: string
  component: string
  permissions?: PermissionCode[]
  roles?: SystemRoleCode[]
  order: number
}
