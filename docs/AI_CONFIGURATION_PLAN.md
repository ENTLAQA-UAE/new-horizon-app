# AI Configuration Implementation Plan

## Overview

Implement per-organization AI configuration allowing each org admin to configure their own AI provider (Claude, OpenAI, Gemini, Perplexity) with guidelines and credential verification.

## AI Features

### Feature 1: Job Description Generation
- When HR team creates a job in draft mode
- "Generate with AI" button collects job information
- AI generates: Job Description, Requirements, Skills Required
- Users can regenerate or edit manually

### Feature 2: CV Screening & Ranking
- In application details, "Review with AI" button
- Compare CV + application form against Job Details
- Screening feedback with skill gap analysis
- Rank all applicants for the same job
- Re-rank after scorecard submission with interview feedback

---

## Phase 1: Database & Backend Infrastructure ✅ COMPLETED

| # | Task | Description | Status |
|---|------|-------------|--------|
| 1.1 | Create `organization_ai_config` table | Store AI provider credentials per org (encrypted) | ✅ |
| 1.2 | Add AI provider types & settings schema | Support Claude, OpenAI, Gemini, Perplexity | ✅ |
| 1.3 | Create encryption helpers for AI keys | Reuse existing encryption pattern | ✅ |
| 1.4 | Create org AI config helper functions | `getOrgAIConfig()`, `saveOrgAICredentials()`, etc. | ✅ |
| 1.5 | Create API routes for AI configuration | CRUD endpoints for org AI settings | ✅ |
| 1.6 | Create credential verification endpoints | Test API keys with each provider | ✅ |

### Phase 1 Deliverables:
- **Migration**: `supabase/migrations/20260129_organization_ai_config.sql`
- **Helper Functions**: `src/lib/ai/org-ai-config.ts`
- **API Routes**:
  - `GET /api/org/ai/config` - Get all AI configs
  - `POST /api/org/ai/credentials` - Save credentials
  - `POST /api/org/ai/toggle` - Enable/disable provider
  - `POST /api/org/ai/default` - Set default provider
  - `POST /api/org/ai/settings` - Update provider settings
  - `POST /api/org/ai/test` - Test/verify credentials
  - `DELETE /api/org/ai/delete` - Remove provider config

## Phase 2: AI Configuration UI (Org Settings) ✅ COMPLETED

| # | Task | Description | Status |
|---|------|-------------|--------|
| 2.1 | Create AI Configuration settings page | New page under org settings | ✅ |
| 2.2 | Add provider selection cards | Claude, OpenAI, Gemini, Perplexity with logos | ✅ |
| 2.3 | Add setup guidelines per provider | Step-by-step instructions to get API keys | ✅ |
| 2.4 | Add credential input dialogs | Secure input with validation | ✅ |
| 2.5 | Add test connection functionality | Verify credentials work | ✅ |
| 2.6 | Add enable/disable toggles | Activate AI features after configuration | ✅ |

### Phase 2 Deliverables:
- **Page**: `src/app/(org)/org/settings/ai/page.tsx`
- **Client Component**: `src/app/(org)/org/settings/ai/ai-settings-client.tsx`
- **Navigation**: Added "AI Configuration" link to sidebar settings section
- **Features**:
  - Provider cards with status badges (Active, Verified, Default, etc.)
  - Setup instructions accordion for each provider
  - Credential input dialogs with show/hide password toggle
  - Test connection with real-time feedback
  - Model selection and settings configuration (temperature, max_tokens, custom instructions)
  - Enable/disable toggles and set default provider
  - Delete configuration with confirmation dialog

## Phase 3: Job Description Generation ✅ COMPLETED

| # | Task | Description | Status |
|---|------|-------------|--------|
| 3.1 | Add "Generate with AI" button | Show in job form when in draft mode | ✅ |
| 3.2 | Create AI JD generation endpoint | `/api/org/ai/generate-job-description` | ✅ |
| 3.3 | Build unified AI client | Route to correct provider based on org config | ✅ |
| 3.4 | Create JD generation prompts | Optimized prompts for each provider | ✅ |
| 3.5 | Build generation result UI | Display generated JD, Requirements, Skills | ✅ |
| 3.6 | Add regenerate & edit functionality | Allow users to regenerate or manually edit | ✅ |

### Phase 3 Deliverables:
- **Unified AI Client**: `src/lib/ai/unified-client.ts`
  - Routes to correct provider (Anthropic, OpenAI, Gemini, Perplexity)
  - Handles token tracking and usage logging
  - Parses JSON responses from all providers
- **API Endpoint**: `src/app/api/org/ai/generate-job-description/route.ts`
  - Generates bilingual job descriptions (English/Arabic)
  - Includes requirements, responsibilities, benefits, skills
- **UI Components** (in `jobs-client.tsx`):
  - "Generate with AI" button in job create/edit form
  - Preview dialog showing generated content
  - Regenerate and Apply to Form buttons

## Phase 4: CV Screening & Ranking ✅ COMPLETED

| # | Task | Description | Status |
|---|------|-------------|--------|
| 4.1 | Add "Review with AI" button | In application details / AI Review tab | ✅ |
| 4.2 | Create CV screening endpoint | `/api/org/ai/screen-candidate` | ✅ |
| 4.3 | Build screening result UI | Feedback, skill gap analysis display | ✅ |
| 4.4 | Create ranking system | Score & rank all applicants per job | ✅ |
| 4.5 | Integrate scorecard data | Include interview feedback in screening | ✅ |
| 4.6 | Add re-analyze functionality | Regenerate screening with updated data | ✅ |

### Phase 4 Deliverables:
- **CV Screening Endpoint**: `src/app/api/org/ai/screen-candidate/route.ts`
  - POST: Run AI screening for candidate against job requirements
  - GET: Retrieve existing screening results
  - Stores results in `candidate_ai_screening` table
  - Updates `ai_match_score` on applications
- **Ranking Endpoint**: `src/app/api/org/ai/rank-applicants/route.ts`
  - Ranks all applicants for a job
  - Includes interview scorecard data for comprehensive ranking
- **UI Components** (in `applications-client.tsx`):
  - "AI Review" tab in application details dialog
  - "Review with AI" button to trigger screening
  - Comprehensive screening results display:
    - Overall score and recommendation badge
    - Skills analysis (matched, missing, additional)
    - Experience analysis with highlights and concerns
    - Strengths and weaknesses
    - Interview focus areas
    - Cultural fit score
    - Education requirements check
  - Re-analyze button for updated screening

## Phase 5: Cleanup & Migration ✅ COMPLETED

| # | Task | Description | Status |
|---|------|-------------|--------|
| 5.1 | Remove super admin AI settings | Replaced with info card pointing to org settings | ✅ |
| 5.2 | Update existing AI code | Hook updated to use org endpoints, old endpoints deprecated | ✅ |
| 5.3 | Add migration for existing orgs | New endpoints return helpful error when AI not configured | ✅ |
| 5.4 | Testing & validation | TypeScript build errors fixed, deprecation warnings added | ✅ |

### Phase 5 Deliverables:
- **Admin Settings Updated**: `src/app/(admin)/settings/settings-client.tsx`
  - Removed old global AI configuration card
  - Added informational card directing to org-level settings
- **Hook Updated**: `src/hooks/use-ai.ts`
  - Types moved from old client.ts into the hook
  - `generateJobDescription()` now calls `/api/org/ai/generate-job-description`
  - `scoreCandidate()` now calls `/api/org/ai/screen-candidate`
  - Legacy methods (`parseResume`, `generateInterviewQuestions`) marked deprecated
- **Deprecated Endpoints**: Added deprecation warnings to all `/api/ai/*` routes
  - `/api/ai/parse-resume` - deprecated, console warning
  - `/api/ai/score-candidate` - deprecated, use `/api/org/ai/screen-candidate`
  - `/api/ai/generate-job` - deprecated, use `/api/org/ai/generate-job-description`
  - `/api/ai/generate-email` - deprecated, console warning
- **Graceful Handling**: New org-level endpoints return clear error message:
  `"AI not configured. Please configure an AI provider in Settings > AI Configuration."`

---

## Supported AI Providers

| Provider | API Available | Required Credentials |
|----------|---------------|---------------------|
| **Anthropic Claude** | ✅ | `api_key` |
| **OpenAI** | ✅ | `api_key`, optional: `organization_id` |
| **Google Gemini** | ✅ | `api_key` |
| **Perplexity** | ✅ | `api_key` |

---

## Database Schema

### Table: `organization_ai_config`

```sql
CREATE TABLE organization_ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'anthropic', 'openai', 'gemini', 'perplexity'
  credentials_encrypted TEXT, -- AES-256 encrypted API keys
  settings JSONB DEFAULT '{}', -- Provider-specific settings (model, temperature, etc.)
  is_enabled BOOLEAN DEFAULT false,
  is_configured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  UNIQUE(org_id, provider)
);
```

---

## Notes

- All credentials are encrypted using AES-256-GCM (same as video configuration)
- Only org admins can configure AI settings
- AI features are disabled by default until configured and verified
- Super admin AI settings will be removed after implementation
