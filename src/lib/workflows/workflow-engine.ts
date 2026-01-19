import { SupabaseClient } from "@supabase/supabase-js"
import { sendTemplatedEmail } from "@/lib/email/resend"
import { createNotification, createBulkNotifications } from "@/lib/notifications/notification-service"

export type TriggerType =
  | "application_received"
  | "status_changed"
  | "interview_completed"
  | "score_threshold"
  | "time_based"

export type ActionType =
  | "send_email"
  | "send_notification"
  | "change_status"
  | "assign_to_user"
  | "add_tag"
  | "create_task"
  | "schedule_interview"
  | "move_to_stage"

export interface WorkflowAction {
  type: ActionType
  config: Record<string, unknown>
}

export interface WorkflowTriggerConfig {
  status?: string
  fromStatus?: string
  toStatus?: string
  scoreThreshold?: number
  scoreComparison?: "above" | "below"
  scheduleType?: "daily" | "weekly"
  scheduleDays?: number[]
  scheduleTime?: string
}

export interface Workflow {
  id: string
  organization_id: string
  name: string
  description: string | null
  trigger_type: TriggerType
  trigger_config: WorkflowTriggerConfig
  actions: WorkflowAction[]
  is_active: boolean
}

export interface WorkflowContext {
  organizationId: string
  applicationId?: string
  candidateId?: string
  jobId?: string
  candidate?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  job?: {
    id: string
    title: string
  }
  application?: {
    id: string
    status: string
    stage: string
    ai_score?: number
  }
  previousStatus?: string
  newStatus?: string
  triggeredBy?: string
}

export async function getActiveWorkflows(
  supabase: SupabaseClient,
  organizationId: string,
  triggerType: TriggerType
): Promise<Workflow[]> {
  const { data, error } = await supabase
    .from("workflows")
    .select("*")
    .eq("org_id", organizationId)
    .eq("trigger_type", triggerType)
    .eq("is_active", true)

  if (error) {
    console.error("Failed to fetch workflows:", error)
    return []
  }

  return data || []
}

export async function executeWorkflow(
  supabase: SupabaseClient,
  workflow: Workflow,
  context: WorkflowContext
): Promise<{ success: boolean; error?: string }> {
  // Log execution start
  const { data: execution } = await supabase
    .from("workflow_executions")
    .insert({
      workflow_id: workflow.id,
      trigger_data: context,
      status: "running",
    })
    .select("id")
    .single()

  try {
    // Check if trigger conditions are met
    if (!checkTriggerConditions(workflow, context)) {
      await updateExecutionStatus(supabase, execution?.id, "completed", {
        skipped: true,
        reason: "Trigger conditions not met",
      })
      return { success: true }
    }

    // Execute each action in sequence
    for (const action of workflow.actions) {
      await executeAction(supabase, action, context)
    }

    await updateExecutionStatus(supabase, execution?.id, "completed", {
      actionsExecuted: workflow.actions.length,
    })

    return { success: true }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    await updateExecutionStatus(
      supabase,
      execution?.id,
      "failed",
      null,
      errorMessage
    )
    return { success: false, error: errorMessage }
  }
}

function checkTriggerConditions(
  workflow: Workflow,
  context: WorkflowContext
): boolean {
  const config = workflow.trigger_config

  switch (workflow.trigger_type) {
    case "status_changed":
      if (config.fromStatus && context.previousStatus !== config.fromStatus) {
        return false
      }
      if (config.toStatus && context.newStatus !== config.toStatus) {
        return false
      }
      return true

    case "score_threshold":
      if (!context.application?.ai_score) return false
      const score = context.application.ai_score
      const threshold = config.scoreThreshold || 0
      if (config.scoreComparison === "above") {
        return score >= threshold
      }
      return score <= threshold

    default:
      return true
  }
}

async function executeAction(
  supabase: SupabaseClient,
  action: WorkflowAction,
  context: WorkflowContext
): Promise<void> {
  switch (action.type) {
    case "send_email":
      await executeSendEmail(supabase, action.config, context)
      break

    case "send_notification":
      await executeSendNotification(supabase, action.config, context)
      break

    case "change_status":
      await executeChangeStatus(supabase, action.config, context)
      break

    case "move_to_stage":
      await executeMoveToStage(supabase, action.config, context)
      break

    case "assign_to_user":
      await executeAssignToUser(supabase, action.config, context)
      break

    default:
      console.log(`Action type ${action.type} not implemented`)
  }
}

async function executeSendEmail(
  supabase: SupabaseClient,
  config: Record<string, unknown>,
  context: WorkflowContext
): Promise<void> {
  const templateSlug = config.templateSlug as string
  if (!templateSlug || !context.candidate?.email) return

  // Get email template
  const { data: template } = await supabase
    .from("email_templates")
    .select("subject, body_html")
    .eq("slug", templateSlug)
    .eq("is_active", true)
    .single()

  if (!template) return

  await sendTemplatedEmail({
    to: context.candidate.email,
    templateSlug,
    variables: {
      first_name: context.candidate.first_name,
      last_name: context.candidate.last_name,
      full_name: `${context.candidate.first_name} ${context.candidate.last_name}`,
      job_title: context.job?.title || "",
      application_status: context.application?.status || "",
    },
    template,
  })
}

async function executeSendNotification(
  supabase: SupabaseClient,
  config: Record<string, unknown>,
  context: WorkflowContext
): Promise<void> {
  const userIds = config.userIds as string[]
  const title = config.title as string
  const message = (config.message as string)
    ?.replace("{{candidate_name}}", `${context.candidate?.first_name} ${context.candidate?.last_name}`)
    ?.replace("{{job_title}}", context.job?.title || "")
    ?.replace("{{status}}", context.newStatus || "")

  if (!userIds || userIds.length === 0) return

  await createBulkNotifications(supabase, userIds, {
    type: "system",
    title,
    message,
    link: context.applicationId
      ? `/org/applications?id=${context.applicationId}`
      : undefined,
  })
}

async function executeChangeStatus(
  supabase: SupabaseClient,
  config: Record<string, unknown>,
  context: WorkflowContext
): Promise<void> {
  const newStatus = config.status as string
  if (!newStatus || !context.applicationId) return

  await supabase
    .from("applications")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", context.applicationId)
}

async function executeMoveToStage(
  supabase: SupabaseClient,
  config: Record<string, unknown>,
  context: WorkflowContext
): Promise<void> {
  const stageId = config.stageId as string
  if (!stageId || !context.applicationId) return

  await supabase
    .from("applications")
    .update({
      stage: stageId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", context.applicationId)
}

async function executeAssignToUser(
  supabase: SupabaseClient,
  config: Record<string, unknown>,
  context: WorkflowContext
): Promise<void> {
  const userId = config.userId as string
  if (!userId || !context.applicationId) return

  await supabase
    .from("applications")
    .update({
      assigned_to: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", context.applicationId)
}

async function updateExecutionStatus(
  supabase: SupabaseClient,
  executionId: string | undefined,
  status: string,
  result: Record<string, unknown> | null,
  errorMessage?: string
): Promise<void> {
  if (!executionId) return

  await supabase
    .from("workflow_executions")
    .update({
      status,
      result,
      error_message: errorMessage || null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", executionId)
}

// Trigger workflows based on events
export async function triggerWorkflows(
  supabase: SupabaseClient,
  triggerType: TriggerType,
  context: WorkflowContext
): Promise<void> {
  const workflows = await getActiveWorkflows(
    supabase,
    context.organizationId,
    triggerType
  )

  for (const workflow of workflows) {
    // Execute workflows in parallel for better performance
    executeWorkflow(supabase, workflow, context).catch((error) => {
      console.error(`Workflow ${workflow.id} failed:`, error)
    })
  }
}
