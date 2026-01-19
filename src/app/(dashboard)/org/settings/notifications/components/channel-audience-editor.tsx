"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Loader2, Plus, X, Mail, Bell, MessageSquare, Check, ChevronsUpDown } from "lucide-react"
import {
  NotificationEvent,
  OrgNotificationSetting,
  NotificationChannel,
  channelLabels,
  roleLabels,
} from "@/lib/notifications/types"
import { cn } from "@/lib/utils"

interface TeamMember {
  id: string
  full_name: string | null
  email: string
  role: string
}

interface ChannelAudienceEditorProps {
  event: NotificationEvent
  setting: OrgNotificationSetting | null
  teamMembers: TeamMember[]
  onSave: (
    eventId: string,
    channels: NotificationChannel[],
    audienceRoles: string[],
    audienceUsers: string[]
  ) => void
  onCancel: () => void
}

const channelIcons: Record<NotificationChannel, any> = {
  mail: Mail,
  system: Bell,
  sms: MessageSquare,
}

const availableRoles = [
  "org_admin",
  "hr_manager",
  "recruiter",
  "hiring_manager",
  "interviewer",
]

export function ChannelAudienceEditor({
  event,
  setting,
  teamMembers,
  onSave,
  onCancel,
}: ChannelAudienceEditorProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [channels, setChannels] = useState<NotificationChannel[]>(
    setting?.channels || event.default_channels
  )
  const [audienceRoles, setAudienceRoles] = useState<string[]>(
    setting?.audience_roles || []
  )
  const [audienceUsers, setAudienceUsers] = useState<string[]>(
    setting?.audience_users || []
  )
  const [userSearchOpen, setUserSearchOpen] = useState(false)

  // Toggle channel
  const toggleChannel = (channel: NotificationChannel) => {
    if (channels.includes(channel)) {
      setChannels(channels.filter((c) => c !== channel))
    } else {
      setChannels([...channels, channel])
    }
  }

  // Toggle role
  const toggleRole = (role: string) => {
    if (audienceRoles.includes(role)) {
      setAudienceRoles(audienceRoles.filter((r) => r !== role))
    } else {
      setAudienceRoles([...audienceRoles, role])
    }
  }

  // Add user
  const addUser = (userId: string) => {
    if (!audienceUsers.includes(userId)) {
      setAudienceUsers([...audienceUsers, userId])
    }
    setUserSearchOpen(false)
  }

  // Remove user
  const removeUser = (userId: string) => {
    setAudienceUsers(audienceUsers.filter((u) => u !== userId))
  }

  // Handle save
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(event.id, channels, audienceRoles, audienceUsers)
    } finally {
      setIsSaving(false)
    }
  }

  // Get user display name
  const getUserName = (userId: string) => {
    const user = teamMembers.find((u) => u.id === userId)
    return user?.full_name || user?.email || userId
  }

  return (
    <div className="space-y-6 mt-4">
      {/* Notification Channels */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Notification Channels</Label>
        <p className="text-sm text-muted-foreground">
          Select how this notification should be delivered
        </p>
        <div className="flex flex-wrap gap-3">
          {(["mail", "system", "sms"] as NotificationChannel[]).map((channel) => {
            const Icon = channelIcons[channel]
            const isSelected = channels.includes(channel)
            const isAvailable = event.default_channels.includes(channel) || channel !== "sms"

            return (
              <button
                key={channel}
                onClick={() => isAvailable && toggleChannel(channel)}
                disabled={!isAvailable}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all",
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-muted hover:border-muted-foreground/50",
                  !isAvailable && "opacity-50 cursor-not-allowed"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{channelLabels[channel].en}</span>
                {isSelected && <Check className="h-4 w-4 text-primary" />}
              </button>
            )
          })}
        </div>
        {channels.length === 0 && (
          <p className="text-sm text-destructive">
            At least one channel must be selected
          </p>
        )}
      </div>

      <Separator />

      {/* Notification Audience */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Notification Audience</Label>
        <p className="text-sm text-muted-foreground">
          Choose who should receive this notification. Leave empty for default recipients.
        </p>

        {/* Roles */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Roles</Label>
          <div className="flex flex-wrap gap-2">
            {availableRoles.map((role) => {
              const isSelected = audienceRoles.includes(role)
              return (
                <Badge
                  key={role}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleRole(role)}
                >
                  {roleLabels[role]?.en || role}
                  {isSelected && <X className="h-3 w-3 ml-1" />}
                </Badge>
              )
            })}
          </div>
        </div>

        {/* Specific Users */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Specific Users</Label>
          <div className="flex flex-wrap gap-2 items-center">
            {audienceUsers.map((userId) => (
              <Badge key={userId} variant="secondary">
                {getUserName(userId)}
                <button
                  onClick={() => removeUser(userId)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7">
                  <Plus className="h-3 w-3 mr-1" />
                  Add User
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search team members..." />
                  <CommandList>
                    <CommandEmpty>No team member found.</CommandEmpty>
                    <CommandGroup>
                      {teamMembers
                        .filter((u) => !audienceUsers.includes(u.id))
                        .map((user) => (
                          <CommandItem
                            key={user.id}
                            onSelect={() => addUser(user.id)}
                          >
                            <div className="flex flex-col">
                              <span>{user.full_name || user.email}</span>
                              <span className="text-xs text-muted-foreground">
                                {roleLabels[user.role]?.en || user.role}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {audienceRoles.length === 0 && audienceUsers.length === 0 && (
          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            No audience specified. Notification will be sent to default recipients based on the event type.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving || channels.length === 0}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </div>
  )
}
