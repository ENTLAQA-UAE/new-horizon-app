import { createClient } from "@/lib/supabase/server"
import { AuditLogsClient } from "./audit-logs-client"

async function getAuditLogs() {
  const supabase = await createClient()

  // Get audit logs
  const { data: logs, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500)

  if (error) {
    console.error("Error fetching audit logs:", error)
    return { logs: [], entityTypes: [], actions: [] }
  }

  // Get unique entity types and actions for filters
  const entityTypes = [...new Set(logs?.map((l) => l.entity_type).filter(Boolean) || [])]
  const actions = [...new Set(logs?.map((l) => l.action).filter(Boolean) || [])]

  return {
    logs: logs || [],
    entityTypes,
    actions,
  }
}

export default async function AuditLogsPage() {
  const { logs, entityTypes, actions } = await getAuditLogs()

  return (
    <AuditLogsClient
      initialLogs={logs}
      entityTypes={entityTypes}
      actions={actions}
    />
  )
}
