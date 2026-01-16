-- Add branding columns to organizations table
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS tagline VARCHAR(255),
  ADD COLUMN IF NOT EXISTS tagline_ar VARCHAR(255),
  ADD COLUMN IF NOT EXISTS favicon_url TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS careers_page_url TEXT;
