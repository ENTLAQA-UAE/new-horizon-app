"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShieldAlert, Mail } from "lucide-react"
import { useSubscriptionGuard } from "@/lib/subscription/subscription-context"
import { useI18n } from "@/lib/i18n"

/**
 * Restriction Modal for Non-Admin Users
 *
 * Shows a generic, neutral message when the org's subscription is inactive.
 * Per B2B best practices:
 * - Does NOT mention billing, payment, trial, or subscription
 * - Directs the user to contact their organization administrator
 * - Shows admin contact info if available
 */
export function SubscriptionRestrictionModal() {
  const { showRestrictionModal, dismissRestriction, adminContact } = useSubscriptionGuard()
  const { language } = useI18n()
  const isAr = language === "ar"

  const adminName = adminContact
    ? [adminContact.first_name, adminContact.last_name].filter(Boolean).join(" ")
    : null

  return (
    <Dialog open={showRestrictionModal} onOpenChange={(open) => !open && dismissRestriction()}>
      <DialogContent className="sm:max-w-md" dir={isAr ? "rtl" : "ltr"}>
        <DialogHeader className="items-center text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <ShieldAlert className="h-7 w-7 text-amber-600" />
          </div>
          <DialogTitle className="text-center">
            {isAr ? "الوصول مقيّد" : "Access Restricted"}
          </DialogTitle>
          <DialogDescription className="text-center leading-relaxed">
            {isAr
              ? "الوصول إلى هذه الميزة مقيّد حالياً. يرجى التواصل مع مسؤول مؤسستك للمساعدة."
              : "Access to this feature is currently restricted. Please reach out to your organization administrator for assistance."
            }
          </DialogDescription>
        </DialogHeader>

        {/* Admin contact info */}
        {(adminName || adminContact?.email) && (
          <div className="mx-auto flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              {adminName && (
                <span className="text-sm font-medium text-foreground">{adminName}</span>
              )}
              {adminContact?.email && (
                <a
                  href={`mailto:${adminContact.email}`}
                  className="text-xs text-primary hover:underline"
                >
                  {adminContact.email}
                </a>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-center">
          <Button
            variant="default"
            onClick={dismissRestriction}
            className="min-w-[120px]"
          >
            {isAr ? "حسناً" : "OK"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
