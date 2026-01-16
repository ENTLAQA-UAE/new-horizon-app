-- Vacancy Settings Tables Migration
-- This migration creates tables for managing vacancy/job settings

-- Application Questions Table
CREATE TABLE IF NOT EXISTS application_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_ar TEXT,
  field_type VARCHAR(50) NOT NULL DEFAULT 'text',
  options JSONB,
  is_required BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for organization filtering
CREATE INDEX IF NOT EXISTS idx_application_questions_org ON application_questions(organization_id);

-- Hiring Stages Table
CREATE TABLE IF NOT EXISTS hiring_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100),
  color VARCHAR(20) NOT NULL DEFAULT '#3B82F6',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for organization filtering
CREATE INDEX IF NOT EXISTS idx_hiring_stages_org ON hiring_stages(organization_id);

-- Job Types Table (Full-time, Part-time, Contract, etc.)
CREATE TABLE IF NOT EXISTS job_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for organization filtering
CREATE INDEX IF NOT EXISTS idx_job_types_org ON job_types(organization_id);

-- Job Grades Table
CREATE TABLE IF NOT EXISTS job_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100),
  level INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for organization filtering
CREATE INDEX IF NOT EXISTS idx_job_grades_org ON job_grades(organization_id);

-- Locations Table
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  name_ar VARCHAR(200),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for organization filtering
CREATE INDEX IF NOT EXISTS idx_locations_org ON locations(organization_id);

-- Add new columns to jobs table for linking to vacancy settings
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS job_type_id UUID REFERENCES job_types(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS job_grade_id UUID REFERENCES job_grades(id) ON DELETE SET NULL;

-- Create indexes for the new foreign keys
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location_id);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type_id);
CREATE INDEX IF NOT EXISTS idx_jobs_job_grade ON jobs(job_grade_id);

-- Enable RLS on all new tables
ALTER TABLE application_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hiring_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for application_questions
CREATE POLICY "Users can view their organization's application questions"
  ON application_questions FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Org admins can manage application questions"
  ON application_questions FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- RLS Policies for hiring_stages
CREATE POLICY "Users can view their organization's hiring stages"
  ON hiring_stages FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Org admins can manage hiring stages"
  ON hiring_stages FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- RLS Policies for job_types
CREATE POLICY "Users can view their organization's job types"
  ON job_types FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Org admins can manage job types"
  ON job_types FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- RLS Policies for job_grades
CREATE POLICY "Users can view their organization's job grades"
  ON job_grades FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Org admins can manage job grades"
  ON job_grades FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- RLS Policies for locations
CREATE POLICY "Users can view their organization's locations"
  ON locations FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Org admins can manage locations"
  ON locations FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- Add trigger for updated_at on all new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_application_questions_updated_at
  BEFORE UPDATE ON application_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hiring_stages_updated_at
  BEFORE UPDATE ON hiring_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_types_updated_at
  BEFORE UPDATE ON job_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_grades_updated_at
  BEFORE UPDATE ON job_grades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
