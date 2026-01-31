-- Fix job auto-close: the original function checked status='published' (doesn't exist)
-- and only looked at closes_at (never populated). The form saves to closing_date.

-- 1. Fix the auto-deactivate function to use the correct status and column
CREATE OR REPLACE FUNCTION auto_deactivate_expired_jobs()
RETURNS INTEGER AS $$
DECLARE
  deactivated_count INTEGER;
BEGIN
  UPDATE jobs
  SET
    status = 'closed',
    deactivated_at = NOW(),
    auto_deactivated = true,
    updated_at = NOW()
  WHERE
    status = 'open'
    AND (auto_deactivated IS NULL OR auto_deactivated = false)
    AND (
      -- Check the DATE column used by the job form
      (closing_date IS NOT NULL AND closing_date < CURRENT_DATE)
      OR
      -- Also check the TIMESTAMPTZ column as a fallback
      (closes_at IS NOT NULL AND closes_at < NOW())
    );

  GET DIAGNOSTICS deactivated_count = ROW_COUNT;
  RETURN deactivated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auto_deactivate_expired_jobs() IS
  'Auto-closes open jobs whose application deadline (closing_date or closes_at) has passed. Called daily via pg_cron.';


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
  j.closes_at,
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
    WHEN j.closes_at IS NOT NULL THEN EXTRACT(DAY FROM (j.closes_at - NOW()))::INTEGER
    ELSE NULL
  END AS days_until_close
FROM jobs j
WHERE j.status = 'open';


-- 4. Schedule the auto-close to run every day at midnight UTC via pg_cron
-- pg_cron is enabled by default on Supabase
SELECT cron.schedule(
  'auto-close-expired-jobs',       -- unique job name
  '0 0 * * *',                     -- every day at 00:00 UTC
  $$SELECT auto_deactivate_expired_jobs()$$
);
