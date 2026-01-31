# Multi-Tenant Subdomain & Custom Domain Implementation Plan

> **Status:** Approved — awaiting domain purchase before implementation
> **Decision:** Option A — Custom root domain with wildcard DNS (e.g., `*.jadarat-ats.com`)
> **Priority:** Next major feature after onboarding guide

---

## 1. Context & Goal

The platform is a multi-tenant ATS at `https://jadarat-ats.vercel.app/`. Each organization should be able to:

1. **Get a subdomain** — e.g., `https://allianz.jadarat-ats.com/` (auto-generated from org slug)
2. **Configure a custom domain** — e.g., `https://careers.allianz.com/` (manual DNS setup by org admin)

When users access the platform via a subdomain or custom domain, the **login page** should display:
- The organization's **logo** (left side)
- The organization's **login page image** (right side, uploaded via branding page)
- The organization's **brand colors** (gradient, buttons)
- The organization's **name**

---

## 2. Current State — What Already Exists

| Asset | Table/Field | Status |
|-------|------------|--------|
| Org slug (unique) | `organizations.slug` | Exists — used for subdomain name |
| Custom domain field | `organizations.custom_domain` | Exists — currently stores website URL |
| Logo | `organizations.logo_url` | Exists — uploaded via branding page |
| Login page image | `organizations.login_image_url` | Exists in DB, uploaded via branding page |
| Brand colors | `organizations.primary_color`, `secondary_color` | Exists |
| Login `?org=` param | Login page code | Exists — fetches org branding by slug |
| Branding management page | `/org/branding` | Exists — org_admin manages all assets |
| Middleware | `src/lib/supabase/middleware.ts` | Exists — no subdomain routing yet |
| Storage bucket | `organization-assets` (public) | Exists — stores logos, favicons, login images |

### Known Bug to Fix
The login page defines `login_image_url` in its interface but **does not fetch it** from the database query. The branding page correctly uploads and stores it. The login page query needs to include `login_image_url` in its select statement.

**File:** `src/app/(auth)/login/page.tsx` — the `.select()` call around line 111 is missing `login_image_url`.

---

## 3. Architecture: How It Works

```
Request comes in (e.g., https://allianz.jadarat-ats.com/login)
     │
     ▼
┌─────────────────────────────────────────────┐
│  Next.js Middleware (src/middleware.ts)       │
│                                              │
│  1. Read hostname from request headers       │
│  2. Extract subdomain:                       │
│     "allianz.jadarat-ats.com" → "allianz"   │
│  3. OR match custom domain:                  │
│     "careers.allianz.com" → lookup in DB     │
│  4. Resolve org_id from slug or domain       │
│  5. Set response header: x-org-slug          │
│  6. Continue to page                         │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Login Page                                  │
│                                              │
│  1. Read org slug from:                      │
│     - x-org-slug header (subdomain/domain)   │
│     - OR ?org= query param (fallback)        │
│  2. Fetch org branding from DB               │
│  3. Display branded login:                   │
│     ┌──────────────┬──────────────────┐      │
│     │  Org Logo    │                  │      │
│     │  Org Name    │  Login Image     │      │
│     │              │  (from branding) │      │
│     │  Login Form  │                  │      │
│     │  (branded    │                  │      │
│     │   colors)    │                  │      │
│     └──────────────┴──────────────────┘      │
└─────────────────────────────────────────────┘
```

---

## 4. Domain Strategy (Option A — Wildcard)

### Why Wildcard
Vercel does NOT support wildcard subdomains on `.vercel.app` domains. A custom root domain is required.

### Setup Steps (Manual, One-Time)
1. **Purchase domain** — e.g., `jadarat-ats.com`
2. **Add to Vercel project:**
   - `jadarat-ats.com` (root)
   - `*.jadarat-ats.com` (wildcard)
3. **DNS records at registrar:**
   - `A` record for `jadarat-ats.com` → Vercel IP `76.76.21.21`
   - `CNAME` record for `*.jadarat-ats.com` → `cname.vercel-dns.com`
4. **Update environment variables** — set `NEXT_PUBLIC_ROOT_DOMAIN=jadarat-ats.com`

After this, ANY org slug automatically works as a subdomain with zero API calls.

---

## 5. Database Changes

### Modify `organizations` table

```sql
-- Add subdomain/domain management fields
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS subdomain_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN DEFAULT FALSE;

-- Index for fast domain lookups in middleware
CREATE INDEX IF NOT EXISTS idx_organizations_custom_domain
  ON public.organizations (custom_domain) WHERE custom_domain IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_slug
  ON public.organizations (slug);
```

### Update `types.ts`
Add `subdomain_enabled` and `custom_domain_verified` to the organizations Row/Insert/Update types.

---

## 6. Implementation Tasks

### Task 1: Fix Login Page Bug
**File:** `src/app/(auth)/login/page.tsx`
- Add `login_image_url` to the `.select()` query
- Display the image on the right side of the login page when available
- Fall back to default gradient/marketing content when no image

### Task 2: Middleware — Subdomain/Domain Resolution
**File:** `src/lib/supabase/middleware.ts`
- Parse `Host` header to detect subdomain or custom domain
- Extract slug from subdomain: `{slug}.jadarat-ats.com` → `slug`
- For custom domains: query `organizations` table by `custom_domain`
- Set `x-org-slug` response header for downstream pages
- Skip resolution for the root domain (`jadarat-ats.com` with no subdomain)
- Skip resolution for known system subdomains (e.g., `www`, `api`)

```typescript
// Pseudocode for middleware
const hostname = request.headers.get("host") || ""
const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN // "jadarat-ats.com"

let orgSlug: string | null = null

if (hostname.endsWith(`.${rootDomain}`)) {
  // Subdomain detected
  const subdomain = hostname.replace(`.${rootDomain}`, "")
  if (!["www", "api", "admin"].includes(subdomain)) {
    orgSlug = subdomain
  }
} else if (hostname !== rootDomain && hostname !== `www.${rootDomain}`) {
  // Custom domain — lookup in DB
  const org = await lookupOrgByDomain(hostname)
  if (org) orgSlug = org.slug
}

if (orgSlug) {
  // Set header for downstream pages
  response.headers.set("x-org-slug", orgSlug)
}
```

### Task 3: Login Page Enhancement
**File:** `src/app/(auth)/login/page.tsx`
- Read org slug from `x-org-slug` header (via `headers()` in server component or cookie)
- Fall back to `?org=` query param
- When org is detected:
  - Left side: org logo, org name, branded login form (brand colors on button)
  - Right side: `login_image_url` as the full-height image
- When no org (root domain): show default Jadarat branding (current behavior)

### Task 4: Settings UI — Domain Configuration
**File:** New section in `src/app/(org)/org/settings/page.tsx` (org_admin only)
- **Subdomain section:**
  - Toggle to enable subdomain
  - Auto-displays: `{slug}.jadarat-ats.com` (read-only, based on org slug)
  - "Copy URL" button
- **Custom domain section:**
  - Input field for custom domain (e.g., `hire.allianz.com`)
  - DNS instructions panel:
    ```
    Add a CNAME record in your DNS provider:
    Type:  CNAME
    Name:  hire (or your subdomain)
    Value: cname.vercel-dns.com
    TTL:   3600
    ```
  - "Verify DNS" button — calls API to check CNAME resolution
  - Status badge: Pending / Verified / Failed

### Task 5: Domain Verification API
**File:** `src/app/api/org/domain/route.ts`
- `POST` — Save subdomain/custom domain settings
- `POST /verify` — Check DNS resolution for custom domain
  - Use `dns.resolve()` or external DNS API to verify CNAME points to Vercel
  - Update `custom_domain_verified` flag
- For custom domains: call Vercel API to add domain to project

### Task 6: Vercel API Integration (Custom Domains Only)
**File:** `src/lib/vercel/domain-service.ts`
- When org_admin adds a custom domain AND DNS is verified:
  - Call Vercel API: `POST /v10/projects/{projectId}/domains` to add the domain
- When org_admin removes a custom domain:
  - Call Vercel API: `DELETE /v10/projects/{projectId}/domains/{domain}`
- Requires: `VERCEL_API_TOKEN` and `VERCEL_PROJECT_ID` env vars

---

## 7. Environment Variables Needed

```env
# Root domain for subdomain extraction
NEXT_PUBLIC_ROOT_DOMAIN=jadarat-ats.com

# Vercel API (for custom domain management)
VERCEL_API_TOKEN=xxx
VERCEL_PROJECT_ID=xxx
```

---

## 8. File Changes Summary

```
Modified:
├── src/lib/supabase/middleware.ts        ← Subdomain/domain resolution
├── src/lib/supabase/types.ts             ← New org columns
├── src/app/(auth)/login/page.tsx         ← Branded login + login_image_url fix
├── src/app/(org)/org/settings/page.tsx   ← Domain settings UI (org_admin)
│
New:
├── src/app/api/org/domain/route.ts       ← Domain save + verify API
├── src/app/api/org/domain/verify/route.ts← DNS verification endpoint
├── src/lib/vercel/domain-service.ts      ← Vercel API integration
│
Database:
├── supabase/migrations/XXXX_org_domain_fields.sql ← New columns + indexes
```

---

## 9. Edge Cases to Handle

- **Root domain access** (`jadarat-ats.com/login`) → Show default Jadarat branding
- **Invalid subdomain** (`nonexistent.jadarat-ats.com`) → Redirect to root or show 404
- **System subdomains** (`www`, `api`, `admin`) → Skip org resolution
- **Unverified custom domain** → Don't serve org content until DNS verified
- **Org slug change** → Subdomain changes automatically (slug is the subdomain)
- **Multiple orgs same custom domain** → Enforce uniqueness constraint on `custom_domain`

---

## 10. Prerequisites Before Starting

- [ ] Purchase production domain (e.g., `jadarat-ats.com`)
- [ ] Add domain + wildcard to Vercel project
- [ ] Configure DNS (A record + wildcard CNAME)
- [ ] Set environment variables (`NEXT_PUBLIC_ROOT_DOMAIN`, `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`)
- [ ] Run SQL migration for new columns
