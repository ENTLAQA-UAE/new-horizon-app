-- Fix job auto-close: the original function checked status='published' (doesn't exist)
-- and only looked at closes_at (never populated). The form saves to closing_date.

-- 1. Fix the auto-deactivate function to use the correct status and column
CREATE OR REPLACE FUNCTION auto_deactivate_expired_jobs()
RETURNS INTEGER AS $$
DECLARE
  deactivated_count INTEGER;
BEGIN
  -- Join with organizations to get each org's timezone.
  -- closing_date is compared against the current date in the ORG's local time,
  -- so a Dubai org (GMT+4) closes jobs at Dubai midnight, not UTC midnight.
  UPDATE jobs j
  SET
    status = 'closed',
    deactivated_at = NOW(),
    auto_deactivated = true,
    updated_at = NOW()
  FROM organizations o
  WHERE
    j.org_id = o.id
    AND j.status = 'open'
    AND (j.auto_deactivated IS NULL OR j.auto_deactivated = false)
    AND j.closing_date IS NOT NULL
    AND j.closing_date <= (NOW() AT TIME ZONE COALESCE(o.timezone, 'Asia/Dubai'))::date;

  GET DIAGNOSTICS deactivated_count = ROW_COUNT;
  RETURN deactivated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auto_deactivate_expired_jobs() IS
  'Auto-closes open jobs whose closing_date has been reached in the organization timezone. Called daily via pg_cron.';


-- 2. Fix the status-change trigger to reference 'open' instead of 'published'
CREATE OR REPLACE FUNCTION validate_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- When a job becomes open (draft -> open), set published_at
  IF OLD.status = 'draft' AND NEW.status = 'open' THEN
    NEW.published_at := NOW();
  END IF;

  -- When closing, set deactivated_at if not already set
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    IF NEW.deactivated_at IS NULL THEN
      NEW.deactivated_at := NOW();
    END IF;
  END IF;

  -- When reopening a closed job, clear deactivated fields
  IF OLD.status = 'closed' AND NEW.status IN ('draft', 'open') THEN
    NEW.deactivated_at := NULL;
    NEW.auto_deactivated := false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 3. Fix the public_jobs view to use 'open' instead of 'published'
CREATE OR REPLACE VIEW public_jobs AS
SELECT
  j.id,
  j.title,
  j.title_ar,
  j.description,
  j.description_ar,
  j.is_remote,
  j.salary_min,
  j.salary_max,
  j.salary_currency,
  j.published_at,
  j.closing_date,
  j.thumbnail_url,
  j.org_id,
  j.department_id,
  j.location_id,
  j.job_type,
  j.experience_level,
  j.positions_count,
  j.slug,
  CASE
    WHEN j.closing_date IS NOT NULL THEN (j.closing_date - CURRENT_DATE)
    ELSE NULL
  END AS days_until_close
FROM jobs j
WHERE j.status = 'open';


-- 4. To schedule daily auto-close, enable the pg_cron extension in Supabase Dashboard
--    (Database → Extensions → pg_cron), then run:
--
--    SELECT cron.schedule(
--      'auto-close-expired-jobs',
--      '0 * * * *',
--      $$SELECT auto_deactivate_expired_jobs()$$
--    );
--
--    Or call the function via the existing edge function (supabase/functions/auto-deactivate-jobs).
