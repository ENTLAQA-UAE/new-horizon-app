"use client"

import { useAuth } from "@/lib/auth/auth-context"
import { redirect } from "next/navigation"
import BillingClient from "./billing-client"

export default function OrgBillingPage() {
  const { user } = useAuth()
  if (!user) redirect("/login")

  return <BillingClient />
}
