// @ts-nocheck
"use client"

import { useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  Search,
  Mail,
  Bell,
  MessageSquare,
  Settings,
  FileEdit,
  Users,
  Briefcase,
  CalendarDays,
  Gift,
  Building2,
  Loader2,
  Check,
} from "lucide-react"
import {
  NotificationEvent,
  OrgNotificationSetting,
  OrgEmailTemplate,
  DefaultEmailTemplate,
  NotificationCategory,
  NotificationChannel,
  categoryLabels,
  channelLabels,
} from "@/lib/notifications/types"
import { EmailTemplateEditor } from "./components/email-template-editor"
import { ChannelAudienceEditor } from "./components/channel-audience-editor"

interface Organization {
  id: string
  name: string
  logo_url: string | null
  primary_color: string | null
}

interface TeamMember {
  id: string
  full_name: string | null
  email: string
  role: string
}

interface NotificationSettingsClientProps {
  organization: Organization
  events: NotificationEvent[]
  settings: OrgNotificationSetting[]
  templates: OrgEmailTemplate[]
  defaultTemplates: DefaultEmailTemplate[]
  teamMembers: TeamMember[]
}

const categoryIcons: Record<NotificationCategory, any> = {
  user: Users,
  recruitment: Briefcase,
  interview: CalendarDays,
  offer: Gift,
  job: Building2,
}

export function NotificationSettingsClient({
  organization,
  events,
  settings: initialSettings,
  templates: initialTemplates,
  defaultTemplates,
  teamMembers,
}: NotificationSettingsClientProps) {
  const supabase = createClient()

  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<NotificationCategory | "all">("all")
  const [settings, setSettings] = useState<OrgNotificationSetting[]>(initialSettings)
  const [templates, setTemplates] = useState<OrgEmailTemplate[]>(initialTemplates)

  // Modal states
  const [editingTemplate, setEditingTemplate] = useState<{
    event: NotificationEvent
    template: OrgEmailTemplate | null
    defaultTemplate: DefaultEmailTemplate | null
  } | null>(null)

  const [editingChannels, setEditingChannels] = useState<{
    event: NotificationEvent
    setting: OrgNotificationSetting | null
  } | null>(null)

  const [savingEventId, setSavingEventId] = useState<string | null>(null)

  // Get settings/template for an event
  const getSettingForEvent = (eventId: string) =>
    settings.find((s) => s.event_id === eventId) || null

  const getTemplateForEvent = (eventId: string) =>
    templates.find((t) => t.event_id === eventId) || null

  const getDefaultTemplateForEvent = (eventId: string) =>
    defaultTemplates.find((t) => t.event_id === eventId) || null

  // Filter and group events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        activeCategory === "all" || event.category === activeCategory

      return matchesSearch && matchesCategory
    })
  }, [events, searchQuery, activeCategory])

  // Group events by category
  const groupedEvents = useMemo(() => {
    const groups: Record<NotificationCategory, NotificationEvent[]> = {
      user: [],
      recruitment: [],
      interview: [],
      offer: [],
      job: [],
    }
    filteredEvents.forEach((event) => {
      groups[event.category].push(event)
    })
    return groups
  }, [filteredEvents])

  // Toggle event enabled/disabled
  const toggleEventEnabled = async (event: NotificationEvent) => {
    const existingSetting = getSettingForEvent(event.id)
    const newEnabled = existingSetting ? !existingSetting.enabled : false

    setSavingEventId(event.id)
    try {
      if (existingSetting) {
        // Update existing setting
        const { error } = await supabase
          .from("org_notification_settings")
          .update({ enabled: newEnabled })
          .eq("id", existingSetting.id)

        if (error) throw error

        setSettings(
          settings.map((s) =>
            s.id === existingSetting.id ? { ...s, enabled: newEnabled } : s
          )
        )
      } else {
        // Create new setting
        const { data, error } = await supabase
          .from("org_notification_settings")
          .insert({
            org_id: organization.id,
            event_id: event.id,
            enabled: false,
            channels: event.default_channels,
            audience_roles: [],
            audience_users: [],
          })
          .select()
          .single()

        if (error) throw error
        setSettings([...settings, data])
      }
    } catch (error) {
      console.error("Error toggling event:", error)
      toast.error("Failed to update setting")
    } finally {
      setSavingEventId(null)
    }
  }

  // Save channel/audience settings
  const saveChannelSettings = async (
    eventId: string,
    channels: NotificationChannel[],
    audienceRoles: string[],
    audienceUsers: string[]
  ) => {
    const existingSetting = getSettingForEvent(eventId)

    try {
      if (existingSetting) {
        const { error } = await supabase
          .from("org_notification_settings")
          .update({
            channels,
            audience_roles: audienceRoles,
            audience_users: audienceUsers,
          })
          .eq("id", existingSetting.id)

        if (error) throw error

        setSettings(
          settings.map((s) =>
            s.id === existingSetting.id
              ? { ...s, channels, audience_roles: audienceRoles, audience_users: audienceUsers }
              : s
          )
        )
      } else {
        const { data, error } = await supabase
          .from("org_notification_settings")
          .insert({
            org_id: organization.id,
            event_id: eventId,
            enabled: true,
            channels,
            audience_roles: audienceRoles,
            audience_users: audienceUsers,
          })
          .select()
          .single()

        if (error) throw error
        setSettings([...settings, data])
      }

      toast.success("Settings saved")
      setEditingChannels(null)
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings")
    }
  }

  // Save email template
  const saveEmailTemplate = async (
    eventId: string,
    subject: string,
    subjectAr: string,
    bodyHtml: string,
    bodyHtmlAr: string
  ) => {
    const existingTemplate = getTemplateForEvent(eventId)

    try {
      if (existingTemplate) {
        const { error } = await supabase
          .from("org_email_templates")
          .update({
            subject,
            subject_ar: subjectAr,
            body_html: bodyHtml,
            body_html_ar: bodyHtmlAr,
          })
          .eq("id", existingTemplate.id)

        if (error) throw error

        setTemplates(
          templates.map((t) =>
            t.id === existingTemplate.id
              ? { ...t, subject, subject_ar: subjectAr, body_html: bodyHtml, body_html_ar: bodyHtmlAr }
              : t
          )
        )
      } else {
        const { data, error } = await supabase
          .from("org_email_templates")
          .insert({
            org_id: organization.id,
            event_id: eventId,
            subject,
            subject_ar: subjectAr,
            body_html: bodyHtml,
            body_html_ar: bodyHtmlAr,
          })
          .select()
          .single()

        if (error) throw error
        setTemplates([...templates, data])
      }

      toast.success("Template saved")
      setEditingTemplate(null)
    } catch (error) {
      console.error("Error saving template:", error)
      toast.error("Failed to save template")
    }
  }

  // Render channel badges
  const renderChannelBadges = (event: NotificationEvent) => {
    const setting = getSettingForEvent(event.id)
    const channels = setting?.channels || event.default_channels

    return (
      <div className="flex gap-1">
        {channels.map((channel) => (
          <Badge
            key={channel}
            variant="secondary"
            className={`${channelLabels[channel].color} text-white text-xs`}
          >
            {channelLabels[channel].en}
          </Badge>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Notification Settings</h2>
        <p className="text-muted-foreground">
          Configure how and when notifications are sent to your team and candidates
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as any)}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All</TabsTrigger>
          {(Object.keys(categoryLabels) as NotificationCategory[]).map((cat) => {
            const Icon = categoryIcons[cat]
            return (
              <TabsTrigger key={cat} value={cat} className="flex items-center gap-1">
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{categoryLabels[cat].en}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6">
          {activeCategory === "all" ? (
            // Show all categories
            <div className="space-y-8">
              {(Object.keys(groupedEvents) as NotificationCategory[]).map((category) => {
                const categoryEvents = groupedEvents[category]
                if (categoryEvents.length === 0) return null

                const Icon = categoryIcons[category]
                return (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {categoryLabels[category].en}
                      </CardTitle>
                      <CardDescription>
                        {categoryEvents.length} notification{categoryEvents.length !== 1 ? "s" : ""}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <EventsTable
                        events={categoryEvents}
                        getSettingForEvent={getSettingForEvent}
                        getTemplateForEvent={getTemplateForEvent}
                        getDefaultTemplateForEvent={getDefaultTemplateForEvent}
                        savingEventId={savingEventId}
                        onToggleEnabled={toggleEventEnabled}
                        onEditTemplate={(event) =>
                          setEditingTemplate({
                            event,
                            template: getTemplateForEvent(event.id),
                            defaultTemplate: getDefaultTemplateForEvent(event.id),
                          })
                        }
                        onEditChannels={(event) =>
                          setEditingChannels({
                            event,
                            setting: getSettingForEvent(event.id),
                          })
                        }
                        renderChannelBadges={renderChannelBadges}
                      />
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            // Show single category
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {(() => {
                    const Icon = categoryIcons[activeCategory]
                    return <Icon className="h-5 w-5" />
                  })()}
                  {categoryLabels[activeCategory].en}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EventsTable
                  events={filteredEvents}
                  getSettingForEvent={getSettingForEvent}
                  getTemplateForEvent={getTemplateForEvent}
                  getDefaultTemplateForEvent={getDefaultTemplateForEvent}
                  savingEventId={savingEventId}
                  onToggleEnabled={toggleEventEnabled}
                  onEditTemplate={(event) =>
                    setEditingTemplate({
                      event,
                      template: getTemplateForEvent(event.id),
                      defaultTemplate: getDefaultTemplateForEvent(event.id),
                    })
                  }
                  onEditChannels={(event) =>
                    setEditingChannels({
                      event,
                      setting: getSettingForEvent(event.id),
                    })
                  }
                  renderChannelBadges={renderChannelBadges}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Email Template Editor Modal */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Edit Email Template: {editingTemplate?.event.name}
            </DialogTitle>
            <DialogDescription>
              Customize the email template for this notification
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <EmailTemplateEditor
              event={editingTemplate.event}
              template={editingTemplate.template}
              defaultTemplate={editingTemplate.defaultTemplate}
              organization={organization}
              onSave={saveEmailTemplate}
              onCancel={() => setEditingTemplate(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Channel/Audience Editor Modal */}
      <Dialog open={!!editingChannels} onOpenChange={(open) => !open && setEditingChannels(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Notification Settings: {editingChannels?.event.name}
            </DialogTitle>
            <DialogDescription>
              Configure channels and audience for this notification
            </DialogDescription>
          </DialogHeader>
          {editingChannels && (
            <ChannelAudienceEditor
              event={editingChannels.event}
              setting={editingChannels.setting}
              teamMembers={teamMembers}
              onSave={saveChannelSettings}
              onCancel={() => setEditingChannels(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Events Table Component
function EventsTable({
  events,
  getSettingForEvent,
  getTemplateForEvent,
  getDefaultTemplateForEvent,
  savingEventId,
  onToggleEnabled,
  onEditTemplate,
  onEditChannels,
  renderChannelBadges,
}: {
  events: NotificationEvent[]
  getSettingForEvent: (id: string) => OrgNotificationSetting | null
  getTemplateForEvent: (id: string) => OrgEmailTemplate | null
  getDefaultTemplateForEvent: (id: string) => DefaultEmailTemplate | null
  savingEventId: string | null
  onToggleEnabled: (event: NotificationEvent) => void
  onEditTemplate: (event: NotificationEvent) => void
  onEditChannels: (event: NotificationEvent) => void
  renderChannelBadges: (event: NotificationEvent) => React.ReactNode
}) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No notifications found
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40px]"></TableHead>
          <TableHead>Event Name</TableHead>
          <TableHead>Channels</TableHead>
          <TableHead>Template</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => {
          const setting = getSettingForEvent(event.id)
          const template = getTemplateForEvent(event.id)
          const isEnabled = setting ? setting.enabled : true
          const isSaving = savingEventId === event.id
          const hasCustomTemplate = !!template

          return (
            <TableRow key={event.id} className={!isEnabled ? "opacity-50" : ""}>
              <TableCell>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => onToggleEnabled(event)}
                  />
                )}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{event.name}</div>
                  <div className="text-xs text-muted-foreground">{event.description}</div>
                </div>
              </TableCell>
              <TableCell>{renderChannelBadges(event)}</TableCell>
              <TableCell>
                {hasCustomTemplate ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <Check className="h-3 w-3 mr-1" />
                    Customized
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">Default</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {event.default_channels.includes("mail") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditTemplate(event)}
                    >
                      <FileEdit className="h-4 w-4 mr-1" />
                      Template
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditChannels(event)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
