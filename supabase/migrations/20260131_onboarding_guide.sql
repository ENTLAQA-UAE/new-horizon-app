-- Onboarding Guide Progress Tracking
-- Tracks per-user, per-role onboarding checklist progress

CREATE TABLE IF NOT EXISTS public.onboarding_guide_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  step_key TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Each user can only have one record per step per role
  CONSTRAINT onboarding_guide_progress_unique UNIQUE (user_id, org_id, role, step_key)
);

-- Separate table for dismissal state (one row per user per org)
CREATE TABLE IF NOT EXISTS public.onboarding_guide_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT onboarding_guide_dismissals_unique UNIQUE (user_id, org_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_onboarding_guide_progress_user_org
  ON public.onboarding_guide_progress (user_id, org_id, role);

CREATE INDEX IF NOT EXISTS idx_onboarding_guide_dismissals_user_org
  ON public.onboarding_guide_dismissals (user_id, org_id);

-- RLS Policies
ALTER TABLE public.onboarding_guide_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_guide_dismissals ENABLE ROW LEVEL SECURITY;

-- Users can read their own progress
CREATE POLICY "Users can read own onboarding progress"
  ON public.onboarding_guide_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert own onboarding progress"
  ON public.onboarding_guide_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update own onboarding progress"
  ON public.onboarding_guide_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can read their own dismissal state
CREATE POLICY "Users can read own onboarding dismissal"
  ON public.onboarding_guide_dismissals
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own dismissal
CREATE POLICY "Users can insert own onboarding dismissal"
  ON public.onboarding_guide_dismissals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own dismissal
CREATE POLICY "Users can update own onboarding dismissal"
  ON public.onboarding_guide_dismissals
  FOR UPDATE
  USING (auth.uid() = user_id);
