-- =============================================
-- TEAM INVITES SYSTEM
-- For inviting team members to organizations
-- =============================================

-- Team Invites Table
CREATE TABLE IF NOT EXISTS public.team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Invite details
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'recruiter',
  -- Roles: org_admin, hr_manager, recruiter, hiring_manager, interviewer

  -- Invite code for joining
  invite_code VARCHAR(20) NOT NULL UNIQUE,

  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending',
  -- pending, accepted, expired, cancelled

  -- Metadata
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cancelled_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate pending invites for same email in same org
  UNIQUE(org_id, email, status)
);

CREATE INDEX IF NOT EXISTS idx_team_invites_org ON public.team_invites(org_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_email ON public.team_invites(email);
CREATE INDEX IF NOT EXISTS idx_team_invites_code ON public.team_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_team_invites_status ON public.team_invites(status);

-- Enable RLS
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view invites in their org" ON public.team_invites;
DROP POLICY IF EXISTS "Admins can manage invites" ON public.team_invites;
DROP POLICY IF EXISTS "Users can view their own invites" ON public.team_invites;

-- RLS Policies
CREATE POLICY "Users can view invites in their org"
  ON public.team_invites FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_user_org_id(auth.uid())
    OR public.is_super_admin(auth.uid())
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage invites"
  ON public.team_invites FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'org_admin') OR
      public.has_role(auth.uid(), 'hr_manager')
    ))
    OR public.is_super_admin(auth.uid())
  );

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_team_invites_updated_at ON public.team_invites;
CREATE TRIGGER update_team_invites_updated_at
  BEFORE UPDATE ON public.team_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS VARCHAR AS $$
DECLARE
  chars VARCHAR := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result VARCHAR := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create invite with auto-generated code
CREATE OR REPLACE FUNCTION public.create_team_invite(
  p_org_id UUID,
  p_email VARCHAR,
  p_role VARCHAR DEFAULT 'recruiter',
  p_invited_by UUID DEFAULT NULL
)
RETURNS public.team_invites AS $$
DECLARE
  v_invite public.team_invites;
  v_code VARCHAR;
  v_attempts INTEGER := 0;
BEGIN
  -- Generate unique code
  LOOP
    v_code := public.generate_invite_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.team_invites WHERE invite_code = v_code);
    v_attempts := v_attempts + 1;
    IF v_attempts > 10 THEN
      RAISE EXCEPTION 'Could not generate unique invite code';
    END IF;
  END LOOP;

  -- Cancel any existing pending invites for this email in this org
  UPDATE public.team_invites
  SET status = 'cancelled', cancelled_at = NOW()
  WHERE org_id = p_org_id
    AND email = LOWER(p_email)
    AND status = 'pending';

  -- Create new invite
  INSERT INTO public.team_invites (org_id, email, role, invite_code, invited_by)
  VALUES (p_org_id, LOWER(p_email), p_role, v_code, p_invited_by)
  RETURNING * INTO v_invite;

  RETURN v_invite;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to accept invite
CREATE OR REPLACE FUNCTION public.accept_team_invite(
  p_invite_code VARCHAR,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_invite public.team_invites;
  v_user_email VARCHAR;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;

  -- Find the invite
  SELECT * INTO v_invite
  FROM public.team_invites
  WHERE invite_code = UPPER(p_invite_code)
    AND status = 'pending'
    AND (expires_at IS NULL OR expires_at > NOW());

  IF v_invite IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check email matches
  IF LOWER(v_invite.email) != LOWER(v_user_email) THEN
    RETURN FALSE;
  END IF;

  -- Update user profile with org_id
  UPDATE public.profiles
  SET org_id = v_invite.org_id
  WHERE id = p_user_id;

  -- Mark invite as accepted
  UPDATE public.team_invites
  SET status = 'accepted', accepted_at = NOW(), accepted_by = p_user_id
  WHERE id = v_invite.id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- Update organizations table to have owner_id if missing
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;
