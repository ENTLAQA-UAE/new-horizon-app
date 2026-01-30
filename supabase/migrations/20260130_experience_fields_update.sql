-- =====================================================
-- UPDATE EXPERIENCE SECTION FIELDS FOR EXISTING ORGS
-- =====================================================
-- Ensures Experience sections have proper fields:
-- Position, Company Name, From Date, To Date, Currently Working Here, Job Description
-- Renames old field names and adds missing fields.

DO $$
DECLARE
  v_section RECORD;
  v_max_sort INT;
BEGIN
  FOR v_section IN
    SELECT s.id, s.org_id
    FROM application_form_sections s
    WHERE s.name IN ('Experience', 'Work Experience')
  LOOP

    -- Rename single "Date" field to "From Date" if it exists and "From Date" does not
    IF EXISTS (
      SELECT 1 FROM application_form_fields
      WHERE section_id = v_section.id AND name = 'Date'
    ) AND NOT EXISTS (
      SELECT 1 FROM application_form_fields
      WHERE section_id = v_section.id AND name = 'From Date'
    ) THEN
      UPDATE application_form_fields
      SET name = 'From Date', name_ar = 'من تاريخ'
      WHERE section_id = v_section.id AND name = 'Date';
    END IF;

    -- Rename "Description" to "Job Description" if it exists and "Job Description" does not
    IF EXISTS (
      SELECT 1 FROM application_form_fields
      WHERE section_id = v_section.id AND name = 'Description'
    ) AND NOT EXISTS (
      SELECT 1 FROM application_form_fields
      WHERE section_id = v_section.id AND name = 'Job Description'
    ) THEN
      UPDATE application_form_fields
      SET name = 'Job Description', name_ar = 'وصف المهام', is_required = false
      WHERE section_id = v_section.id AND name = 'Description';
    END IF;

    -- Get current max sort_order
    SELECT COALESCE(MAX(sort_order), 0) INTO v_max_sort
    FROM application_form_fields
    WHERE section_id = v_section.id;

    -- Add "Company Name" if neither it nor "Company" exists
    IF NOT EXISTS (
      SELECT 1 FROM application_form_fields
      WHERE section_id = v_section.id
        AND name IN ('Company Name', 'Company')
    ) THEN
      v_max_sort := v_max_sort + 1;
      INSERT INTO application_form_fields (
        section_id, org_id, name, name_ar, field_type,
        is_default, is_required, is_enabled, sort_order
      ) VALUES (
        v_section.id, v_section.org_id, 'Company Name', 'اسم الشركة', 'text',
        false, true, true, 2
      );
    END IF;

    -- Add "From Date" if missing
    IF NOT EXISTS (
      SELECT 1 FROM application_form_fields
      WHERE section_id = v_section.id AND name = 'From Date'
    ) THEN
      v_max_sort := v_max_sort + 1;
      INSERT INTO application_form_fields (
        section_id, org_id, name, name_ar, field_type,
        is_default, is_required, is_enabled, sort_order
      ) VALUES (
        v_section.id, v_section.org_id, 'From Date', 'من تاريخ', 'date',
        false, true, true, v_max_sort
      );
    END IF;

    -- Add "To Date" if missing
    IF NOT EXISTS (
      SELECT 1 FROM application_form_fields
      WHERE section_id = v_section.id AND name = 'To Date'
    ) THEN
      v_max_sort := v_max_sort + 1;
      INSERT INTO application_form_fields (
        section_id, org_id, name, name_ar, field_type,
        is_default, is_required, is_enabled, sort_order
      ) VALUES (
        v_section.id, v_section.org_id, 'To Date', 'إلى تاريخ', 'date',
        false, false, true, v_max_sort
      );
    END IF;

    -- Add "Currently Working Here" if missing
    IF NOT EXISTS (
      SELECT 1 FROM application_form_fields
      WHERE section_id = v_section.id AND name = 'Currently Working Here'
    ) THEN
      v_max_sort := v_max_sort + 1;
      INSERT INTO application_form_fields (
        section_id, org_id, name, name_ar, field_type,
        is_default, is_required, is_enabled, sort_order
      ) VALUES (
        v_section.id, v_section.org_id, 'Currently Working Here', 'أعمل هنا حالياً', 'checkbox',
        false, false, true, v_max_sort
      );
    END IF;

  END LOOP;
END $$;
