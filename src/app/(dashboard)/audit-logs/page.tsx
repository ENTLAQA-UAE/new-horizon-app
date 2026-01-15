import { createClient } from "@/lib/supabase/server"
import { AuditLogsClient } from "./audit-logs-client"

async function getAuditLogs() {
  const supabase = await createClient()

  // Get audit logs with user and org info
  const { data: logs, error } = await supabase
    .from("audit_logs")
    .select(`
      id,
      user_id,
      org_id,
      action,
      entity_type,
      entity_id,
      old_values,
      new_values,
      ip_address,
      user_agent,
      metadata,
      created_at,
      profiles:user_id (
        first_name,
        last_name,
        email
      ),
      organizations:org_id (
        name
      )
    `)
    .order("created_at", { ascending: false })
    .limit(500)

  if (error) {
    console.error("Error fetching audit logs:", error)
    return { logs: [], entityTypes: [], actions: [] }
  }

  // Get unique entity types and actions for filters
  const entityTypes = [...new Set(logs?.map((l) => l.entity_type) || [])]
  const actions = [...new Set(logs?.map((l) => l.action) || [])]

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
