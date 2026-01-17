"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  Zap,
  Plus,
  Play,
  Pause,
  Trash2,
  Pencil,
  Loader2,
  Mail,
  Bell,
  UserCheck,
  ArrowRight,
  GitBranch,
} from "lucide-react"

interface Workflow {
  id: string
  name: string
  description: string | null
  trigger_type: string
  trigger_config: Record<string, unknown>
  actions: { type: string; config: Record<string, unknown> }[]
  is_active: boolean
  created_at: string
}

interface WorkflowsClientProps {
  workflows: Workflow[]
  emailTemplates: { id: string; name: string; slug: string }[]
  stages: { id: string; name: string }[]
  teamMembers: { id: string; name: string }[]
}

const triggerTypes = [
  { value: "application_received", label: "Application Received", description: "When a new application is submitted" },
  { value: "status_changed", label: "Status Changed", description: "When application status changes" },
  { value: "score_threshold", label: "AI Score Threshold", description: "When AI score reaches a threshold" },
  { value: "interview_completed", label: "Interview Completed", description: "When an interview is marked complete" },
]

const actionTypes = [
  { value: "send_email", label: "Send Email", icon: Mail },
  { value: "send_notification", label: "Send Notification", icon: Bell },
  { value: "change_status", label: "Change Status", icon: UserCheck },
  { value: "move_to_stage", label: "Move to Stage", icon: ArrowRight },
]

const statusOptions = [
  "new", "screening", "interviewing", "offered", "hired", "rejected"
]

export function WorkflowsClient({ workflows: initialWorkflows, emailTemplates, stages, teamMembers }: WorkflowsClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [workflows, setWorkflows] = useState(initialWorkflows)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    trigger_type: "application_received",
    trigger_config: {} as Record<string, unknown>,
    actions: [] as { type: string; config: Record<string, unknown> }[],
  })

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      trigger_type: "application_received",
      trigger_config: {},
      actions: [],
    })
    setSelectedWorkflow(null)
  }

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Please enter a workflow name")
      return
    }

    if (formData.actions.length === 0) {
      toast.error("Please add at least one action")
      return
    }

    setIsLoading(true)

    try {
      if (selectedWorkflow) {
        const { error } = await supabase
          .from("workflows")
          .update({
            name: formData.name,
            description: formData.description || null,
            trigger_type: formData.trigger_type,
            trigger_config: formData.trigger_config,
            actions: formData.actions,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedWorkflow.id)

        if (error) throw error

        setWorkflows(workflows.map(w =>
          w.id === selectedWorkflow.id
            ? { ...w, ...formData }
            : w
        ))
        toast.success("Workflow updated")
      } else {
        const { data, error } = await supabase
          .from("workflows")
          .insert({
            name: formData.name,
            description: formData.description || null,
            trigger_type: formData.trigger_type,
            trigger_config: formData.trigger_config,
            actions: formData.actions,
            is_active: true,
          })
          .select()
          .single()

        if (error) throw error

        setWorkflows([data, ...workflows])
        toast.success("Workflow created")
      }

      setIsCreateOpen(false)
      resetForm()
      router.refresh()
    } catch (error) {
      toast.error("Failed to save workflow")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleWorkflow = async (workflow: Workflow) => {
    const { error } = await supabase
      .from("workflows")
      .update({ is_active: !workflow.is_active })
      .eq("id", workflow.id)

    if (error) {
      toast.error("Failed to update workflow")
      return
    }

    setWorkflows(workflows.map(w =>
      w.id === workflow.id ? { ...w, is_active: !w.is_active } : w
    ))
    toast.success(`Workflow ${workflow.is_active ? "paused" : "activated"}`)
  }

  const deleteWorkflow = async (workflowId: string) => {
    const { error } = await supabase
      .from("workflows")
      .delete()
      .eq("id", workflowId)

    if (error) {
      toast.error("Failed to delete workflow")
      return
    }

    setWorkflows(workflows.filter(w => w.id !== workflowId))
    toast.success("Workflow deleted")
  }

  const editWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow)
    setFormData({
      name: workflow.name,
      description: workflow.description || "",
      trigger_type: workflow.trigger_type,
      trigger_config: workflow.trigger_config,
      actions: workflow.actions,
    })
    setIsCreateOpen(true)
  }

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, { type: "send_email", config: {} }],
    })
  }

  const removeAction = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index),
    })
  }

  const updateAction = (index: number, updates: Partial<{ type: string; config: Record<string, unknown> }>) => {
    setFormData({
      ...formData,
      actions: formData.actions.map((action, i) =>
        i === index ? { ...action, ...updates } : action
      ),
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Automated Workflows</h2>
          <p className="text-muted-foreground">
            Automate repetitive tasks and streamline your hiring process
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Create Workflow
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Workflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {workflows.filter(w => w.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paused
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {workflows.filter(w => !w.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        {workflows.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <GitBranch className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium mb-2">No workflows yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first workflow to automate your hiring process
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Workflow
              </Button>
            </CardContent>
          </Card>
        ) : (
          workflows.map(workflow => (
            <Card key={workflow.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${workflow.is_active ? "bg-green-100" : "bg-muted"}`}>
                      <Zap className={`h-5 w-5 ${workflow.is_active ? "text-green-600" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{workflow.name}</h3>
                        <Badge variant={workflow.is_active ? "default" : "secondary"}>
                          {workflow.is_active ? "Active" : "Paused"}
                        </Badge>
                      </div>
                      {workflow.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {workflow.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Trigger: <span className="font-medium">
                            {triggerTypes.find(t => t.value === workflow.trigger_type)?.label}
                          </span>
                        </span>
                        <span className="text-muted-foreground">
                          Actions: <span className="font-medium">{workflow.actions.length}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={workflow.is_active}
                      onCheckedChange={() => toggleWorkflow(workflow)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => editWorkflow(workflow)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => deleteWorkflow(workflow.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedWorkflow ? "Edit Workflow" : "Create Workflow"}
            </DialogTitle>
            <DialogDescription>
              Set up automated actions based on triggers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Workflow Name *</Label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Auto-send confirmation email"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this workflow does..."
                  rows={2}
                />
              </div>
            </div>

            {/* Trigger */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Trigger</Label>
              <Select
                value={formData.trigger_type}
                onValueChange={value => setFormData({ ...formData, trigger_type: value, trigger_config: {} })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {triggerTypes.map(trigger => (
                    <SelectItem key={trigger.value} value={trigger.value}>
                      <div>
                        <div className="font-medium">{trigger.label}</div>
                        <div className="text-xs text-muted-foreground">{trigger.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Trigger-specific config */}
              {formData.trigger_type === "status_changed" && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <Label>From Status</Label>
                    <Select
                      value={formData.trigger_config.fromStatus as string || ""}
                      onValueChange={value => setFormData({
                        ...formData,
                        trigger_config: { ...formData.trigger_config, fromStatus: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>To Status</Label>
                    <Select
                      value={formData.trigger_config.toStatus as string || ""}
                      onValueChange={value => setFormData({
                        ...formData,
                        trigger_config: { ...formData.trigger_config, toStatus: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {formData.trigger_type === "score_threshold" && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <Label>Comparison</Label>
                    <Select
                      value={formData.trigger_config.scoreComparison as string || "above"}
                      onValueChange={value => setFormData({
                        ...formData,
                        trigger_config: { ...formData.trigger_config, scoreComparison: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="above">Above or equal</SelectItem>
                        <SelectItem value="below">Below</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Score Threshold (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.trigger_config.scoreThreshold as number || 0}
                      onChange={e => setFormData({
                        ...formData,
                        trigger_config: { ...formData.trigger_config, scoreThreshold: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Actions</Label>
                <Button variant="outline" size="sm" onClick={addAction}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Action
                </Button>
              </div>

              {formData.actions.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">No actions added yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.actions.map((action, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <Select
                            value={action.type}
                            onValueChange={value => updateAction(index, { type: value, config: {} })}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {actionTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    <type.icon className="h-4 w-4" />
                                    {type.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => removeAction(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Action-specific config */}
                        {action.type === "send_email" && (
                          <div className="space-y-2">
                            <Label>Email Template</Label>
                            <Select
                              value={action.config.templateSlug as string || ""}
                              onValueChange={value => updateAction(index, {
                                config: { ...action.config, templateSlug: value }
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select template" />
                              </SelectTrigger>
                              <SelectContent>
                                {emailTemplates.map(template => (
                                  <SelectItem key={template.id} value={template.slug}>
                                    {template.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {action.type === "change_status" && (
                          <div className="space-y-2">
                            <Label>New Status</Label>
                            <Select
                              value={action.config.status as string || ""}
                              onValueChange={value => updateAction(index, {
                                config: { ...action.config, status: value }
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions.map(status => (
                                  <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {action.type === "move_to_stage" && (
                          <div className="space-y-2">
                            <Label>Target Stage</Label>
                            <Select
                              value={action.config.stageId as string || ""}
                              onValueChange={value => updateAction(index, {
                                config: { ...action.config, stageId: value }
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select stage" />
                              </SelectTrigger>
                              <SelectContent>
                                {stages.map(stage => (
                                  <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {action.type === "send_notification" && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Title</Label>
                              <Input
                                value={action.config.title as string || ""}
                                onChange={e => updateAction(index, {
                                  config: { ...action.config, title: e.target.value }
                                })}
                                placeholder="Notification title"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Message</Label>
                              <Textarea
                                value={action.config.message as string || ""}
                                onChange={e => updateAction(index, {
                                  config: { ...action.config, message: e.target.value }
                                })}
                                placeholder="Use {{candidate_name}}, {{job_title}}, {{status}}"
                                rows={2}
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedWorkflow ? "Save Changes" : "Create Workflow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
