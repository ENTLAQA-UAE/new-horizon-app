"use client"

import { useState } from "react"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Search,
  FileText,
  User,
  Building2,
  Clock,
  Download,
  Eye,
  Plus,
  Pencil,
  Trash2,
  LogIn,
  LogOut,
  Settings,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { Json } from "@/lib/supabase/types"

interface AuditLog {
  id: string
  user_id: string | null
  org_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  old_values: Json | null
  new_values: Json | null
  ip_address: string | null
  user_agent: string | null
  metadata: Json | null
  created_at: string | null
}

interface AuditLogsClientProps {
  initialLogs: AuditLog[]
  entityTypes: string[]
  actions: string[]
}

const actionIcons: Record<string, any> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
  login: LogIn,
  logout: LogOut,
  settings_change: Settings,
}

const actionColors: Record<string, string> = {
  create: "bg-green-500",
  update: "bg-blue-500",
  delete: "bg-red-500",
  login: "bg-purple-500",
  logout: "bg-gray-500",
  settings_change: "bg-orange-500",
}

export function AuditLogsClient({
  initialLogs,
  entityTypes,
  actions,
}: AuditLogsClientProps) {
  const [logs] = useState<AuditLog[]>(initialLogs)
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [entityFilter, setEntityFilter] = useState<string>("all")
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const { t } = useI18n()

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_id?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesAction = actionFilter === "all" || log.action === actionFilter
    const matchesEntity = entityFilter === "all" || log.entity_type === entityFilter

    return matchesSearch && matchesAction && matchesEntity
  })

  // Stats
  const stats = {
    total: logs.length,
    today: logs.filter((l) => {
      if (!l.created_at) return false
      const today = new Date().toDateString()
      return new Date(l.created_at).toDateString() === today
    }).length,
    thisWeek: logs.filter((l) => {
      if (!l.created_at) return false
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(l.created_at) >= weekAgo
    }).length,
  }

  const exportLogs = () => {
    const csvContent = [
      ["Timestamp", "Action", "Entity Type", "Entity ID", "IP Address"],
      ...filteredLogs.map((log) => [
        log.created_at ? new Date(log.created_at).toISOString() : "",
        log.action,
        log.entity_type || "",
        log.entity_id || "",
        log.ip_address || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(t("admin.auditLogs.exportCsv"))
  }

  const formatAction = (action: string) => {
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const formatEntityType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const getActionIcon = (action: string) => {
    const Icon = actionIcons[action] || FileText
    return Icon
  }

  const getActionColor = (action: string) => {
    return actionColors[action] || "bg-gray-500"
  }

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return "—"
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return t("admin.auditLogs.justNow")
    if (minutes < 60) return t("admin.auditLogs.minutesAgo").replace("{count}", String(minutes))
    if (hours < 24) return t("admin.auditLogs.hoursAgo").replace("{count}", String(hours))
    if (days < 7) return t("admin.auditLogs.daysAgo").replace("{count}", String(days))
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("admin.auditLogs.title")}</h2>
          <p className="text-muted-foreground">
            {t("admin.auditLogs.subtitle")}
          </p>
        </div>
        <Button onClick={exportLogs}>
          <Download className="mr-2 h-4 w-4" />
          {t("admin.auditLogs.exportCsv")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.auditLogs.totalLogs")}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.auditLogs.today")}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.auditLogs.thisWeek")}</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeek}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.auditLogs.filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("admin.auditLogs.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("admin.auditLogs.filterByAction")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.auditLogs.allActions")}</SelectItem>
                {actions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {formatAction(action)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("admin.auditLogs.filterByEntity")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.auditLogs.allEntities")}</SelectItem>
                {entityTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {formatEntityType(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.auditLogs.activityLog")} ({filteredLogs.length})</CardTitle>
          <CardDescription>
            {t("admin.auditLogs.activityLogDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.auditLogs.timestamp")}</TableHead>
                <TableHead>{t("admin.auditLogs.action")}</TableHead>
                <TableHead>{t("admin.auditLogs.entity")}</TableHead>
                <TableHead>{t("admin.auditLogs.ipAddress")}</TableHead>
                <TableHead className="text-right">{t("admin.auditLogs.details")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {t("admin.auditLogs.noLogsFound")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => {
                  const ActionIcon = getActionIcon(log.action)
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {formatTimestamp(log.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`${getActionColor(log.action)} text-white`}
                        >
                          <ActionIcon className="h-3 w-3 mr-1" />
                          {formatAction(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{formatEntityType(log.entity_type || "unknown")}</div>
                          {log.entity_id && (
                            <div className="text-xs text-muted-foreground font-mono">
                              {log.entity_id.slice(0, 8)}...
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground font-mono text-sm">
                          {log.ip_address || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLog(log)
                            setIsDetailOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("admin.auditLogs.auditLogDetails")}</DialogTitle>
            <DialogDescription>
              {t("admin.auditLogs.auditLogDetailsDesc")}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t("admin.auditLogs.timestamp")}
                  </label>
                  <p className="mt-1">
                    {selectedLog.created_at
                      ? new Date(selectedLog.created_at).toLocaleString()
                      : "—"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t("admin.auditLogs.action")}
                  </label>
                  <p className="mt-1">{formatAction(selectedLog.action)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t("admin.auditLogs.entityType")}
                  </label>
                  <p className="mt-1">{formatEntityType(selectedLog.entity_type || "unknown")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t("admin.auditLogs.entityId")}
                  </label>
                  <p className="mt-1 font-mono text-sm">
                    {selectedLog.entity_id || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t("admin.auditLogs.ipAddress")}
                  </label>
                  <p className="mt-1 font-mono text-sm">
                    {selectedLog.ip_address || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t("admin.auditLogs.logId")}
                  </label>
                  <p className="mt-1 font-mono text-sm">{selectedLog.id}</p>
                </div>
              </div>

              {selectedLog.old_values && Object.keys(selectedLog.old_values as object).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t("admin.auditLogs.previousValues")}
                  </label>
                  <pre className="mt-1 p-3 bg-muted rounded-lg text-sm overflow-auto">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && Object.keys(selectedLog.new_values as object).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t("admin.auditLogs.newValues")}
                  </label>
                  <pre className="mt-1 p-3 bg-muted rounded-lg text-sm overflow-auto">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata as object).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t("admin.auditLogs.metadata")}
                  </label>
                  <pre className="mt-1 p-3 bg-muted rounded-lg text-sm overflow-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
