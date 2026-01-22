-- =====================================================
-- APPLICATION FORM SYSTEM TABLES
-- These tables support job-specific application form customization
-- =====================================================

-- Application form sections (e.g., Basic Information, Contact Details, Education)
CREATE TABLE IF NOT EXISTS public.application_form_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  description TEXT,
  icon VARCHAR(50) DEFAULT 'user',
  is_default BOOLEAN DEFAULT false,
  is_enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Application form fields (questions within sections)
CREATE TABLE IF NOT EXISTS public.application_form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES public.application_form_sections(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  field_type VARCHAR(50) NOT NULL DEFAULT 'text',
  placeholder VARCHAR(255),
  placeholder_ar VARCHAR(255),
  options JSONB,
  validation JSONB,
  is_default BOOLEAN DEFAULT false,
  is_required BOOLEAN DEFAULT false,
  is_enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job-specific application form configuration
CREATE TABLE IF NOT EXISTS public.job_application_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  section_id UUID REFERENCES public.application_form_sections(id) ON DELETE CASCADE NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, section_id)
);

-- Job-specific field configuration
CREATE TABLE IF NOT EXISTS public.job_application_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  field_id UUID REFERENCES public.application_form_fields(id) ON DELETE CASCADE NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, field_id)
);

-- Job-specific hiring stages configuration
CREATE TABLE IF NOT EXISTS public.job_hiring_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  stage_id UUID REFERENCES public.hiring_stages(id) ON DELETE CASCADE NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, stage_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_app_sections_org ON public.application_form_sections(org_id);
CREATE INDEX IF NOT EXISTS idx_app_fields_section ON public.application_form_fields(section_id);
CREATE INDEX IF NOT EXISTS idx_app_fields_org ON public.application_form_fields(org_id);
CREATE INDEX IF NOT EXISTS idx_job_app_sections_job ON public.job_application_sections(job_id);
CREATE INDEX IF NOT EXISTS idx_job_app_fields_job ON public.job_application_fields(job_id);
CREATE INDEX IF NOT EXISTS idx_job_hiring_stages_job ON public.job_hiring_stages(job_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.application_form_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_application_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_application_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_hiring_stages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for application_form_sections
CREATE POLICY "Users can view their org's form sections"
  ON public.application_form_sections FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage their org's form sections"
  ON public.application_form_sections FOR ALL
  USING (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for application_form_fields
CREATE POLICY "Users can view their org's form fields"
  ON public.application_form_fields FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage their org's form fields"
  ON public.application_form_fields FOR ALL
  USING (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for job_application_sections
CREATE POLICY "Users can view job app sections in their org"
  ON public.job_application_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.profiles p ON p.org_id = j.org_id
      WHERE j.id = job_application_sections.job_id
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Users can manage job app sections in their org"
  ON public.job_application_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.profiles p ON p.org_id = j.org_id
      WHERE j.id = job_application_sections.job_id
      AND p.id = auth.uid()
    )
  );

-- RLS Policies for job_application_fields
CREATE POLICY "Users can view job app fields in their org"
  ON public.job_application_fields FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.profiles p ON p.org_id = j.org_id
      WHERE j.id = job_application_fields.job_id
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Users can manage job app fields in their org"
  ON public.job_application_fields FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.profiles p ON p.org_id = j.org_id
      WHERE j.id = job_application_fields.job_id
      AND p.id = auth.uid()
    )
  );

-- RLS Policies for job_hiring_stages
CREATE POLICY "Users can view job hiring stages in their org"
  ON public.job_hiring_stages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.profiles p ON p.org_id = j.org_id
      WHERE j.id = job_hiring_stages.job_id
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Users can manage job hiring stages in their org"
  ON public.job_hiring_stages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.profiles p ON p.org_id = j.org_id
      WHERE j.id = job_hiring_stages.job_id
      AND p.id = auth.uid()
    )
  );
