-- Application attachments table for storing candidate documents (CV, certificates, etc.)
CREATE TABLE IF NOT EXISTS public.application_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- File info
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100), -- 'resume', 'cover_letter', 'certificate', 'portfolio', 'other'
  file_url TEXT NOT NULL,
  file_size INTEGER, -- in bytes
  mime_type VARCHAR(100),

  -- Metadata
  description TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_application_attachments_app ON public.application_attachments(application_id);

-- Enable RLS
ALTER TABLE public.application_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view attachments for applications in their org" ON public.application_attachments
  FOR SELECT USING (
    application_id IN (
      SELECT a.id FROM applications a
      WHERE a.org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage attachments for applications in their org" ON public.application_attachments
  FOR ALL USING (
    application_id IN (
      SELECT a.id FROM applications a
      WHERE a.org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Add comment
COMMENT ON TABLE public.application_attachments IS 'Stores attachments (CVs, certificates, etc.) for job applications';
