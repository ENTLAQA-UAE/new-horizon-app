"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Bold,
  Italic,
  Underline,
  Link,
  Image,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code,
  Undo,
  Redo,
  Loader2,
  Eye,
  Mail,
} from "lucide-react"
import {
  NotificationEvent,
  OrgEmailTemplate,
  DefaultEmailTemplate,
  NotificationVariable,
} from "@/lib/notifications/types"

interface Organization {
  id: string
  name: string
  logo_url: string | null
  primary_color: string | null
}

interface EmailTemplateEditorProps {
  event: NotificationEvent
  template: OrgEmailTemplate | null
  defaultTemplate: DefaultEmailTemplate | null
  organization: Organization
  onSave: (
    eventId: string,
    subject: string,
    subjectAr: string,
    bodyHtml: string,
    bodyHtmlAr: string
  ) => void
  onCancel: () => void
}

export function EmailTemplateEditor({
  event,
  template,
  defaultTemplate,
  organization,
  onSave,
  onCancel,
}: EmailTemplateEditorProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"en" | "ar">("en")
  const [showPreview, setShowPreview] = useState(false)

  // Form state
  const [subject, setSubject] = useState(
    template?.subject || defaultTemplate?.subject || ""
  )
  const [subjectAr, setSubjectAr] = useState(
    template?.subject_ar || defaultTemplate?.subject_ar || ""
  )
  const [bodyHtml, setBodyHtml] = useState(
    template?.body_html || defaultTemplate?.body_html || getDefaultBody()
  )
  const [bodyHtmlAr, setBodyHtmlAr] = useState(
    template?.body_html_ar || defaultTemplate?.body_html_ar || getDefaultBodyAr()
  )

  const editorRef = useRef<HTMLDivElement>(null)
  const editorArRef = useRef<HTMLDivElement>(null)

  const variables = event.available_variables || []

  function getDefaultBody() {
    const primaryColor = organization.primary_color || '#667eea'
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,${primaryColor} 0%,#764ba2 100%);padding:40px;text-align:center;">
    ${organization.logo_url ? `<img src="${organization.logo_url}" alt="${organization.name}" style="max-height:60px;margin-bottom:20px;">` : ''}
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">Notification</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Hello <strong>{receiver_name}</strong>,</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">This is a notification from <strong>${organization.name}</strong>.</p>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 30px;">[Add your message content here. You can use variables like {candidate_name}, {job_title}, etc.]</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:30px 0 0;">Best regards,<br><strong>${organization.name} Team</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">&copy; ${organization.name} &bull; Powered by Jadarat ATS</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`
  }

  function getDefaultBodyAr() {
    const primaryColor = organization.primary_color || '#667eea'
    return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,${primaryColor} 0%,#764ba2 100%);padding:40px;text-align:center;">
    ${organization.logo_url ? `<img src="${organization.logo_url}" alt="${organization.name}" style="max-height:60px;margin-bottom:20px;">` : ''}
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">إشعار</h1>
  </td></tr>
  <tr><td style="padding:40px;text-align:right;">
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">مرحباً <strong>{receiver_name}</strong>،</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px;">هذا إشعار من <strong>${organization.name}</strong>.</p>
    <p style="color:#6b7280;font-size:14px;line-height:1.8;margin:0 0 30px;">[أضف محتوى رسالتك هنا. يمكنك استخدام المتغيرات مثل {candidate_name}، {job_title}، إلخ.]</p>
    <p style="color:#374151;font-size:16px;line-height:1.8;margin:30px 0 0;">مع أطيب التحيات،<br><strong>فريق ${organization.name}</strong></p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#6b7280;font-size:13px;margin:0;">&copy; ${organization.name} &bull; مدعوم من جدارات</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`
  }

  // Insert variable at cursor position
  const insertVariable = (variable: string) => {
    const tag = `{${variable}}`
    if (activeTab === "en") {
      // For English, insert into subject or body based on focus
      const activeElement = document.activeElement
      if (activeElement?.id === "subject") {
        setSubject(subject + tag)
      } else {
        setBodyHtml(bodyHtml + tag)
      }
    } else {
      if (document.activeElement?.id === "subject-ar") {
        setSubjectAr(subjectAr + tag)
      } else {
        setBodyHtmlAr(bodyHtmlAr + tag)
      }
    }
  }

  // Format text
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    // Update state from editor content
    if (activeTab === "en" && editorRef.current) {
      setBodyHtml(editorRef.current.innerHTML)
    } else if (activeTab === "ar" && editorArRef.current) {
      setBodyHtmlAr(editorArRef.current.innerHTML)
    }
  }

  // Handle save
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(event.id, subject, subjectAr, bodyHtml, bodyHtmlAr)
    } finally {
      setIsSaving(false)
    }
  }

  // Preview with variables replaced
  const getPreviewHtml = (html: string) => {
    let preview = html
    variables.forEach((v: NotificationVariable) => {
      preview = preview.replace(
        new RegExp(`\\{${v.key}\\}`, "g"),
        `<span style="background: #fef3c7; padding: 2px 4px; border-radius: 2px;">[${v.label}]</span>`
      )
    })
    // Replace org variables
    preview = preview.replace(/\{org_name\}/g, organization.name)
    if (organization.logo_url) {
      preview = preview.replace(/\{org_logo\}/g, `<img src="${organization.logo_url}" alt="Logo" style="max-height: 60px;">`)
    }
    return preview
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "en" | "ar")}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="en" className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              English
            </TabsTrigger>
            <TabsTrigger value="ar" className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              العربية
            </TabsTrigger>
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-4 w-4 mr-1" />
            {showPreview ? "Edit" : "Preview"}
          </Button>
        </div>

        <TabsContent value="en" className="space-y-4 mt-4">
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
            />
            <p className="text-xs text-muted-foreground">
              Use variables like {"{candidate_name}"} to personalize
            </p>
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label>Email Content</Label>
            {showPreview ? (
              <div
                className="border rounded-lg p-4 min-h-[300px] bg-white"
                dangerouslySetInnerHTML={{ __html: getPreviewHtml(bodyHtml) }}
              />
            ) : (
              <>
                {/* Toolbar */}
                <div className="flex flex-wrap gap-1 p-2 border rounded-t-lg bg-muted/50">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => formatText("bold")}
                        >
                          <Bold className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Bold</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => formatText("italic")}
                        >
                          <Italic className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Italic</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => formatText("underline")}
                        >
                          <Underline className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Underline</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Separator orientation="vertical" className="h-8" />

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => formatText("justifyLeft")}
                        >
                          <AlignLeft className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Align Left</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => formatText("justifyCenter")}
                        >
                          <AlignCenter className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Align Center</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => formatText("justifyRight")}
                        >
                          <AlignRight className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Align Right</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Separator orientation="vertical" className="h-8" />

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => formatText("insertUnorderedList")}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Bullet List</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => formatText("insertOrderedList")}
                        >
                          <ListOrdered className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Numbered List</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            const url = prompt("Enter URL:")
                            if (url) formatText("createLink", url)
                          }}
                        >
                          <Link className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Insert Link</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            const url = prompt("Enter image URL:")
                            if (url) formatText("insertImage", url)
                          }}
                        >
                          <Image className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Insert Image</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Editor */}
                <div
                  ref={editorRef}
                  contentEditable
                  className="border border-t-0 rounded-b-lg p-4 min-h-[300px] focus:outline-none focus:ring-2 focus:ring-ring prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: bodyHtml }}
                  onInput={(e) => setBodyHtml(e.currentTarget.innerHTML)}
                />
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="ar" className="space-y-4 mt-4">
          {/* Subject Arabic */}
          <div className="space-y-2">
            <Label htmlFor="subject-ar">عنوان البريد</Label>
            <Input
              id="subject-ar"
              value={subjectAr}
              onChange={(e) => setSubjectAr(e.target.value)}
              placeholder="أدخل عنوان البريد..."
              dir="rtl"
            />
          </div>

          {/* Body Arabic */}
          <div className="space-y-2">
            <Label>محتوى البريد</Label>
            {showPreview ? (
              <div
                className="border rounded-lg p-4 min-h-[300px] bg-white"
                dir="rtl"
                dangerouslySetInnerHTML={{ __html: getPreviewHtml(bodyHtmlAr) }}
              />
            ) : (
              <>
                {/* Toolbar */}
                <div className="flex flex-wrap gap-1 p-2 border rounded-t-lg bg-muted/50">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => formatText("bold")}
                        >
                          <Bold className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>عريض</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => formatText("italic")}
                        >
                          <Italic className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>مائل</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => formatText("underline")}
                        >
                          <Underline className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>تسطير</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Editor */}
                <div
                  ref={editorArRef}
                  contentEditable
                  dir="rtl"
                  className="border border-t-0 rounded-b-lg p-4 min-h-[300px] focus:outline-none focus:ring-2 focus:ring-ring prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: bodyHtmlAr }}
                  onInput={(e) => setBodyHtmlAr(e.currentTarget.innerHTML)}
                />
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Variables */}
      <div className="space-y-2">
        <Label>Available Variables</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Click to insert a variable into the subject or content
        </p>
        <div className="flex flex-wrap gap-2">
          {variables.map((v: NotificationVariable) => (
            <Badge
              key={v.key}
              variant="outline"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => insertVariable(v.key)}
            >
              {`{${v.key}}`}
            </Badge>
          ))}
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => insertVariable("org_name")}
          >
            {"{org_name}"}
          </Badge>
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => insertVariable("org_logo")}
          >
            {"{org_logo}"}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Template
        </Button>
      </div>
    </div>
  )
}
