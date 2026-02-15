import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const checks: Record<string, "ok" | "error"> = {
    server: "ok",
    database: "error",
  }

  // Check database connectivity
  try {
    const supabase = createServiceClient()
    const { error } = await supabase
      .from("platform_settings")
      .select("key")
      .limit(1)
      .single()

    // Even a "no rows" response means the connection works
    checks.database = error && error.code !== "PGRST116" ? "error" : "ok"
  } catch {
    checks.database = "error"
  }

  const healthy = Object.values(checks).every((v) => v === "ok")

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || "dev",
    },
    { status: healthy ? 200 : 503 }
  )
}
