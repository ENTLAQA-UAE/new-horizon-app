-- =====================================================
-- APPLICATION FORM SECTIONS AND FIELDS SYSTEM
-- =====================================================

-- Application form sections (e.g., Basic Information, Contact Details, Education)
CREATE TABLE IF NOT EXISTS application_form_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  description TEXT,
  icon VARCHAR(50) DEFAULT 'user',
  is_default BOOLEAN DEFAULT false,  -- Default sections cannot be deleted
  is_enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Application form fields (questions within sections)
CREATE TABLE IF NOT EXISTS application_form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES application_form_sections(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  field_type VARCHAR(50) NOT NULL DEFAULT 'text', -- text, email, phone, date, select, textarea, file, checkbox
  placeholder VARCHAR(255),
  placeholder_ar VARCHAR(255),
  options JSONB, -- For select fields: [{"value": "male", "label": "Male", "label_ar": "ذكر"}]
  validation JSONB, -- {"min": 0, "max": 100, "pattern": "regex"}
  is_default BOOLEAN DEFAULT false, -- Default fields cannot be deleted
  is_required BOOLEAN DEFAULT false,
  is_enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job-specific application form configuration
CREATE TABLE IF NOT EXISTS job_application_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  section_id UUID REFERENCES application_form_sections(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, section_id)
);

-- Job-specific field configuration (override required status per job)
CREATE TABLE IF NOT EXISTS job_application_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  field_id UUID REFERENCES application_form_fields(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, field_id)
);

-- =====================================================
-- UPDATE HIRING STAGES
-- =====================================================

-- Add is_default column to hiring_stages
ALTER TABLE hiring_stages
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_terminal BOOLEAN DEFAULT false; -- For stages like Hired, Disqualified

-- Job-specific hiring stages configuration
CREATE TABLE IF NOT EXISTS job_hiring_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES hiring_stages(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, stage_id)
);

-- =====================================================
-- JOB RECRUITERS
-- =====================================================

CREATE TABLE IF NOT EXISTS job_recruiters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'recruiter', -- recruiter, hiring_manager, interviewer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, user_id)
);

-- =====================================================
-- UPDATE JOBS TABLE
-- =====================================================

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS auto_deactivated BOOLEAN DEFAULT false;

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_app_sections_org ON application_form_sections(org_id);
CREATE INDEX IF NOT EXISTS idx_app_fields_section ON application_form_fields(section_id);
CREATE INDEX IF NOT EXISTS idx_app_fields_org ON application_form_fields(org_id);
CREATE INDEX IF NOT EXISTS idx_job_app_sections_job ON job_application_sections(job_id);
CREATE INDEX IF NOT EXISTS idx_job_app_fields_job ON job_application_fields(job_id);
CREATE INDEX IF NOT EXISTS idx_job_hiring_stages_job ON job_hiring_stages(job_id);
CREATE INDEX IF NOT EXISTS idx_job_recruiters_job ON job_recruiters(job_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE application_form_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_application_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_application_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_hiring_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_recruiters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for application_form_sections
CREATE POLICY "Users can view their org's form sections"
  ON application_form_sections FOR SELECT
  USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage their org's form sections"
  ON application_form_sections FOR ALL
  USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies for application_form_fields
CREATE POLICY "Users can view their org's form fields"
  ON application_form_fields FOR SELECT
  USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage their org's form fields"
  ON application_form_fields FOR ALL
  USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies for job-specific tables
CREATE POLICY "Users can view job application sections"
  ON job_application_sections FOR SELECT
  USING (true);

CREATE POLICY "Users can manage job application sections"
  ON job_application_sections FOR ALL
  USING (true);

CREATE POLICY "Users can view job application fields"
  ON job_application_fields FOR SELECT
  USING (true);

CREATE POLICY "Users can manage job application fields"
  ON job_application_fields FOR ALL
  USING (true);

CREATE POLICY "Users can view job hiring stages"
  ON job_hiring_stages FOR SELECT
  USING (true);

CREATE POLICY "Users can manage job hiring stages"
  ON job_hiring_stages FOR ALL
  USING (true);

CREATE POLICY "Users can view job recruiters"
  ON job_recruiters FOR SELECT
  USING (true);

CREATE POLICY "Users can manage job recruiters"
  ON job_recruiters FOR ALL
  USING (true);

-- =====================================================
-- SEED DEFAULT SECTIONS AND FIELDS
-- =====================================================

-- Function to seed default application form for an organization
CREATE OR REPLACE FUNCTION seed_default_application_form(p_org_id UUID)
RETURNS VOID AS $$
DECLARE
  v_basic_info_id UUID;
  v_contact_id UUID;
  v_education_id UUID;
  v_experience_id UUID;
BEGIN
  -- Basic Information Section (Default, cannot be disabled)
  INSERT INTO application_form_sections (org_id, name, name_ar, icon, is_default, is_enabled, sort_order)
  VALUES (p_org_id, 'Basic Information', 'المعلومات الأساسية', 'user', true, true, 1)
  RETURNING id INTO v_basic_info_id;

  -- Basic Information Fields
  INSERT INTO application_form_fields (section_id, org_id, name, name_ar, field_type, is_default, is_required, is_enabled, sort_order) VALUES
  (v_basic_info_id, p_org_id, 'First Name', 'الاسم الأول', 'text', true, true, true, 1),
  (v_basic_info_id, p_org_id, 'Last Name', 'اسم العائلة', 'text', true, true, true, 2),
  (v_basic_info_id, p_org_id, 'Email', 'البريد الإلكتروني', 'email', true, true, true, 3),
  (v_basic_info_id, p_org_id, 'LinkedIn', 'لينكد إن', 'url', false, false, true, 4),
  (v_basic_info_id, p_org_id, 'Gender', 'الجنس', 'select', false, false, true, 5),
  (v_basic_info_id, p_org_id, 'Date of Birth', 'تاريخ الميلاد', 'date', false, false, true, 6);

  -- Contact Details Section
  INSERT INTO application_form_sections (org_id, name, name_ar, icon, is_default, is_enabled, sort_order)
  VALUES (p_org_id, 'Contact Details', 'بيانات التواصل', 'globe', false, true, 2)
  RETURNING id INTO v_contact_id;

  INSERT INTO application_form_fields (section_id, org_id, name, name_ar, field_type, is_default, is_required, is_enabled, sort_order) VALUES
  (v_contact_id, p_org_id, 'Country of Residency', 'بلد الإقامة', 'select', false, true, true, 1),
  (v_contact_id, p_org_id, 'City', 'المدينة', 'text', false, true, true, 2),
  (v_contact_id, p_org_id, 'Phone Number', 'رقم الهاتف', 'phone', false, true, true, 3);

  -- Education Section
  INSERT INTO application_form_sections (org_id, name, name_ar, icon, is_default, is_enabled, sort_order)
  VALUES (p_org_id, 'Education', 'التعليم', 'graduation-cap', false, true, 3)
  RETURNING id INTO v_education_id;

  INSERT INTO application_form_fields (section_id, org_id, name, name_ar, field_type, is_default, is_required, is_enabled, sort_order) VALUES
  (v_education_id, p_org_id, 'Education Level', 'المستوى التعليمي', 'select', false, true, true, 1),
  (v_education_id, p_org_id, 'University or School Name', 'اسم الجامعة أو المدرسة', 'text', false, true, true, 2),
  (v_education_id, p_org_id, 'Major', 'التخصص', 'text', false, true, true, 3),
  (v_education_id, p_org_id, 'Year of Graduation', 'سنة التخرج', 'number', false, false, true, 4),
  (v_education_id, p_org_id, 'GPA / Rating', 'المعدل التراكمي', 'text', false, false, true, 5);

  -- Experience Section
  INSERT INTO application_form_sections (org_id, name, name_ar, icon, is_default, is_enabled, sort_order)
  VALUES (p_org_id, 'Experience', 'الخبرة', 'briefcase', false, true, 4)
  RETURNING id INTO v_experience_id;

  INSERT INTO application_form_fields (section_id, org_id, name, name_ar, field_type, is_default, is_required, is_enabled, sort_order) VALUES
  (v_experience_id, p_org_id, 'Position', 'المسمى الوظيفي', 'text', false, true, true, 1),
  (v_experience_id, p_org_id, 'Company', 'الشركة', 'text', false, true, true, 2),
  (v_experience_id, p_org_id, 'Location', 'الموقع', 'text', false, false, true, 3),
  (v_experience_id, p_org_id, 'From Date', 'من تاريخ', 'date', false, true, true, 4),
  (v_experience_id, p_org_id, 'To Date', 'إلى تاريخ', 'date', false, false, true, 5),
  (v_experience_id, p_org_id, 'Years of Experience', 'سنوات الخبرة', 'number', false, false, true, 6),
  (v_experience_id, p_org_id, 'Role Description', 'وصف الدور', 'textarea', false, false, true, 7);
END;
$$ LANGUAGE plpgsql;

-- Function to seed default hiring stages for an organization
CREATE OR REPLACE FUNCTION seed_default_hiring_stages(p_org_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Insert default stages if they don't exist
  INSERT INTO hiring_stages (org_id, name, name_ar, color, sort_order, is_default, is_terminal) VALUES
  (p_org_id, 'New', 'جديد', '#3B82F6', 1, true, false),
  (p_org_id, 'Pipeline', 'قيد المراجعة', '#8B5CF6', 2, false, false),
  (p_org_id, 'Shortlist', 'القائمة المختصرة', '#F59E0B', 3, false, false),
  (p_org_id, 'HR Interview', 'مقابلة الموارد البشرية', '#06B6D4', 4, false, false),
  (p_org_id, 'Technical Interview', 'المقابلة الفنية', '#10B981', 5, false, false),
  (p_org_id, 'Assessment', 'التقييم', '#EC4899', 6, false, false),
  (p_org_id, 'Hired', 'تم التوظيف', '#22C55E', 97, true, true),
  (p_org_id, 'Disqualified', 'مستبعد', '#EF4444', 98, true, true)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to copy default application form to a new job
CREATE OR REPLACE FUNCTION copy_application_form_to_job(p_job_id UUID, p_org_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Copy enabled sections
  INSERT INTO job_application_sections (job_id, section_id, is_enabled, sort_order)
  SELECT p_job_id, id, is_enabled, sort_order
  FROM application_form_sections
  WHERE org_id = p_org_id AND is_enabled = true;

  -- Copy enabled fields
  INSERT INTO job_application_fields (job_id, field_id, is_enabled, is_required)
  SELECT p_job_id, f.id, f.is_enabled, f.is_required
  FROM application_form_fields f
  JOIN application_form_sections s ON f.section_id = s.id
  WHERE s.org_id = p_org_id AND f.is_enabled = true;
END;
$$ LANGUAGE plpgsql;

-- Function to copy default hiring stages to a new job
CREATE OR REPLACE FUNCTION copy_hiring_stages_to_job(p_job_id UUID, p_org_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO job_hiring_stages (job_id, stage_id, is_enabled, sort_order)
  SELECT p_job_id, id, true, sort_order
  FROM hiring_stages
  WHERE org_id = p_org_id;
END;
$$ LANGUAGE plpgsql;
