-- Landing Page Blocks table for super admin customizable landing page
CREATE TABLE IF NOT EXISTS public.landing_page_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  block_type TEXT NOT NULL,
  block_order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  content JSONB NOT NULL DEFAULT '{}',
  styles JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for ordered fetching
CREATE INDEX IF NOT EXISTS idx_landing_page_blocks_order ON public.landing_page_blocks (block_order);

-- RLS Policies
ALTER TABLE public.landing_page_blocks ENABLE ROW LEVEL SECURITY;

-- Anyone can read landing page blocks (public page)
CREATE POLICY "Anyone can read landing page blocks"
  ON public.landing_page_blocks FOR SELECT
  TO public
  USING (true);

-- Only super admins can manage landing page blocks
CREATE POLICY "Super admins can insert landing page blocks"
  ON public.landing_page_blocks FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update landing page blocks"
  ON public.landing_page_blocks FOR UPDATE
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete landing page blocks"
  ON public.landing_page_blocks FOR DELETE
  TO authenticated
  USING (public.is_super_admin(auth.uid()));
