-- Add subdomain/custom domain management fields to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS subdomain_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN DEFAULT FALSE;

-- Index for fast domain lookups in middleware
CREATE INDEX IF NOT EXISTS idx_organizations_custom_domain
  ON public.organizations (custom_domain) WHERE custom_domain IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_slug
  ON public.organizations (slug);
