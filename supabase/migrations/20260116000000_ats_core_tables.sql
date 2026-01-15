-- =============================================
-- JADARAT ATS - Core ATS Tables
-- Phase 2: Jobs, Candidates, Applications
-- =============================================

-- 1. Create enums for job and application statuses
CREATE TYPE public.job_status AS ENUM (
  'draft',
  'open',
  'paused',
  'closed',
  'filled'
);

CREATE TYPE public.job_type AS ENUM (
  'full_time',
  'part_time',
  'contract',
  'temporary',
  'internship',
  'freelance'
);

CREATE TYPE public.experience_level AS ENUM (
  'entry',
  'junior',
  'mid',
  'senior',
  'lead',
  'executive'
);

CREATE TYPE public.application_status AS ENUM (
  'new',
  'screening',
  'interview',
  'assessment',
  'offer',
  'hired',
  'rejected',
  'withdrawn'
);

CREATE TYPE public.candidate_source AS ENUM (
  'career_page',
  'linkedin',
  'indeed',
  'referral',
  'agency',
  'direct',
  'other'
);

-- 2. Create departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100),
  description TEXT,
  parent_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  head_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_departments_org ON public.departments(org_id);

-- 3. Create job_locations table
CREATE TABLE public.job_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  name_ar VARCHAR(150),
  city VARCHAR(100),
  country VARCHAR(100) NOT NULL,
  country_code VARCHAR(3),
  is_remote BOOLEAN DEFAULT false,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_locations_org ON public.job_locations(org_id);

-- 4. Create pipeline_stages table (customizable per org)
CREATE TABLE public.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100),
  description TEXT,
  color VARCHAR(7) DEFAULT '#6B7280',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  auto_reject_after_days INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, sort_order)
);

CREATE INDEX idx_pipeline_stages_org ON public.pipeline_stages(org_id);

-- 5. Create jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.job_locations(id) ON DELETE SET NULL,

  -- Basic Info
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  description_ar TEXT,
  requirements TEXT,
  requirements_ar TEXT,
  responsibilities TEXT,
  responsibilities_ar TEXT,
  benefits TEXT,
  benefits_ar TEXT,

  -- Job Details
  job_type public.job_type NOT NULL DEFAULT 'full_time',
  experience_level public.experience_level NOT NULL DEFAULT 'mid',
  status public.job_status NOT NULL DEFAULT 'draft',
  is_remote BOOLEAN DEFAULT false,

  -- Compensation
  salary_min DECIMAL(12,2),
  salary_max DECIMAL(12,2),
  salary_currency VARCHAR(3) DEFAULT 'SAR',
  show_salary BOOLEAN DEFAULT false,

  -- Requirements
  education_requirement VARCHAR(255),
  years_experience_min INTEGER,
  years_experience_max INTEGER,
  skills JSONB DEFAULT '[]',
  languages JSONB DEFAULT '[]',

  -- Dates
  published_at TIMESTAMPTZ,
  closing_date DATE,

  -- Settings
  positions_count INTEGER DEFAULT 1,
  is_featured BOOLEAN DEFAULT false,
  allow_internal_applications BOOLEAN DEFAULT true,
  require_cover_letter BOOLEAN DEFAULT false,
  custom_questions JSONB DEFAULT '[]',

  -- Tracking
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  hiring_manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- MENA Compliance
  nationality_preference JSONB DEFAULT '[]',
  saudization_applicable BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(org_id, slug)
);

CREATE INDEX idx_jobs_org ON public.jobs(org_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_department ON public.jobs(department_id);
CREATE INDEX idx_jobs_location ON public.jobs(location_id);
CREATE INDEX idx_jobs_slug ON public.jobs(org_id, slug);

-- 6. Create candidates table (talent pool)
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Personal Info
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  phone_secondary VARCHAR(30),

  -- Profile
  headline VARCHAR(255),
  summary TEXT,
  avatar_url TEXT,

  -- Location
  city VARCHAR(100),
  country VARCHAR(100),
  nationality VARCHAR(100),

  -- Professional
  current_company VARCHAR(255),
  current_title VARCHAR(255),
  years_of_experience INTEGER,
  expected_salary DECIMAL(12,2),
  salary_currency VARCHAR(3) DEFAULT 'SAR',
  notice_period_days INTEGER,

  -- Skills & Education
  skills JSONB DEFAULT '[]',
  languages JSONB DEFAULT '[]',
  education JSONB DEFAULT '[]',
  experience JSONB DEFAULT '[]',
  certifications JSONB DEFAULT '[]',

  -- Documents
  resume_url TEXT,
  resume_parsed_data JSONB,
  linkedin_url VARCHAR(500),
  portfolio_url VARCHAR(500),

  -- Source & Tracking
  source public.candidate_source DEFAULT 'direct',
  source_details VARCHAR(255),
  referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tags JSONB DEFAULT '[]',

  -- AI Scoring
  ai_overall_score DECIMAL(5,2),
  ai_score_breakdown JSONB,
  ai_parsed_at TIMESTAMPTZ,

  -- Status
  is_blacklisted BOOLEAN DEFAULT false,
  blacklist_reason TEXT,
  consent_given BOOLEAN DEFAULT false,
  consent_date TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(org_id, email)
);

CREATE INDEX idx_candidates_org ON public.candidates(org_id);
CREATE INDEX idx_candidates_email ON public.candidates(email);
CREATE INDEX idx_candidates_skills ON public.candidates USING GIN(skills);

-- 7. Create applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,

  -- Application Status
  status public.application_status NOT NULL DEFAULT 'new',
  stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,

  -- Content
  cover_letter TEXT,
  custom_answers JSONB DEFAULT '{}',

  -- Scoring
  ai_match_score DECIMAL(5,2),
  ai_score_details JSONB,
  manual_score DECIMAL(5,2),
  scored_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Source
  source public.candidate_source DEFAULT 'career_page',
  source_details VARCHAR(255),

  -- Tracking
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  moved_to_stage_at TIMESTAMPTZ,

  -- Outcome
  rejection_reason TEXT,
  rejection_template_id UUID,
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  hired_at TIMESTAMPTZ,
  hire_salary DECIMAL(12,2),
  start_date DATE,

  -- Assignment
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(job_id, candidate_id)
);

CREATE INDEX idx_applications_org ON public.applications(org_id);
CREATE INDEX idx_applications_job ON public.applications(job_id);
CREATE INDEX idx_applications_candidate ON public.applications(candidate_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_stage ON public.applications(stage_id);

-- 8. Create interviews table
CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,

  -- Interview Details
  title VARCHAR(255) NOT NULL,
  interview_type VARCHAR(50) NOT NULL DEFAULT 'video', -- video, phone, in_person, assessment
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  timezone VARCHAR(50) DEFAULT 'Asia/Riyadh',

  -- Location/Link
  location VARCHAR(255),
  meeting_link VARCHAR(500),
  meeting_password VARCHAR(100),

  -- Participants
  interviewer_ids JSONB DEFAULT '[]',
  organizer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, confirmed, completed, cancelled, no_show
  candidate_confirmed BOOLEAN DEFAULT false,
  candidate_confirmed_at TIMESTAMPTZ,

  -- Feedback
  overall_rating DECIMAL(3,1),
  feedback JSONB DEFAULT '[]',
  recommendation VARCHAR(50), -- strong_hire, hire, no_hire, strong_no_hire

  -- Notes
  internal_notes TEXT,
  candidate_notes TEXT,

  -- Reminders
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMPTZ,

  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interviews_org ON public.interviews(org_id);
CREATE INDEX idx_interviews_application ON public.interviews(application_id);
CREATE INDEX idx_interviews_scheduled ON public.interviews(scheduled_at);

-- 9. Create application_notes table
CREATE TABLE public.application_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_application_notes_app ON public.application_notes(application_id);

-- 10. Create application_activities table (audit log)
CREATE TABLE public.application_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_application_activities_app ON public.application_activities(application_id);
CREATE INDEX idx_application_activities_created ON public.application_activities(created_at);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_activities ENABLE ROW LEVEL SECURITY;

-- DEPARTMENTS POLICIES
CREATE POLICY "Users can view departments in their org"
  ON public.departments FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Org admins can manage departments"
  ON public.departments FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  );

-- JOB_LOCATIONS POLICIES
CREATE POLICY "Users can view locations in their org"
  ON public.job_locations FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Org admins can manage locations"
  ON public.job_locations FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  );

-- PIPELINE_STAGES POLICIES
CREATE POLICY "Users can view stages in their org"
  ON public.pipeline_stages FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Org admins can manage stages"
  ON public.pipeline_stages FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  );

-- JOBS POLICIES
CREATE POLICY "Users can view jobs in their org"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Public can view open jobs"
  ON public.jobs FOR SELECT
  TO anon
  USING (status = 'open');

CREATE POLICY "Recruiters and above can manage jobs"
  ON public.jobs FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'org_admin') OR
      public.has_role(auth.uid(), 'hr_manager') OR
      public.has_role(auth.uid(), 'recruiter')
    ))
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'org_admin') OR
      public.has_role(auth.uid(), 'hr_manager') OR
      public.has_role(auth.uid(), 'recruiter')
    ))
    OR public.is_super_admin(auth.uid())
  );

-- CANDIDATES POLICIES
CREATE POLICY "Users can view candidates in their org"
  ON public.candidates FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Recruiters and above can manage candidates"
  ON public.candidates FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'org_admin') OR
      public.has_role(auth.uid(), 'hr_manager') OR
      public.has_role(auth.uid(), 'recruiter')
    ))
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'org_admin') OR
      public.has_role(auth.uid(), 'hr_manager') OR
      public.has_role(auth.uid(), 'recruiter')
    ))
    OR public.is_super_admin(auth.uid())
  );

-- APPLICATIONS POLICIES
CREATE POLICY "Users can view applications in their org"
  ON public.applications FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Recruiters and above can manage applications"
  ON public.applications FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'org_admin') OR
      public.has_role(auth.uid(), 'hr_manager') OR
      public.has_role(auth.uid(), 'recruiter')
    ))
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'org_admin') OR
      public.has_role(auth.uid(), 'hr_manager') OR
      public.has_role(auth.uid(), 'recruiter')
    ))
    OR public.is_super_admin(auth.uid())
  );

-- INTERVIEWS POLICIES
CREATE POLICY "Users can view interviews in their org"
  ON public.interviews FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Recruiters and above can manage interviews"
  ON public.interviews FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'org_admin') OR
      public.has_role(auth.uid(), 'hr_manager') OR
      public.has_role(auth.uid(), 'recruiter')
    ))
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'org_admin') OR
      public.has_role(auth.uid(), 'hr_manager') OR
      public.has_role(auth.uid(), 'recruiter')
    ))
    OR public.is_super_admin(auth.uid())
  );

-- APPLICATION_NOTES POLICIES
CREATE POLICY "Users can view notes on applications in their org"
  ON public.application_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id
      AND (a.org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()))
    )
    AND (NOT is_private OR user_id = auth.uid())
  );

CREATE POLICY "Users can create notes"
  ON public.application_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id
      AND a.org_id = public.get_user_org_id(auth.uid())
    )
  );

CREATE POLICY "Users can update their own notes"
  ON public.application_notes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- APPLICATION_ACTIVITIES POLICIES
CREATE POLICY "Users can view activities in their org"
  ON public.application_activities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id
      AND (a.org_id = public.get_user_org_id(auth.uid()) OR public.is_super_admin(auth.uid()))
    )
  );

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_locations_updated_at
  BEFORE UPDATE ON public.job_locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pipeline_stages_updated_at
  BEFORE UPDATE ON public.pipeline_stages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at
  BEFORE UPDATE ON public.interviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_application_notes_updated_at
  BEFORE UPDATE ON public.application_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to auto-increment application count on jobs
CREATE OR REPLACE FUNCTION public.increment_job_applications()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.jobs
  SET applications_count = applications_count + 1
  WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER increment_applications_on_insert
  AFTER INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.increment_job_applications();

-- Function to log application activities
CREATE OR REPLACE FUNCTION public.log_application_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.application_activities (application_id, user_id, activity_type, description, metadata)
    VALUES (
      NEW.id,
      auth.uid(),
      'status_changed',
      'Status changed from ' || OLD.status || ' to ' || NEW.status,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN
    INSERT INTO public.application_activities (application_id, user_id, activity_type, description, metadata)
    VALUES (
      NEW.id,
      auth.uid(),
      'stage_changed',
      'Moved to new pipeline stage',
      jsonb_build_object('old_stage_id', OLD.stage_id, 'new_stage_id', NEW.stage_id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER log_application_changes
  AFTER UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.log_application_activity();
