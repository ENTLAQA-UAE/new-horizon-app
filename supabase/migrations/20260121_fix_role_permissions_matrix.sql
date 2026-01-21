-- =====================================================================
-- FIX ROLE PERMISSIONS MATRIX
-- =====================================================================
--
-- CORRECTED ROLE RESPONSIBILITIES:
--
-- org_admin: Organization administration (NOT hiring operations)
--   - Settings, Analytics, Integrations, Branding, Team members
--   - Career page, Notification management
--   - READ access to ATS data (for analytics/oversight)
--   - NO write access to jobs, candidates, applications
--
-- hr_manager: HR operations lead
--   - Full access to ATS (jobs, candidates, applications, interviews)
--   - Full access to scorecards and offer templates
--   - READ access to settings
--
-- recruiter: Day-to-day hiring operations
--   - Full access to ATS (jobs, candidates, applications, interviews)
--   - READ access to scorecards
--   - READ access to settings
--
-- =====================================================================

-- =====================================================================
-- 1. FIX JOBS POLICIES - Remove org_admin from write access
-- =====================================================================
DROP POLICY IF EXISTS "Recruiters and above can manage jobs" ON public.jobs;

CREATE POLICY "HR and recruiters can manage jobs"
  ON public.jobs FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'hr_manager') OR
      public.has_role(auth.uid(), 'recruiter')
    ))
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'hr_manager') OR
      public.has_role(auth.uid(), 'recruiter')
    ))
    OR public.is_super_admin(auth.uid())
  );

-- =====================================================================
-- 2. FIX CANDIDATES POLICIES - Remove org_admin from write access
-- =====================================================================
DROP POLICY IF EXISTS "Recruiters and above can manage candidates" ON public.candidates;

CREATE POLICY "HR and recruiters can manage candidates"
  ON public.candidates FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'hr_manager') OR
      public.has_role(auth.uid(), 'recruiter')
    ))
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'hr_manager') OR
      public.has_role(auth.uid(), 'recruiter')
    ))
    OR public.is_super_admin(auth.uid())
  );

-- =====================================================================
-- 3. FIX APPLICATIONS POLICIES - Remove org_admin from write access
-- =====================================================================
DROP POLICY IF EXISTS "Recruiters and above can manage applications" ON public.applications;

CREATE POLICY "HR and recruiters can manage applications"
  ON public.applications FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'hr_manager') OR
      public.has_role(auth.uid(), 'recruiter')
    ))
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'hr_manager') OR
      public.has_role(auth.uid(), 'recruiter')
    ))
    OR public.is_super_admin(auth.uid())
  );

-- =====================================================================
-- 4. FIX INTERVIEWS POLICIES - Remove org_admin from write access
-- =====================================================================
DROP POLICY IF EXISTS "Recruiters and above can manage interviews" ON public.interviews;

CREATE POLICY "HR and recruiters can manage interviews"
  ON public.interviews FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'hr_manager') OR
      public.has_role(auth.uid(), 'recruiter')
    ))
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'hr_manager') OR
      public.has_role(auth.uid(), 'recruiter')
    ))
    OR public.is_super_admin(auth.uid())
  );

-- =====================================================================
-- 5. FIX SCORECARD TEMPLATES POLICIES - Remove org_admin from write access
-- =====================================================================
DROP POLICY IF EXISTS "HR and above can manage scorecard templates" ON public.scorecard_templates;
DROP POLICY IF EXISTS "HR can create scorecard templates" ON public.scorecard_templates;
DROP POLICY IF EXISTS "HR can update scorecard templates" ON public.scorecard_templates;
DROP POLICY IF EXISTS "HR can delete scorecard templates" ON public.scorecard_templates;

CREATE POLICY "HR can manage scorecard templates"
  ON public.scorecard_templates FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'hr_manager'))
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'hr_manager'))
    OR public.is_super_admin(auth.uid())
  );

-- =====================================================================
-- 6. FIX INTERVIEW SCORECARDS POLICIES - Remove org_admin, keep interviewer self-access
-- =====================================================================
DROP POLICY IF EXISTS "Interviewers can manage their own scorecards" ON public.interview_scorecards;

CREATE POLICY "Interviewers can manage their own scorecards"
  ON public.interview_scorecards FOR ALL
  TO authenticated
  USING (
    -- Interviewers can manage their own scorecards
    (interviewer_id = auth.uid() AND org_id = public.get_user_org_id(auth.uid()))
    -- HR managers have full access
    OR (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'hr_manager'))
    -- Super admins have full access
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (interviewer_id = auth.uid() AND org_id = public.get_user_org_id(auth.uid()))
    OR (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'hr_manager'))
    OR public.is_super_admin(auth.uid())
  );

-- =====================================================================
-- 7. FIX OFFER TEMPLATES POLICIES - Remove org_admin from write access
-- =====================================================================
DROP POLICY IF EXISTS "HR and above can manage offer templates" ON public.offer_templates;

CREATE POLICY "HR can manage offer templates"
  ON public.offer_templates FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'hr_manager'))
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'hr_manager'))
    OR public.is_super_admin(auth.uid())
  );

-- =====================================================================
-- 8. FIX OFFERS POLICIES - Remove org_admin from write access
-- =====================================================================
DROP POLICY IF EXISTS "Recruiters and above can manage offers" ON public.offers;

CREATE POLICY "HR and recruiters can manage offers"
  ON public.offers FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'hr_manager') OR
      public.has_role(auth.uid(), 'recruiter')
    ))
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND (
      public.has_role(auth.uid(), 'hr_manager') OR
      public.has_role(auth.uid(), 'recruiter')
    ))
    OR public.is_super_admin(auth.uid())
  );

-- =====================================================================
-- 9. FIX OFFER APPROVALS POLICIES - Remove org_admin from write access
-- =====================================================================
DROP POLICY IF EXISTS "HR and above can manage offer approvals" ON public.offer_approvals;

CREATE POLICY "HR can manage offer approvals"
  ON public.offer_approvals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.offers o
      WHERE o.id = offer_id
      AND o.org_id = public.get_user_org_id(auth.uid())
      AND public.has_role(auth.uid(), 'hr_manager')
    )
    OR public.is_super_admin(auth.uid())
  );

-- =====================================================================
-- 10. ENSURE org_admin HAS FULL ACCESS TO SETTINGS TABLES
-- These should already be correct, but let's verify/recreate
-- =====================================================================

-- DEPARTMENTS - org_admin should have full access
DROP POLICY IF EXISTS "Org admins can manage departments" ON public.departments;
CREATE POLICY "Org admins can manage departments"
  ON public.departments FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  );

-- JOB_LOCATIONS - org_admin should have full access
DROP POLICY IF EXISTS "Org admins can manage locations" ON public.job_locations;
CREATE POLICY "Org admins can manage locations"
  ON public.job_locations FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  );

-- PIPELINE_STAGES - org_admin should have full access
DROP POLICY IF EXISTS "Org admins can manage stages" ON public.pipeline_stages;
CREATE POLICY "Org admins can manage stages"
  ON public.pipeline_stages FOR ALL
  TO authenticated
  USING (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'org_admin'))
    OR public.is_super_admin(auth.uid())
  );

-- =====================================================================
-- CORRECTED ROLE ACCESS MATRIX:
-- =====================================================================
--
-- | Role            | ATS Core | Scorecards | Settings | Analytics |
-- |-----------------|----------|------------|----------|-----------|
-- | super_admin     | ALL      | ALL        | ALL      | ALL       |
-- | org_admin       | READ     | READ       | ALL      | ALL       |
-- | hr_manager      | ALL      | ALL        | READ     | READ      |
-- | recruiter       | ALL      | READ       | READ     | READ      |
-- | hiring_manager  | READ     | READ       | NO       | NO        |
-- | interviewer     | READ     | OWN        | NO       | NO        |
-- | employee        | SELF     | SELF       | NO       | NO        |
--
-- ATS Core = jobs, candidates, applications, interviews, offers
-- Scorecards = scorecard_templates, interview_scorecards, offer_templates
-- Settings = departments, locations, pipeline_stages, integrations, branding
-- Analytics = dashboards, reports
-- =====================================================================
