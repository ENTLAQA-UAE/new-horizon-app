import { createClient } from "@supabase/supabase-js"
import type { Database } from "./types"

/**
 * Creates a Supabase client with service role key
 * This bypasses RLS policies and should only be used for:
 * - Webhook handlers
 * - Background jobs
 * - Admin operations
 *
 * NEVER expose this client to the frontend
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service role credentials")
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
