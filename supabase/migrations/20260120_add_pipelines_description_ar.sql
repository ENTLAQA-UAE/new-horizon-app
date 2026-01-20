-- Add missing description_ar column to pipelines table
ALTER TABLE public.pipelines
ADD COLUMN IF NOT EXISTS description_ar TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.pipelines.description_ar IS 'Arabic description of the pipeline';
