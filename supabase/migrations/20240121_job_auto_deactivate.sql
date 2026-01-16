-- Function to auto-deactivate jobs that have passed their closing date
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
    status = 'published'
    AND closes_at IS NOT NULL
    AND closes_at < NOW()
    AND (auto_deactivated IS NULL OR auto_deactivated = false);

  GET DIAGNOSTICS deactivated_count = ROW_COUNT;

  RETURN deactivated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create an RPC endpoint that can be called from edge functions or cron
-- This allows the function to be called via Supabase client
GRANT EXECUTE ON FUNCTION auto_deactivate_expired_jobs() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_deactivate_expired_jobs() TO service_role;

-- Function to check if a job can be published (has required settings)
CREATE OR REPLACE FUNCTION can_publish_job(p_job_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_sections BOOLEAN;
  has_stages BOOLEAN;
BEGIN
  -- Check if job has at least one application section enabled
  SELECT EXISTS(
    SELECT 1 FROM job_application_sections
    WHERE job_id = p_job_id AND is_enabled = true
  ) INTO has_sections;

  -- Check if job has at least one hiring stage enabled
  SELECT EXISTS(
    SELECT 1 FROM job_hiring_stages
    WHERE job_id = p_job_id AND is_enabled = true
  ) INTO has_stages;

  -- If no custom sections/stages set, allow publish (will use org defaults)
  IF NOT has_sections THEN
    SELECT EXISTS(
      SELECT 1 FROM application_form_sections afs
      JOIN jobs j ON j.org_id = afs.org_id
      WHERE j.id = p_job_id AND afs.is_enabled = true
    ) INTO has_sections;
  END IF;

  IF NOT has_stages THEN
    SELECT EXISTS(
      SELECT 1 FROM hiring_stages hs
      JOIN jobs j ON j.org_id = hs.org_id
      WHERE j.id = p_job_id
    ) INTO has_stages;
  END IF;

  RETURN has_sections AND has_stages;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION can_publish_job(UUID) TO authenticated;

-- Add trigger to validate job status transitions
CREATE OR REPLACE FUNCTION validate_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check when publishing (draft -> published)
  IF OLD.status = 'draft' AND NEW.status = 'published' THEN
    -- Set published_at timestamp
    NEW.published_at := NOW();
  END IF;

  -- When closing, set deactivated_at if not already set
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    IF NEW.deactivated_at IS NULL THEN
      NEW.deactivated_at := NOW();
    END IF;
  END IF;

  -- When reopening a closed job, clear deactivated fields
  IF OLD.status = 'closed' AND NEW.status IN ('draft', 'published') THEN
    NEW.deactivated_at := NULL;
    NEW.auto_deactivated := false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS job_status_change_trigger ON jobs;
CREATE TRIGGER job_status_change_trigger
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION validate_job_status_change();

-- Create a view for published jobs with deadline info
CREATE OR REPLACE VIEW public_jobs AS
SELECT
  j.id,
  j.title,
  j.title_ar,
  j.description,
  j.description_ar,
  j.location,
  j.location_ar,
  j.is_remote,
  j.salary_min,
  j.salary_max,
  j.salary_currency,
  j.published_at,
  j.closes_at,
  j.thumbnail_url,
  j.org_id,
  o.name as organization_name,
  o.logo_url as organization_logo,
  d.name as department_name,
  d.name_ar as department_name_ar,
  jt.name as job_type_name,
  jt.name_ar as job_type_name_ar,
  jg.name as job_grade_name,
  jg.name_ar as job_grade_name_ar,
  l.name as location_name,
  l.name_ar as location_name_ar,
  l.city,
  l.country,
  CASE
    WHEN j.closes_at IS NULL THEN NULL
    WHEN j.closes_at > NOW() THEN EXTRACT(DAY FROM (j.closes_at - NOW()))::INTEGER
    ELSE 0
  END as days_until_close
FROM jobs j
LEFT JOIN organizations o ON j.org_id = o.id
LEFT JOIN departments d ON j.department_id = d.id
LEFT JOIN job_types jt ON j.job_type_id = jt.id
LEFT JOIN job_grades jg ON j.job_grade_id = jg.id
LEFT JOIN locations l ON j.location_id = l.id
WHERE j.status = 'published';

-- Grant access to the view
GRANT SELECT ON public_jobs TO anon;
GRANT SELECT ON public_jobs TO authenticated;

-- Add comment
COMMENT ON FUNCTION auto_deactivate_expired_jobs() IS 'Auto-deactivates jobs that have passed their closing date. Should be called periodically via cron or edge function.';
