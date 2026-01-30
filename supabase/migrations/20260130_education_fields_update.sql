-- =====================================================
-- UPDATE EDUCATION SECTION FIELDS FOR EXISTING ORGS
-- =====================================================
-- Adds University Name, Major, and GPA/Grade fields to
-- existing Education sections that are missing them.
-- Also renames "Faculty Name" to "University Name" where applicable.

DO $$
DECLARE
  v_section RECORD;
  v_max_sort INT;
BEGIN
  -- Loop through all Education / Educational Background sections
  FOR v_section IN
    SELECT s.id, s.org_id
    FROM application_form_sections s
    WHERE s.name IN ('Education', 'Educational Background')
  LOOP

    -- Rename "Faculty Name" to "University Name" if it exists
    UPDATE application_form_fields
    SET name = 'University Name', name_ar = 'اسم الجامعة'
    WHERE section_id = v_section.id
      AND name = 'Faculty Name';

    -- Get current max sort_order for this section
    SELECT COALESCE(MAX(sort_order), 0) INTO v_max_sort
    FROM application_form_fields
    WHERE section_id = v_section.id;

    -- Add "University Name" if neither it nor "Institution Name" nor "University or School Name" exists
    IF NOT EXISTS (
      SELECT 1 FROM application_form_fields
      WHERE section_id = v_section.id
        AND name IN ('University Name', 'Institution Name', 'University or School Name')
    ) THEN
      v_max_sort := v_max_sort + 1;
      INSERT INTO application_form_fields (
        section_id, org_id, name, name_ar, field_type,
        is_default, is_required, is_enabled, sort_order
      ) VALUES (
        v_section.id, v_section.org_id, 'University Name', 'اسم الجامعة', 'text',
        false, true, true, v_max_sort
      );
    END IF;

    -- Add "Major" field if neither it nor "Field of Study" exists
    IF NOT EXISTS (
      SELECT 1 FROM application_form_fields
      WHERE section_id = v_section.id
        AND name IN ('Major', 'Field of Study')
    ) THEN
      v_max_sort := v_max_sort + 1;
      INSERT INTO application_form_fields (
        section_id, org_id, name, name_ar, field_type,
        is_default, is_required, is_enabled, sort_order
      ) VALUES (
        v_section.id, v_section.org_id, 'Major', 'التخصص', 'text',
        false, false, true, v_max_sort
      );
    END IF;

    -- Add "GPA / Grade" field if it doesn't exist (also check "GPA / Rating")
    IF NOT EXISTS (
      SELECT 1 FROM application_form_fields
      WHERE section_id = v_section.id
        AND name IN ('GPA / Grade', 'GPA / Rating')
    ) THEN
      v_max_sort := v_max_sort + 1;
      INSERT INTO application_form_fields (
        section_id, org_id, name, name_ar, field_type,
        is_default, is_required, is_enabled, sort_order
      ) VALUES (
        v_section.id, v_section.org_id, 'GPA / Grade', 'المعدل التراكمي', 'text',
        false, false, true, v_max_sort
      );
    END IF;

  END LOOP;
END $$;
