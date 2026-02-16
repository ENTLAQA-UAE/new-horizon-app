"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Plus,
  Trash2,
  Pencil,
  Zap,
  Mail,
  Bell,
  ArrowRightLeft,
  UserPlus,
  Layers,
} from "lucide-react"
import { KawadirIcon } from "@/components/ui/kawadir-icon"

// =====================================================
// Types
// =====================================================

type TriggerType =
  | "application_received"
  | "status_changed"
  | "interview_completed"
  | "score_threshold"
  | "time_based"

type ActionType =
  | "send_email"
  | "send_notification"
  | "change_status"
  | "assign_to_user"
  | "move_to_stage"

interface WorkflowAction {
  type: ActionType
  config: Record<string, unknown>
}

interface Workflow {
  id: string
  name: string
  description: string | null
  trigger_type: TriggerType
  trigger_config: Record<string, unknown>
  actions: WorkflowAction[]
  is_active: boolean
  created_at: string
}

interface Props {
  initialWorkflows: Workflow[]
  emailTemplates: { id: string; name: string; slug: string }[]
  stages: { id: string; name: string; pipeline_id: string }[]
  teamMembers: { id: string; first_name: string; last_name: string; email: string }[]
}

const TRIGGER_LABELS: Record<TriggerType, string> = {
  application_received: "Application Received",
  status_changed: "Status Changed",
  interview_completed: "Interview Completed",
  score_threshold: "Score Threshold",
  time_based: "Time-Based",
}

const TRIGGER_DESCRIPTIONS: Record<TriggerType, string> = {
  application_received: "Fires when a new application is submitted",
  status_changed: "Fires when an application status changes",
  interview_completed: "Fires when an interview is marked complete",
  score_threshold: "Fires when AI score crosses a threshold",
  time_based: "Runs on a schedule (daily/weekly)",
}

const ACTION_LABELS: Record<ActionType, string> = {
  send_email: "Send Email",
  send_notification: "Send Notification",
  change_status: "Change Status",
  assign_to_user: "Assign to User",
  move_to_stage: "Move to Stage",
}

const ACTION_ICONS: Record<ActionType, React.ElementType> = {
  send_email: Mail,
  send_notification: Bell,
  change_status: ArrowRightLeft,
  assign_to_user: UserPlus,
  move_to_stage: Layers,
}

const APPLICATION_STATUSES = [
  "new",
  "screening",
  "interview",
  "assessment",
  "offer",
  "hired",
  "rejected",
  "withdrawn",
]

const EMPTY_WORKFLOW: Omit<Workflow, "id" | "created_at"> = {
  name: "",
  description: null,
  trigger_type: "application_received",
  trigger_config: {},
  actions: [],
  is_active: true,
}

// =====================================================
// Main Component
// =====================================================

export function WorkflowsClient({ initialWorkflows, emailTemplates, stages, teamMembers }: Props) {
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState<Partial<Workflow> | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // ----- Dialog helpers -----

  function openCreate() {
    setEditingWorkflow({ ...EMPTY_WORKFLOW })
    setDialogOpen(true)
  }

  function openEdit(wf: Workflow) {
    setEditingWorkflow({ ...wf, actions: [...wf.actions] })
    setDialogOpen(true)
  }

  // ----- API calls -----

  async function handleSave() {
    if (!editingWorkflow?.name) {
      toast.error("Workflow name is required")
      return
    }
    if (!editingWorkflow.actions?.length) {
      toast.error("Add at least one action")
      return
    }

    setSaving(true)
    try {
      const isEdit = !!editingWorkflow.id
      const res = await fetch("/api/workflows", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingWorkflow),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      if (isEdit) {
        setWorkflows((prev) => prev.map((w) => (w.id === data.workflow.id ? data.workflow : w)))
      } else {
        setWorkflows((prev) => [data.workflow, ...prev])
      }

      toast.success(isEdit ? "Workflow updated" : "Workflow created")
      setDialogOpen(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to save workflow")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/workflows?id=${deleteId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      setWorkflows((prev) => prev.filter((w) => w.id !== deleteId))
      toast.success("Workflow deleted")
    } catch {
      toast.error("Failed to delete workflow")
    } finally {
      setDeleteId(null)
    }
  }

  async function toggleActive(wf: Workflow) {
    const updated = { ...wf, is_active: !wf.is_active }
    try {
      const res = await fetch("/api/workflows", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      })
      if (!res.ok) throw new Error("Failed to update")
      setWorkflows((prev) => prev.map((w) => (w.id === wf.id ? { ...w, is_active: !w.is_active } : w)))
      toast.success(updated.is_active ? "Workflow enabled" : "Workflow disabled")
    } catch {
      toast.error("Failed to toggle workflow")
    }
  }

  // ----- Action editing helpers -----

  function addAction(type: ActionType) {
    if (!editingWorkflow) return
    setEditingWorkflow({
      ...editingWorkflow,
      actions: [...(editingWorkflow.actions || []), { type, config: {} }],
    })
  }

  function updateAction(index: number, config: Record<string, unknown>) {
    if (!editingWorkflow) return
    const newActions = [...(editingWorkflow.actions || [])]
    newActions[index] = { ...newActions[index], config }
    setEditingWorkflow({ ...editingWorkflow, actions: newActions })
  }

  function removeAction(index: number) {
    if (!editingWorkflow) return
    const newActions = [...(editingWorkflow.actions || [])]
    newActions.splice(index, 1)
    setEditingWorkflow({ ...editingWorkflow, actions: newActions })
  }

  // ----- Render -----

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workflows</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Automate actions based on hiring events
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Workflow
        </Button>
      </div>

      {/* Workflow List */}
      {workflows.length === 0 ? (
        <Card className="p-12 text-center">
          <KawadirIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold text-lg">No workflows yet</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-4">
            Create your first workflow to automate hiring actions
          </p>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {workflows.map((wf) => (
            <Card key={wf.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{wf.name}</h3>
                    <Badge variant={wf.is_active ? "default" : "secondary"}>
                      {wf.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {wf.description && (
                    <p className="text-sm text-muted-foreground mt-1">{wf.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5" />
                      {TRIGGER_LABELS[wf.trigger_type]}
                    </span>
                    <span>
                      {wf.actions.length} action{wf.actions.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {/* Action badges */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {wf.actions.map((action, i) => {
                      const Icon = ACTION_ICONS[action.type] || Zap
                      return (
                        <Badge key={i} variant="outline" className="text-xs gap-1">
                          <Icon className="h-3 w-3" />
                          {ACTION_LABELS[action.type]}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <Switch checked={wf.is_active} onCheckedChange={() => toggleActive(wf)} />
                  <Button size="icon" variant="ghost" onClick={() => openEdit(wf)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleteId(wf.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWorkflow?.id ? "Edit Workflow" : "Create Workflow"}
            </DialogTitle>
          </DialogHeader>

          {editingWorkflow && (
            <div className="space-y-5 mt-2">
              {/* Name & Description */}
              <div className="space-y-3">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={editingWorkflow.name || ""}
                    onChange={(e) => setEditingWorkflow({ ...editingWorkflow, name: e.target.value })}
                    placeholder="e.g. Auto-reject low scores"
                  />
                </div>
                <div>
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={editingWorkflow.description || ""}
                    onChange={(e) => setEditingWorkflow({ ...editingWorkflow, description: e.target.value })}
                    placeholder="What does this workflow do?"
                    rows={2}
                  />
                </div>
              </div>

              {/* Trigger */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Trigger</Label>
                <Select
                  value={editingWorkflow.trigger_type}
                  onValueChange={(val) =>
                    setEditingWorkflow({
                      ...editingWorkflow,
                      trigger_type: val as TriggerType,
                      trigger_config: {},
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TRIGGER_LABELS) as TriggerType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {TRIGGER_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {TRIGGER_DESCRIPTIONS[editingWorkflow.trigger_type as TriggerType]}
                </p>

                {/* Trigger-specific config */}
                {editingWorkflow.trigger_type === "status_changed" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">From Status</Label>
                      <Select
                        value={(editingWorkflow.trigger_config?.fromStatus as string) || "any"}
                        onValueChange={(val) =>
                          setEditingWorkflow({
                            ...editingWorkflow,
                            trigger_config: {
                              ...editingWorkflow.trigger_config,
                              fromStatus: val === "any" ? undefined : val,
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any</SelectItem>
                          {APPLICATION_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">To Status</Label>
                      <Select
                        value={(editingWorkflow.trigger_config?.toStatus as string) || "any"}
                        onValueChange={(val) =>
                          setEditingWorkflow({
                            ...editingWorkflow,
                            trigger_config: {
                              ...editingWorkflow.trigger_config,
                              toStatus: val === "any" ? undefined : val,
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any</SelectItem>
                          {APPLICATION_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {editingWorkflow.trigger_type === "score_threshold" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Comparison</Label>
                      <Select
                        value={(editingWorkflow.trigger_config?.scoreComparison as string) || "above"}
                        onValueChange={(val) =>
                          setEditingWorkflow({
                            ...editingWorkflow,
                            trigger_config: {
                              ...editingWorkflow.trigger_config,
                              scoreComparison: val,
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="above">Score Above</SelectItem>
                          <SelectItem value="below">Score Below</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Threshold (0-100)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={(editingWorkflow.trigger_config?.scoreThreshold as number) || 0}
                        onChange={(e) =>
                          setEditingWorkflow({
                            ...editingWorkflow,
                            trigger_config: {
                              ...editingWorkflow.trigger_config,
                              scoreThreshold: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Actions</Label>

                {(editingWorkflow.actions || []).map((action, idx) => (
                  <ActionEditor
                    key={idx}
                    action={action}
                    index={idx}
                    emailTemplates={emailTemplates}
                    stages={stages}
                    teamMembers={teamMembers}
                    onUpdate={(config) => updateAction(idx, config)}
                    onRemove={() => removeAction(idx)}
                  />
                ))}

                {/* Add action buttons */}
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(ACTION_LABELS) as ActionType[]).map((type) => {
                    const Icon = ACTION_ICONS[type]
                    return (
                      <Button
                        key={type}
                        size="sm"
                        variant="outline"
                        onClick={() => addAction(type)}
                      >
                        <Icon className="h-3.5 w-3.5 mr-1.5" />
                        {ACTION_LABELS[type]}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <Switch
                  checked={editingWorkflow.is_active ?? true}
                  onCheckedChange={(checked) =>
                    setEditingWorkflow({ ...editingWorkflow, is_active: checked })
                  }
                />
                <Label>Active</Label>
              </div>

              {/* Save */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : editingWorkflow.id ? "Update Workflow" : "Create Workflow"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this workflow and its execution history. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// =====================================================
// Action Editor Component
// =====================================================

function ActionEditor({
  action,
  index,
  emailTemplates,
  stages,
  teamMembers,
  onUpdate,
  onRemove,
}: {
  action: WorkflowAction
  index: number
  emailTemplates: { id: string; name: string; slug: string }[]
  stages: { id: string; name: string; pipeline_id: string }[]
  teamMembers: { id: string; first_name: string; last_name: string; email: string }[]
  onUpdate: (config: Record<string, unknown>) => void
  onRemove: () => void
}) {
  const Icon = ACTION_ICONS[action.type] || Zap

  return (
    <Card className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4" />
          {ACTION_LABELS[action.type]}
        </div>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>

      {action.type === "send_email" && (
        <div>
          <Label className="text-xs">Email Template</Label>
          <Select
            value={(action.config.templateSlug as string) || ""}
            onValueChange={(val) => onUpdate({ ...action.config, templateSlug: val })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select template..." />
            </SelectTrigger>
            <SelectContent>
              {emailTemplates.map((t) => (
                <SelectItem key={t.id} value={t.slug}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {action.type === "send_notification" && (
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Title</Label>
            <Input
              className="h-8 text-xs"
              value={(action.config.title as string) || ""}
              onChange={(e) => onUpdate({ ...action.config, title: e.target.value })}
              placeholder="Notification title"
            />
          </div>
          <div>
            <Label className="text-xs">Message</Label>
            <Input
              className="h-8 text-xs"
              value={(action.config.message as string) || ""}
              onChange={(e) => onUpdate({ ...action.config, message: e.target.value })}
              placeholder="Use {{candidate_name}}, {{job_title}}, {{status}}"
            />
          </div>
          <div>
            <Label className="text-xs">Send to</Label>
            <Select
              value={(action.config.userIds as string[])?.[0] || ""}
              onValueChange={(val) => onUpdate({ ...action.config, userIds: [val] })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select team member..." />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.first_name} {m.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {action.type === "change_status" && (
        <div>
          <Label className="text-xs">New Status</Label>
          <Select
            value={(action.config.status as string) || ""}
            onValueChange={(val) => onUpdate({ ...action.config, status: val })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select status..." />
            </SelectTrigger>
            <SelectContent>
              {APPLICATION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {action.type === "assign_to_user" && (
        <div>
          <Label className="text-xs">Assign to</Label>
          <Select
            value={(action.config.userId as string) || ""}
            onValueChange={(val) => onUpdate({ ...action.config, userId: val })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select team member..." />
            </SelectTrigger>
            <SelectContent>
              {teamMembers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.first_name} {m.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {action.type === "move_to_stage" && (
        <div>
          <Label className="text-xs">Pipeline Stage</Label>
          <Select
            value={(action.config.stageId as string) || ""}
            onValueChange={(val) => onUpdate({ ...action.config, stageId: val })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select stage..." />
            </SelectTrigger>
            <SelectContent>
              {stages.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </Card>
  )
}
