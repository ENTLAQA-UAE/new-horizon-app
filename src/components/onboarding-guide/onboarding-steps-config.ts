import {
  Building2,
  Palette,
  Users,
  Settings,
  Globe,
  LayoutDashboard,
  GitBranch,
  ClipboardCheck,
  MessageSquareMore,
  Briefcase,
  UserPlus,
  FileText,
  Calendar,
  Star,
  FileUp,
  Eye,
  SlidersHorizontal,
} from "lucide-react"
import type { UserRole } from "@/lib/auth"
import type { LucideIcon } from "lucide-react"

export interface OnboardingStep {
  key: string
  title: string
  description: string
  actionLabel: string
  actionPath: string
  icon: LucideIcon
}

export interface OnboardingRoleConfig {
  role: UserRole
  title: string
  description: string
  steps: OnboardingStep[]
}

// Org Admin: Organization infrastructure only — zero ATS
const orgAdminSteps: OnboardingStep[] = [
  {
    key: "setup_branding",
    title: "Set up your branding",
    description: "Add your company logo and brand colors to personalize your workspace.",
    actionLabel: "Go to Branding",
    actionPath: "/org/branding",
    icon: Palette,
  },
  {
    key: "create_department",
    title: "Create departments",
    description: "Define your company departments like Engineering, Marketing, Sales, etc.",
    actionLabel: "Manage Departments",
    actionPath: "/org/departments",
    icon: Building2,
  },
  {
    key: "invite_team",
    title: "Invite your team",
    description: "Add HR managers, recruiters, and hiring managers to your workspace.",
    actionLabel: "Invite Members",
    actionPath: "/org/team",
    icon: Users,
  },
  {
    key: "configure_settings",
    title: "Configure general settings",
    description: "Set timezone, language, currency, and compliance preferences.",
    actionLabel: "Open Settings",
    actionPath: "/org/settings",
    icon: Settings,
  },
  {
    key: "setup_career_page",
    title: "Set up your career page",
    description: "Customize the public career page where applicants discover your jobs.",
    actionLabel: "Career Page",
    actionPath: "/org/career-page",
    icon: Globe,
  },
]

// HR Manager: ATS operations owner — full hiring workflow setup
const hrManagerSteps: OnboardingStep[] = [
  {
    key: "explore_dashboard",
    title: "Explore your dashboard",
    description: "View hiring metrics, pipeline overview, and key performance indicators.",
    actionLabel: "View Dashboard",
    actionPath: "/org",
    icon: LayoutDashboard,
  },
  {
    key: "setup_pipeline",
    title: "Set up a pipeline",
    description: "Configure recruitment pipeline stages like Screening, Interview, and Offer.",
    actionLabel: "Manage Pipelines",
    actionPath: "/org/pipelines",
    icon: GitBranch,
  },
  {
    key: "create_scorecard_template",
    title: "Create a scorecard template",
    description: "Define evaluation criteria and scoring rubrics for interviews.",
    actionLabel: "Scorecard Templates",
    actionPath: "/org/scorecard-templates",
    icon: ClipboardCheck,
  },
  {
    key: "add_screening_questions",
    title: "Add screening questions",
    description: "Prepare pre-screening questions to filter applicants automatically.",
    actionLabel: "Screening Questions",
    actionPath: "/org/screening-questions",
    icon: MessageSquareMore,
  },
  {
    key: "configure_vacancy_settings",
    title: "Configure vacancy settings",
    description: "Set up job grades, job types, and office locations before posting jobs.",
    actionLabel: "Vacancy Settings",
    actionPath: "/org/vacancy-settings",
    icon: SlidersHorizontal,
  },
  {
    key: "post_first_job",
    title: "Post your first job",
    description: "Create and publish a job opening to start receiving applications.",
    actionLabel: "Create Job",
    actionPath: "/org/jobs",
    icon: Briefcase,
  },
]

// Recruiter: Day-to-day hiring operations
const recruiterSteps: OnboardingStep[] = [
  {
    key: "explore_dashboard",
    title: "Explore your dashboard",
    description: "View active jobs, candidates, and your hiring pipeline at a glance.",
    actionLabel: "View Dashboard",
    actionPath: "/org",
    icon: LayoutDashboard,
  },
  {
    key: "create_job_draft",
    title: "Create a job draft",
    description: "Draft a new job posting. It will need HR manager approval to publish.",
    actionLabel: "Create Job",
    actionPath: "/org/jobs",
    icon: Briefcase,
  },
  {
    key: "add_candidate",
    title: "Add a candidate",
    description: "Manually add a candidate to your talent pool.",
    actionLabel: "Add Candidate",
    actionPath: "/org/candidates",
    icon: UserPlus,
  },
  {
    key: "review_applications",
    title: "Review applications",
    description: "Move candidates through the hiring pipeline stages.",
    actionLabel: "View Applications",
    actionPath: "/org/applications",
    icon: FileText,
  },
  {
    key: "schedule_interview",
    title: "Schedule an interview",
    description: "Set up an interview session with a candidate.",
    actionLabel: "View Interviews",
    actionPath: "/org/interviews",
    icon: Calendar,
  },
]

// Hiring Manager: Department-scoped — requisitions, reviews, scorecards
const hiringManagerSteps: OnboardingStep[] = [
  {
    key: "view_department",
    title: "View your department",
    description: "See your department's hiring activity and open positions at a glance.",
    actionLabel: "View Dashboard",
    actionPath: "/org",
    icon: LayoutDashboard,
  },
  {
    key: "submit_requisition",
    title: "Submit a requisition",
    description: "Request a new hire for your team. Requires HR manager approval.",
    actionLabel: "Create Requisition",
    actionPath: "/org/requisitions",
    icon: FileUp,
  },
  {
    key: "review_candidates",
    title: "Review department candidates",
    description: "View candidates who applied to your department's positions.",
    actionLabel: "View Applications",
    actionPath: "/org/applications",
    icon: Eye,
  },
  {
    key: "submit_scorecard",
    title: "Submit a scorecard",
    description: "Evaluate a candidate after conducting an interview.",
    actionLabel: "View Scorecards",
    actionPath: "/org/scorecards",
    icon: Star,
  },
]

// Interviewer: Interviews and evaluations only
const interviewerSteps: OnboardingStep[] = [
  {
    key: "welcome",
    title: "Welcome aboard",
    description: "See your upcoming interviews and pending tasks on your dashboard.",
    actionLabel: "View Dashboard",
    actionPath: "/org",
    icon: LayoutDashboard,
  },
  {
    key: "view_interviews",
    title: "View your interviews",
    description: "Check your assigned interview schedule and candidate details.",
    actionLabel: "My Interviews",
    actionPath: "/org/interviews",
    icon: Calendar,
  },
  {
    key: "submit_scorecard",
    title: "Submit a scorecard",
    description: "Complete an evaluation form after conducting an interview.",
    actionLabel: "My Scorecards",
    actionPath: "/org/scorecards",
    icon: Star,
  },
]

export const onboardingConfigs: Record<string, OnboardingRoleConfig> = {
  org_admin: {
    role: "org_admin",
    title: "Organization Setup",
    description: "Set up your organization's infrastructure and team.",
    steps: orgAdminSteps,
  },
  hr_manager: {
    role: "hr_manager",
    title: "Hiring Setup",
    description: "Configure your hiring workflow and post your first job.",
    steps: hrManagerSteps,
  },
  recruiter: {
    role: "recruiter",
    title: "Getting Started",
    description: "Start sourcing candidates and managing your pipeline.",
    steps: recruiterSteps,
  },
  hiring_manager: {
    role: "hiring_manager",
    title: "Department Hiring",
    description: "Manage hiring for your department.",
    steps: hiringManagerSteps,
  },
  interviewer: {
    role: "interviewer",
    title: "Interview Guide",
    description: "Get ready to conduct interviews and submit evaluations.",
    steps: interviewerSteps,
  },
}

export function getOnboardingConfig(role: UserRole | null): OnboardingRoleConfig | null {
  if (!role || role === "super_admin") return null
  return onboardingConfigs[role] || null
}
