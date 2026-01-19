-- Career Page Builder Schema
-- Stores configurable blocks and styles for career pages

-- Add career page configuration to organizations
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS career_page_config JSONB DEFAULT '{
  "blocks": [],
  "styles": {
    "primaryColor": "#3B82F6",
    "secondaryColor": "#10B981",
    "backgroundColor": "#FFFFFF",
    "textColor": "#1F2937",
    "fontFamily": "Inter",
    "borderRadius": "8px"
  },
  "seo": {
    "title": null,
    "description": null,
    "keywords": []
  },
  "settings": {
    "showHeader": true,
    "showFooter": true,
    "showLogo": true,
    "language": "en"
  }
}'::JSONB;

-- Create career page blocks table for more granular control
CREATE TABLE IF NOT EXISTS career_page_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  block_type VARCHAR(50) NOT NULL,
  block_order INT NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  content JSONB NOT NULL DEFAULT '{}',
  styles JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, block_order)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_career_page_blocks_org_id ON career_page_blocks(org_id);
CREATE INDEX IF NOT EXISTS idx_career_page_blocks_order ON career_page_blocks(org_id, block_order);

-- Enable RLS
ALTER TABLE career_page_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for career_page_blocks
CREATE POLICY "Users can view career page blocks for their org"
ON career_page_blocks FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can manage career page blocks"
ON career_page_blocks FOR ALL
USING (
  org_id IN (
    SELECT org_id FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'org_admin')
  )
);

-- Public read policy for career pages (no auth required)
CREATE POLICY "Public can view career page blocks"
ON career_page_blocks FOR SELECT
USING (enabled = true);

-- Create table for career page media/assets
CREATE TABLE IF NOT EXISTS career_page_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INT,
  alt_text VARCHAR(255),
  alt_text_ar VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_career_page_assets_org_id ON career_page_assets(org_id);

-- Enable RLS for assets
ALTER TABLE career_page_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assets for their org"
ON career_page_assets FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can manage assets"
ON career_page_assets FOR ALL
USING (
  org_id IN (
    SELECT org_id FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'org_admin')
  )
);

-- Public read for assets
CREATE POLICY "Public can view assets"
ON career_page_assets FOR SELECT
USING (true);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_career_page_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS career_page_blocks_updated_at ON career_page_blocks;
CREATE TRIGGER career_page_blocks_updated_at
  BEFORE UPDATE ON career_page_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_career_page_blocks_updated_at();

-- Add career_page_published column to track publish status
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS career_page_published BOOLEAN DEFAULT false;

COMMENT ON TABLE career_page_blocks IS 'Stores configurable content blocks for organization career pages';
COMMENT ON TABLE career_page_assets IS 'Stores media assets used in career pages';
COMMENT ON COLUMN organizations.career_page_config IS 'JSON configuration for career page styling and settings';
