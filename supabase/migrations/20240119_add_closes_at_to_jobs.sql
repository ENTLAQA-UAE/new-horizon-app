-- Add missing columns to jobs table
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS closes_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN jobs.closes_at IS 'Application deadline date';
COMMENT ON COLUMN jobs.published_at IS 'Date when the job was published';
