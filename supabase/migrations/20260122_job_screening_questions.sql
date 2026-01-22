-- Junction table to track which screening questions are enabled for each job
CREATE TABLE IF NOT EXISTS public.job_screening_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.screening_questions(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each question can only be added to a job once
  UNIQUE(job_id, question_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_screening_questions_job ON public.job_screening_questions(job_id);
CREATE INDEX IF NOT EXISTS idx_job_screening_questions_question ON public.job_screening_questions(question_id);

-- Enable RLS
ALTER TABLE public.job_screening_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view job screening questions for jobs in their org
CREATE POLICY "Users can view job screening questions in their org" ON public.job_screening_questions
  FOR SELECT USING (
    job_id IN (
      SELECT j.id FROM jobs j
      WHERE j.org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Users can manage job screening questions for jobs in their org
CREATE POLICY "Users can manage job screening questions in their org" ON public.job_screening_questions
  FOR ALL USING (
    job_id IN (
      SELECT j.id FROM jobs j
      WHERE j.org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Service role bypass for API operations
CREATE POLICY "Service role can manage all job screening questions" ON public.job_screening_questions
  FOR ALL USING (auth.role() = 'service_role');
