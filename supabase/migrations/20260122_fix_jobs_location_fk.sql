-- Fix jobs.location_id FK to reference locations table (vacancy settings) instead of job_locations
-- This allows HR to manage locations in one place and use them when creating jobs

-- Drop the existing FK constraint (may have different names from different migrations)
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_location_id_fkey;
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_location_fkey;

-- Add new FK constraint referencing locations table (vacancy settings)
ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_location_id_fkey
  FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;

-- Add index if not exists
CREATE INDEX IF NOT EXISTS idx_jobs_location_id ON public.jobs(location_id);
