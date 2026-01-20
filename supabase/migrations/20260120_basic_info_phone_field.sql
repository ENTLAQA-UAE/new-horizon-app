-- Add Phone Number as a mandatory field in Basic Information section
-- This ensures all applications capture: First Name, Last Name, Email, Phone Number

-- Update the seed function to include phone in basic information
CREATE OR REPLACE FUNCTION seed_default_application_form(p_org_id UUID)
RETURNS VOID AS $$
DECLARE
  v_basic_info_id UUID;
  v_contact_id UUID;
  v_education_id UUID;
  v_experience_id UUID;
BEGIN
  -- Basic Information Section (Default, cannot be disabled)
  INSERT INTO application_form_sections (org_id, name, name_ar, icon, is_default, is_enabled, sort_order)
  VALUES (p_org_id, 'Basic Information', 'المعلومات الأساسية', 'user', true, true, 1)
  RETURNING id INTO v_basic_info_id;

  -- Basic Information Fields - Core mandatory fields
  INSERT INTO application_form_fields (section_id, org_id, name, name_ar, field_type, is_default, is_required, is_enabled, sort_order) VALUES
  (v_basic_info_id, p_org_id, 'First Name', 'الاسم الأول', 'text', true, true, true, 1),
  (v_basic_info_id, p_org_id, 'Last Name', 'اسم العائلة', 'text', true, true, true, 2),
  (v_basic_info_id, p_org_id, 'Email', 'البريد الإلكتروني', 'email', true, true, true, 3),
  (v_basic_info_id, p_org_id, 'Phone Number', 'رقم الهاتف', 'phone', true, true, true, 4),
  (v_basic_info_id, p_org_id, 'LinkedIn', 'لينكد إن', 'url', false, false, true, 5),
  (v_basic_info_id, p_org_id, 'Gender', 'الجنس', 'select', false, false, true, 6),
  (v_basic_info_id, p_org_id, 'Date of Birth', 'تاريخ الميلاد', 'date', false, false, true, 7);

  -- Contact Details Section
  INSERT INTO application_form_sections (org_id, name, name_ar, icon, is_default, is_enabled, sort_order)
  VALUES (p_org_id, 'Contact Details', 'بيانات التواصل', 'globe', false, true, 2)
  RETURNING id INTO v_contact_id;

  INSERT INTO application_form_fields (section_id, org_id, name, name_ar, field_type, is_default, is_required, is_enabled, sort_order) VALUES
  (v_contact_id, p_org_id, 'Country of Residency', 'بلد الإقامة', 'select', false, true, true, 1),
  (v_contact_id, p_org_id, 'City', 'المدينة', 'text', false, true, true, 2);

  -- Education Section
  INSERT INTO application_form_sections (org_id, name, name_ar, icon, is_default, is_enabled, sort_order)
  VALUES (p_org_id, 'Education', 'التعليم', 'graduation-cap', false, true, 3)
  RETURNING id INTO v_education_id;

  INSERT INTO application_form_fields (section_id, org_id, name, name_ar, field_type, is_default, is_required, is_enabled, sort_order) VALUES
  (v_education_id, p_org_id, 'Education Level', 'المستوى التعليمي', 'select', false, true, true, 1),
  (v_education_id, p_org_id, 'University or School Name', 'اسم الجامعة أو المدرسة', 'text', false, true, true, 2),
  (v_education_id, p_org_id, 'Major', 'التخصص', 'text', false, true, true, 3),
  (v_education_id, p_org_id, 'Year of Graduation', 'سنة التخرج', 'number', false, false, true, 4),
  (v_education_id, p_org_id, 'GPA / Rating', 'المعدل التراكمي', 'text', false, false, true, 5);

  -- Experience Section
  INSERT INTO application_form_sections (org_id, name, name_ar, icon, is_default, is_enabled, sort_order)
  VALUES (p_org_id, 'Experience', 'الخبرة', 'briefcase', false, true, 4)
  RETURNING id INTO v_experience_id;

  INSERT INTO application_form_fields (section_id, org_id, name, name_ar, field_type, is_default, is_required, is_enabled, sort_order) VALUES
  (v_experience_id, p_org_id, 'Position', 'المسمى الوظيفي', 'text', false, true, true, 1),
  (v_experience_id, p_org_id, 'Company', 'الشركة', 'text', false, true, true, 2),
  (v_experience_id, p_org_id, 'Location', 'الموقع', 'text', false, false, true, 3),
  (v_experience_id, p_org_id, 'From Date', 'من تاريخ', 'date', false, true, true, 4),
  (v_experience_id, p_org_id, 'To Date', 'إلى تاريخ', 'date', false, false, true, 5),
  (v_experience_id, p_org_id, 'Years of Experience', 'سنوات الخبرة', 'number', false, false, true, 6),
  (v_experience_id, p_org_id, 'Role Description', 'وصف الدور', 'textarea', false, false, true, 7);
END;
$$ LANGUAGE plpgsql;

-- For existing organizations: Add Phone Number field to Basic Information if missing
DO $$
DECLARE
  v_section RECORD;
BEGIN
  -- Find all Basic Information sections that don't have a Phone Number field
  FOR v_section IN
    SELECT s.id, s.org_id
    FROM application_form_sections s
    WHERE s.name = 'Basic Information'
    AND s.is_default = true
    AND NOT EXISTS (
      SELECT 1 FROM application_form_fields f
      WHERE f.section_id = s.id
      AND f.name = 'Phone Number'
    )
  LOOP
    -- Add Phone Number field
    INSERT INTO application_form_fields (
      section_id,
      org_id,
      name,
      name_ar,
      field_type,
      is_default,
      is_required,
      is_enabled,
      sort_order
    ) VALUES (
      v_section.id,
      v_section.org_id,
      'Phone Number',
      'رقم الهاتف',
      'phone',
      true,   -- is_default: cannot be deleted
      true,   -- is_required: mandatory field
      true,   -- is_enabled
      4       -- sort_order: after Email
    );
  END LOOP;
END $$;

-- Update sort_order for fields that come after Phone Number in existing Basic Information sections
UPDATE application_form_fields f
SET sort_order = sort_order + 1
FROM application_form_sections s
WHERE f.section_id = s.id
AND s.name = 'Basic Information'
AND s.is_default = true
AND f.name IN ('LinkedIn', 'Gender', 'Date of Birth')
AND f.sort_order <= 4;
