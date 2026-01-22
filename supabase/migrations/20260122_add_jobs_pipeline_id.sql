-- Add pipeline_id column to jobs table if it doesn't exist
-- This links jobs to their hiring pipeline

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_pipeline_id ON public.jobs(pipeline_id);
