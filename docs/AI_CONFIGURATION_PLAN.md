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

## Phase 2: AI Configuration UI (Org Settings)

| # | Task | Description | Status |
|---|------|-------------|--------|
| 2.1 | Create AI Configuration settings page | New page under org settings | ⬜ |
| 2.2 | Add provider selection cards | Claude, OpenAI, Gemini, Perplexity with logos | ⬜ |
| 2.3 | Add setup guidelines per provider | Step-by-step instructions to get API keys | ⬜ |
| 2.4 | Add credential input dialogs | Secure input with validation | ⬜ |
| 2.5 | Add test connection functionality | Verify credentials work | ⬜ |
| 2.6 | Add enable/disable toggles | Activate AI features after configuration | ⬜ |

## Phase 3: Job Description Generation

| # | Task | Description | Status |
|---|------|-------------|--------|
| 3.1 | Add "Generate with AI" button | Show in job form when in draft mode | ⬜ |
| 3.2 | Create AI JD generation endpoint | `/api/org/ai/generate-job-description` | ⬜ |
| 3.3 | Build unified AI client | Route to correct provider based on org config | ⬜ |
| 3.4 | Create JD generation prompts | Optimized prompts for each provider | ⬜ |
| 3.5 | Build generation result UI | Display generated JD, Requirements, Skills | ⬜ |
| 3.6 | Add regenerate & edit functionality | Allow users to regenerate or manually edit | ⬜ |

## Phase 4: CV Screening & Ranking

| # | Task | Description | Status |
|---|------|-------------|--------|
| 4.1 | Add "Review with AI" button | In application details / attachment tab | ⬜ |
| 4.2 | Create CV screening endpoint | `/api/org/ai/screen-candidate` | ⬜ |
| 4.3 | Build screening result UI | Feedback, skill gap analysis display | ⬜ |
| 4.4 | Create ranking system | Score & rank all applicants per job | ⬜ |
| 4.5 | Add ranking display in job view | Show ranked candidates list | ⬜ |
| 4.6 | Integrate scorecard data | Include interview feedback in ranking | ⬜ |
| 4.7 | Add re-rank after scorecard | Regenerate ranking with scorecard data | ⬜ |

## Phase 5: Cleanup & Migration

| # | Task | Description | Status |
|---|------|-------------|--------|
| 5.1 | Remove super admin AI settings | Delete AI config from admin settings | ⬜ |
| 5.2 | Update existing AI code | Use org config instead of global config | ⬜ |
| 5.3 | Add migration for existing orgs | Handle orgs without AI config gracefully | ⬜ |
| 5.4 | Testing & validation | End-to-end testing of all features | ⬜ |

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
