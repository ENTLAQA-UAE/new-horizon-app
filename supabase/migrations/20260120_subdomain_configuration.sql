-- Add subdomain configuration to organizations
-- The slug field will be used as the subdomain (e.g., slug 'acme' -> acme.jadarat-ats.app)

-- Add subdomain_enabled flag
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS subdomain_enabled BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN organizations.subdomain_enabled IS 'Whether subdomain access is enabled for this organization. When true, users can access the org at {slug}.jadarat-ats.app';

-- Create index for subdomain lookups
CREATE INDEX IF NOT EXISTS idx_organizations_subdomain_lookup
  ON organizations(slug)
  WHERE subdomain_enabled = true;
