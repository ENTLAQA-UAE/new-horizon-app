-- Fix application form RLS policies
-- The policies were using 'organization_id' but profiles table uses 'org_id'

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their org's form sections" ON application_form_sections;
DROP POLICY IF EXISTS "Users can manage their org's form sections" ON application_form_sections;
DROP POLICY IF EXISTS "Users can view their org's form fields" ON application_form_fields;
DROP POLICY IF EXISTS "Users can manage their org's form fields" ON application_form_fields;

-- Recreate with correct column name (org_id)
CREATE POLICY "Users can view their org form sections"
  ON application_form_sections FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage their org form sections"
  ON application_form_sections FOR ALL
  TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view their org form fields"
  ON application_form_fields FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage their org form fields"
  ON application_form_fields FOR ALL
  TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
