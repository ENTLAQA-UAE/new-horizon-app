-- Create job_recruiters table to assign recruiters to specific jobs
-- This table tracks which recruiters are assigned to manage each job posting

CREATE TABLE IF NOT EXISTS public.job_recruiters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(50) DEFAULT 'recruiter', -- recruiter, hiring_manager, interviewer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_job_recruiters_job ON public.job_recruiters(job_id);
CREATE INDEX IF NOT EXISTS idx_job_recruiters_user ON public.job_recruiters(user_id);

-- Enable RLS
ALTER TABLE public.job_recruiters ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view job recruiters in their org"
  ON public.job_recruiters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.profiles p ON p.org_id = j.org_id
      WHERE j.id = job_recruiters.job_id
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Org admins can manage job recruiters"
  ON public.job_recruiters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.profiles p ON p.org_id = j.org_id
      WHERE j.id = job_recruiters.job_id
      AND p.id = auth.uid()
    )
  );
