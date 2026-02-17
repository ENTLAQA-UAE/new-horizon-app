-- Create candidate_documents table for candidate-centric document management
-- Documents belong to candidates, not applications/jobs
CREATE TABLE IF NOT EXISTS public.candidate_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  file_name VARCHAR(500) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(255),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_candidate_documents_org_id ON public.candidate_documents(org_id);
CREATE INDEX IF NOT EXISTS idx_candidate_documents_candidate_id ON public.candidate_documents(candidate_id);

-- RLS
ALTER TABLE public.candidate_documents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view candidate documents in their org"
  ON public.candidate_documents FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert candidate documents in their org"
  ON public.candidate_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update candidate documents in their org"
  ON public.candidate_documents FOR UPDATE
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete candidate documents in their org"
  ON public.candidate_documents FOR DELETE
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.profiles WHERE id = auth.uid()
    )
  );
