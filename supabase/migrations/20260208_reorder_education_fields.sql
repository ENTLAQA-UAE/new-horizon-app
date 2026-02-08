-- =====================================================
-- REORDER EDUCATIONAL BACKGROUND FIELDS
-- =====================================================
-- Updates the sort_order for fields in the Educational Background
-- section to match the desired order:
-- 1. Faculty Name
-- 2. University Name
-- 3. Major
-- 4. Grade / GPA
-- 5. Year of Graduation

DO $$
DECLARE
  v_section RECORD;
BEGIN
  -- Loop through all Educational Background sections
  FOR v_section IN
    SELECT id
    FROM application_form_sections
    WHERE name IN ('Educational Background', 'Education')
  LOOP
    -- Update sort_order for each field
    UPDATE application_form_fields
    SET sort_order = 1
    WHERE section_id = v_section.id AND name = 'Faculty Name';

    UPDATE application_form_fields
    SET sort_order = 2
    WHERE section_id = v_section.id AND name IN ('University Name', 'Institution Name', 'University or School Name');

    UPDATE application_form_fields
    SET sort_order = 3
    WHERE section_id = v_section.id AND name IN ('Major', 'Field of Study');

    UPDATE application_form_fields
    SET sort_order = 4
    WHERE section_id = v_section.id AND name IN ('GPA / Grade', 'Grade / GPA', 'GPA / Rating');

    UPDATE application_form_fields
    SET sort_order = 5
    WHERE section_id = v_section.id AND name = 'Year of Graduation';

    -- Keep Degree field at position 0 if it exists (before Faculty Name)
    UPDATE application_form_fields
    SET sort_order = 0
    WHERE section_id = v_section.id AND name = 'Degree';

    -- Adjust other fields to come after (From Date, To Date, Currently Studying, etc.)
    UPDATE application_form_fields
    SET sort_order = 6
    WHERE section_id = v_section.id AND name = 'From Date';

    UPDATE application_form_fields
    SET sort_order = 7
    WHERE section_id = v_section.id AND name = 'To Date';

    UPDATE application_form_fields
    SET sort_order = 8
    WHERE section_id = v_section.id AND name = 'Currently Studying';

  END LOOP;
END $$;

-- Also update the seed function for new organizations
CREATE OR REPLACE FUNCTION seed_default_application_form(p_org_id UUID)
RETURNS VOID AS $$
DECLARE
  v_basic_info_id UUID;
  v_contact_id UUID;
  v_education_id UUID;
  v_experience_id UUID;
  v_certifications_id UUID;
  v_languages_id UUID;
BEGIN
  -- Basic Information Section (Default, cannot be disabled)
  INSERT INTO application_form_sections (org_id, name, name_ar, icon, is_default, is_enabled, is_repeatable, min_entries, max_entries, sort_order)
  VALUES (p_org_id, 'Basic Information', 'المعلومات الأساسية', 'user', true, true, false, 1, 1, 1)
  RETURNING id INTO v_basic_info_id;

  -- Basic Information Fields
  INSERT INTO application_form_fields (section_id, org_id, name, name_ar, field_type, options, is_default, is_required, is_enabled, sort_order) VALUES
  (v_basic_info_id, p_org_id, 'First Name', 'الاسم الأول', 'text', NULL, true, true, true, 1),
  (v_basic_info_id, p_org_id, 'Last Name', 'اسم العائلة', 'text', NULL, true, true, true, 2),
  (v_basic_info_id, p_org_id, 'Email', 'البريد الإلكتروني', 'email', NULL, true, true, true, 3),
  (v_basic_info_id, p_org_id, 'Phone Number', 'رقم الهاتف', 'phone', NULL, true, true, true, 4),
  (v_basic_info_id, p_org_id, 'LinkedIn', 'لينكد إن', 'url', NULL, false, false, true, 5),
  (v_basic_info_id, p_org_id, 'Gender', 'الجنس', 'select', '[{"value":"male","label":"Male","label_ar":"ذكر"},{"value":"female","label":"Female","label_ar":"أنثى"}]'::jsonb, false, false, true, 6),
  (v_basic_info_id, p_org_id, 'Date of Birth', 'تاريخ الميلاد', 'date', NULL, false, false, true, 7);

  -- Contact Details Section
  INSERT INTO application_form_sections (org_id, name, name_ar, icon, is_default, is_enabled, is_repeatable, min_entries, max_entries, sort_order)
  VALUES (p_org_id, 'Contact Details', 'بيانات التواصل', 'globe', false, true, false, 1, 1, 2)
  RETURNING id INTO v_contact_id;

  INSERT INTO application_form_fields (section_id, org_id, name, name_ar, field_type, is_default, is_required, is_enabled, sort_order) VALUES
  (v_contact_id, p_org_id, 'Country of Residency', 'بلد الإقامة', 'text', false, false, true, 1),
  (v_contact_id, p_org_id, 'City', 'المدينة', 'text', false, false, true, 2),
  (v_contact_id, p_org_id, 'Address', 'العنوان', 'textarea', false, false, true, 3);

  -- Experience Section (REPEATABLE)
  INSERT INTO application_form_sections (org_id, name, name_ar, icon, is_default, is_enabled, is_repeatable, min_entries, max_entries, sort_order)
  VALUES (p_org_id, 'Experience', 'الخبرة العملية', 'briefcase', false, true, true, 0, 10, 3)
  RETURNING id INTO v_experience_id;

  INSERT INTO application_form_fields (section_id, org_id, name, name_ar, field_type, is_default, is_required, is_enabled, sort_order) VALUES
  (v_experience_id, p_org_id, 'Position', 'المسمى الوظيفي', 'text', false, true, true, 1),
  (v_experience_id, p_org_id, 'Company Name', 'اسم الشركة', 'text', false, true, true, 2),
  (v_experience_id, p_org_id, 'From Date', 'من تاريخ', 'date', false, true, true, 3),
  (v_experience_id, p_org_id, 'To Date', 'إلى تاريخ', 'date', false, false, true, 4),
  (v_experience_id, p_org_id, 'Currently Working Here', 'أعمل هنا حالياً', 'checkbox', false, false, true, 5),
  (v_experience_id, p_org_id, 'Job Description', 'وصف المهام', 'textarea', false, false, true, 6);

  -- Education Section (REPEATABLE) - Updated field order
  INSERT INTO application_form_sections (org_id, name, name_ar, icon, is_default, is_enabled, is_repeatable, min_entries, max_entries, sort_order)
  VALUES (p_org_id, 'Educational Background', 'الخلفية التعليمية', 'graduation-cap', false, true, true, 0, 5, 4)
  RETURNING id INTO v_education_id;

  INSERT INTO application_form_fields (section_id, org_id, name, name_ar, field_type, options, is_default, is_required, is_enabled, sort_order) VALUES
  (v_education_id, p_org_id, 'Faculty Name', 'اسم الكلية', 'text', NULL, false, true, true, 1),
  (v_education_id, p_org_id, 'University Name', 'اسم الجامعة', 'text', NULL, false, true, true, 2),
  (v_education_id, p_org_id, 'Major', 'التخصص', 'text', NULL, false, false, true, 3),
  (v_education_id, p_org_id, 'GPA / Grade', 'المعدل التراكمي', 'text', NULL, false, false, true, 4),
  (v_education_id, p_org_id, 'Year of Graduation', 'سنة التخرج', 'number', NULL, false, true, true, 5);

  -- Certifications Section (REPEATABLE)
  INSERT INTO application_form_sections (org_id, name, name_ar, icon, is_default, is_enabled, is_repeatable, min_entries, max_entries, sort_order)
  VALUES (p_org_id, 'Certifications', 'الشهادات المهنية', 'award', false, true, true, 0, 10, 5)
  RETURNING id INTO v_certifications_id;

  INSERT INTO application_form_fields (section_id, org_id, name, name_ar, field_type, is_default, is_required, is_enabled, sort_order) VALUES
  (v_certifications_id, p_org_id, 'Certification Name', 'اسم الشهادة', 'text', false, true, true, 1),
  (v_certifications_id, p_org_id, 'Issuing Organization', 'الجهة المانحة', 'text', false, true, true, 2),
  (v_certifications_id, p_org_id, 'Issue Date', 'تاريخ الإصدار', 'date', false, false, true, 3),
  (v_certifications_id, p_org_id, 'Expiry Date', 'تاريخ الانتهاء', 'date', false, false, true, 4),
  (v_certifications_id, p_org_id, 'Does Not Expire', 'لا تنتهي صلاحيتها', 'checkbox', false, false, true, 5),
  (v_certifications_id, p_org_id, 'Credential ID', 'رقم الشهادة', 'text', false, false, true, 6),
  (v_certifications_id, p_org_id, 'Credential URL', 'رابط الشهادة', 'url', false, false, true, 7);

  -- Languages Section (REPEATABLE)
  INSERT INTO application_form_sections (org_id, name, name_ar, icon, is_default, is_enabled, is_repeatable, min_entries, max_entries, sort_order)
  VALUES (p_org_id, 'Languages', 'اللغات', 'languages', false, true, true, 0, 10, 6)
  RETURNING id INTO v_languages_id;

  INSERT INTO application_form_fields (section_id, org_id, name, name_ar, field_type, options, is_default, is_required, is_enabled, sort_order) VALUES
  (v_languages_id, p_org_id, 'Language', 'اللغة', 'select', '[{"value":"arabic","label":"Arabic","label_ar":"العربية"},{"value":"english","label":"English","label_ar":"الإنجليزية"},{"value":"french","label":"French","label_ar":"الفرنسية"},{"value":"spanish","label":"Spanish","label_ar":"الإسبانية"},{"value":"german","label":"German","label_ar":"الألمانية"},{"value":"chinese","label":"Chinese","label_ar":"الصينية"},{"value":"japanese","label":"Japanese","label_ar":"اليابانية"},{"value":"korean","label":"Korean","label_ar":"الكورية"},{"value":"portuguese","label":"Portuguese","label_ar":"البرتغالية"},{"value":"russian","label":"Russian","label_ar":"الروسية"},{"value":"italian","label":"Italian","label_ar":"الإيطالية"},{"value":"dutch","label":"Dutch","label_ar":"الهولندية"},{"value":"turkish","label":"Turkish","label_ar":"التركية"},{"value":"hindi","label":"Hindi","label_ar":"الهندية"},{"value":"urdu","label":"Urdu","label_ar":"الأردية"},{"value":"bengali","label":"Bengali","label_ar":"البنغالية"},{"value":"persian","label":"Persian","label_ar":"الفارسية"},{"value":"indonesian","label":"Indonesian","label_ar":"الإندونيسية"},{"value":"malay","label":"Malay","label_ar":"الملايوية"},{"value":"thai","label":"Thai","label_ar":"التايلاندية"},{"value":"vietnamese","label":"Vietnamese","label_ar":"الفيتنامية"},{"value":"polish","label":"Polish","label_ar":"البولندية"},{"value":"swedish","label":"Swedish","label_ar":"السويدية"},{"value":"greek","label":"Greek","label_ar":"اليونانية"},{"value":"hebrew","label":"Hebrew","label_ar":"العبرية"},{"value":"other","label":"Other","label_ar":"أخرى"}]'::jsonb, false, true, true, 1),
  (v_languages_id, p_org_id, 'Proficiency Level', 'مستوى الإتقان', 'select', '[{"value":"native","label":"Native","label_ar":"اللغة الأم"},{"value":"fluent","label":"Fluent","label_ar":"طلاقة"},{"value":"advanced","label":"Advanced","label_ar":"متقدم"},{"value":"intermediate","label":"Intermediate","label_ar":"متوسط"},{"value":"basic","label":"Basic","label_ar":"مبتدئ"}]'::jsonb, false, true, true, 2);
END;
$$ LANGUAGE plpgsql;
