# Stripe Integration Plan for Subscription Management

## Overview
Add Stripe payment integration so org admins can complete payment after their 14-day trial, view subscription details (start/end dates), and see a trial countdown. Super admin configures Stripe keys.

## Implementation Steps

### Step 1: Install Stripe package + DB migration
- Install `stripe` npm package
- Create Supabase migration to add `stripe_customer_id` and `stripe_subscription_id` columns to `organizations` table
- Update TypeScript types in `types.ts` to include the new columns
- Store Stripe keys in `platform_settings` table (managed by super admin), not env vars

### Step 2: Super Admin — Stripe Settings page
- Add a new page `/src/app/(admin)/settings/stripe/page.tsx`
- UI: form to save Stripe Secret Key and Stripe Publishable Key into `platform_settings` table (keys: `stripe_secret_key`, `stripe_publishable_key`, `stripe_webhook_secret`)
- Show connection status indicator
- Add link to this page from admin sidebar/settings

### Step 3: API Routes — Stripe Checkout & Webhooks
- **`/api/stripe/checkout` (POST)**: Creates a Stripe Checkout Session
  - Reads Stripe secret key from `platform_settings`
  - Takes `org_id`, `tier_id`, `billing_cycle` (monthly/yearly)
  - Creates Stripe customer if org doesn't have `stripe_customer_id`
  - Creates checkout session with tier price
  - Returns checkout URL
- **`/api/stripe/webhook` (POST)**: Handles Stripe webhook events
  - `checkout.session.completed` → Activate subscription, set dates, update status to 'active'
  - `invoice.paid` → Extend subscription end date
  - `customer.subscription.deleted` → Set status to 'cancelled'
  - Updates org `subscription_status`, `subscription_start_date`, `subscription_end_date`
- **`/api/org/subscription` (GET)**: Returns current org subscription details for org admin

### Step 4: Org Admin — Subscription & Billing page
- New page at `/src/app/(org)/org/billing/page.tsx` + `billing-client.tsx`
- Shows:
  - Current plan name & tier details
  - Subscription status (trial / active / cancelled)
  - Trial countdown (days remaining) with progress bar if on trial
  - Subscription start date & end date
  - "Complete Payment" / "Upgrade Plan" button (redirects to Stripe Checkout)
  - Payment history (future: from Stripe invoices)
- Add to sidebar navigation under org admin sections
- Add middleware route permission for `/org/billing` → org_admin only

### Step 5: Trial Countdown Banner
- Add a persistent banner component in the org layout that shows for trial orgs:
  - "You have X days left in your trial. Complete payment to continue."
  - Links to billing page
  - Shows only when `subscription_status === 'trial'`

## Files to Create/Modify

**New files:**
1. `supabase/migrations/YYYYMMDD_stripe_columns.sql` — DB migration
2. `src/app/(admin)/settings/stripe/page.tsx` — Super admin Stripe config
3. `src/app/api/stripe/checkout/route.ts` — Checkout session API
4. `src/app/api/stripe/webhook/route.ts` — Webhook handler
5. `src/app/api/org/subscription/route.ts` — Org subscription details API
6. `src/app/(org)/org/billing/page.tsx` — Server component
7. `src/app/(org)/org/billing/billing-client.tsx` — Client component
8. `src/components/org/trial-banner.tsx` — Trial countdown banner

**Modified files:**
1. `src/lib/supabase/types.ts` — Add stripe columns to org types
2. `src/components/layout/sidebar.tsx` — Add billing link for org_admin
3. `src/lib/rbac/navigation.ts` — Add billing nav item
4. `src/lib/supabase/middleware.ts` — Add `/org/billing` route permission
5. `src/app/(org)/layout.tsx` — Add trial banner
