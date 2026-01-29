-- Add department_id to team_invites so department managers can be assigned
-- a department at invite time (instead of requiring a separate edit after signup)
ALTER TABLE public.team_invites
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id);
