-- Add login page branding column to organizations table
-- This allows organizations to customize the login page background image

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS login_image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN organizations.login_image_url IS 'Custom background image URL for the organization-specific login page. Recommended dimensions: 1920x1080 (16:9) or 1200x1600 (3:4 portrait)';
