-- Add is_system column to pipeline_stages for mandatory stages
ALTER TABLE public.pipeline_stages
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN public.pipeline_stages.is_system IS 'System stages (Applied, Hired, Rejected) cannot be deleted or modified';
