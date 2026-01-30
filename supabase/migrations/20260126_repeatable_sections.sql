-- =====================================================
-- UPDATE APPLICATION FORM FOR REPEATABLE SECTIONS
-- =====================================================

-- Update the seed function with repeatable sections and options
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

  -- Education Section (REPEATABLE)
  INSERT INTO application_form_sections (org_id, name, name_ar, icon, is_default, is_enabled, is_repeatable, min_entries, max_entries, sort_order)
  VALUES (p_org_id, 'Education', 'التعليم', 'graduation-cap', false, true, true, 0, 5, 4)
  RETURNING id INTO v_education_id;

  INSERT INTO application_form_fields (section_id, org_id, name, name_ar, field_type, options, is_default, is_required, is_enabled, sort_order) VALUES
  (v_education_id, p_org_id, 'Degree', 'الدرجة العلمية', 'select', '[{"value":"high_school","label":"High School","label_ar":"الثانوية"},{"value":"diploma","label":"Diploma","label_ar":"دبلوم"},{"value":"bachelors","label":"Bachelor''s Degree","label_ar":"بكالوريوس"},{"value":"masters","label":"Master''s Degree","label_ar":"ماجستير"},{"value":"phd","label":"PhD / Doctorate","label_ar":"دكتوراه"},{"value":"other","label":"Other","label_ar":"أخرى"}]'::jsonb, false, true, true, 1),
  (v_education_id, p_org_id, 'University Name', 'اسم الجامعة', 'text', NULL, false, true, true, 2),
  (v_education_id, p_org_id, 'Major', 'التخصص', 'text', NULL, false, false, true, 3),
  (v_education_id, p_org_id, 'From Date', 'من تاريخ', 'date', NULL, false, false, true, 4),
  (v_education_id, p_org_id, 'To Date', 'إلى تاريخ', 'date', NULL, false, false, true, 5),
  (v_education_id, p_org_id, 'Currently Studying', 'أدرس حالياً', 'checkbox', NULL, false, false, true, 6),
  (v_education_id, p_org_id, 'GPA / Grade', 'المعدل التراكمي', 'text', NULL, false, false, true, 7);

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

-- =====================================================
-- ADD MISSING SECTIONS TO EXISTING ORGANIZATIONS
-- =====================================================

-- Function to add missing sections to existing organizations
CREATE OR REPLACE FUNCTION add_missing_application_sections()
RETURNS VOID AS $$
DECLARE
  org_record RECORD;
  v_experience_id UUID;
  v_education_id UUID;
  v_certifications_id UUID;
  v_languages_id UUID;
  v_section_exists BOOLEAN;
BEGIN
  -- Loop through all organizations that have application form sections
  FOR org_record IN
    SELECT DISTINCT org_id FROM application_form_sections
  LOOP
    -- Update existing Experience section to be repeatable
    UPDATE application_form_sections
    SET is_repeatable = true, min_entries = 0, max_entries = 10
    WHERE org_id = org_record.org_id AND name = 'Experience' AND is_repeatable = false;

    -- Update existing Education section to be repeatable
    UPDATE application_form_sections
    SET is_repeatable = true, min_entries = 0, max_entries = 5
    WHERE org_id = org_record.org_id AND name = 'Education' AND is_repeatable = false;

    -- Check if Certifications section exists
    SELECT EXISTS(SELECT 1 FROM application_form_sections WHERE org_id = org_record.org_id AND name = 'Certifications') INTO v_section_exists;

    IF NOT v_section_exists THEN
      -- Add Certifications section
      INSERT INTO application_form_sections (org_id, name, name_ar, icon, is_default, is_enabled, is_repeatable, min_entries, max_entries, sort_order)
      VALUES (org_record.org_id, 'Certifications', 'الشهادات المهنية', 'award', false, true, true, 0, 10, 5)
      RETURNING id INTO v_certifications_id;

      INSERT INTO application_form_fields (section_id, org_id, name, name_ar, field_type, is_default, is_required, is_enabled, sort_order) VALUES
      (v_certifications_id, org_record.org_id, 'Certification Name', 'اسم الشهادة', 'text', false, true, true, 1),
      (v_certifications_id, org_record.org_id, 'Issuing Organization', 'الجهة المانحة', 'text', false, true, true, 2),
      (v_certifications_id, org_record.org_id, 'Issue Date', 'تاريخ الإصدار', 'date', false, false, true, 3),
      (v_certifications_id, org_record.org_id, 'Expiry Date', 'تاريخ الانتهاء', 'date', false, false, true, 4),
      (v_certifications_id, org_record.org_id, 'Does Not Expire', 'لا تنتهي صلاحيتها', 'checkbox', false, false, true, 5),
      (v_certifications_id, org_record.org_id, 'Credential ID', 'رقم الشهادة', 'text', false, false, true, 6),
      (v_certifications_id, org_record.org_id, 'Credential URL', 'رابط الشهادة', 'url', false, false, true, 7);
    END IF;

    -- Check if Languages section exists
    SELECT EXISTS(SELECT 1 FROM application_form_sections WHERE org_id = org_record.org_id AND name = 'Languages') INTO v_section_exists;

    IF NOT v_section_exists THEN
      -- Add Languages section
      INSERT INTO application_form_sections (org_id, name, name_ar, icon, is_default, is_enabled, is_repeatable, min_entries, max_entries, sort_order)
      VALUES (org_record.org_id, 'Languages', 'اللغات', 'languages', false, true, true, 0, 10, 6)
      RETURNING id INTO v_languages_id;

      INSERT INTO application_form_fields (section_id, org_id, name, name_ar, field_type, options, is_default, is_required, is_enabled, sort_order) VALUES
      (v_languages_id, org_record.org_id, 'Language', 'اللغة', 'select', '[{"value":"arabic","label":"Arabic","label_ar":"العربية"},{"value":"english","label":"English","label_ar":"الإنجليزية"},{"value":"french","label":"French","label_ar":"الفرنسية"},{"value":"spanish","label":"Spanish","label_ar":"الإسبانية"},{"value":"german","label":"German","label_ar":"الألمانية"},{"value":"chinese","label":"Chinese","label_ar":"الصينية"},{"value":"japanese","label":"Japanese","label_ar":"اليابانية"},{"value":"korean","label":"Korean","label_ar":"الكورية"},{"value":"portuguese","label":"Portuguese","label_ar":"البرتغالية"},{"value":"russian","label":"Russian","label_ar":"الروسية"},{"value":"italian","label":"Italian","label_ar":"الإيطالية"},{"value":"dutch","label":"Dutch","label_ar":"الهولندية"},{"value":"turkish","label":"Turkish","label_ar":"التركية"},{"value":"hindi","label":"Hindi","label_ar":"الهندية"},{"value":"urdu","label":"Urdu","label_ar":"الأردية"},{"value":"bengali","label":"Bengali","label_ar":"البنغالية"},{"value":"persian","label":"Persian","label_ar":"الفارسية"},{"value":"indonesian","label":"Indonesian","label_ar":"الإندونيسية"},{"value":"malay","label":"Malay","label_ar":"الملايوية"},{"value":"thai","label":"Thai","label_ar":"التايلاندية"},{"value":"vietnamese","label":"Vietnamese","label_ar":"الفيتنامية"},{"value":"polish","label":"Polish","label_ar":"البولندية"},{"value":"swedish","label":"Swedish","label_ar":"السويدية"},{"value":"greek","label":"Greek","label_ar":"اليونانية"},{"value":"hebrew","label":"Hebrew","label_ar":"العبرية"},{"value":"other","label":"Other","label_ar":"أخرى"}]'::jsonb, false, true, true, 1),
      (v_languages_id, org_record.org_id, 'Proficiency Level', 'مستوى الإتقان', 'select', '[{"value":"native","label":"Native","label_ar":"اللغة الأم"},{"value":"fluent","label":"Fluent","label_ar":"طلاقة"},{"value":"advanced","label":"Advanced","label_ar":"متقدم"},{"value":"intermediate","label":"Intermediate","label_ar":"متوسط"},{"value":"basic","label":"Basic","label_ar":"مبتدئ"}]'::jsonb, false, true, true, 2);
    END IF;

    -- Add "Currently Working Here" checkbox to Experience if missing
    IF EXISTS(SELECT 1 FROM application_form_sections WHERE org_id = org_record.org_id AND name = 'Experience') THEN
      SELECT id INTO v_experience_id FROM application_form_sections WHERE org_id = org_record.org_id AND name = 'Experience';

      IF NOT EXISTS(SELECT 1 FROM application_form_fields WHERE section_id = v_experience_id AND name = 'Currently Working Here') THEN
        INSERT INTO application_form_fields (section_id, org_id, name, name_ar, field_type, is_default, is_required, is_enabled, sort_order) VALUES
        (v_experience_id, org_record.org_id, 'Currently Working Here', 'أعمل هنا حالياً', 'checkbox', false, false, true, 5);
      END IF;
    END IF;

    -- Add "Currently Studying" checkbox to Education if missing
    IF EXISTS(SELECT 1 FROM application_form_sections WHERE org_id = org_record.org_id AND name = 'Education') THEN
      SELECT id INTO v_education_id FROM application_form_sections WHERE org_id = org_record.org_id AND name = 'Education';

      IF NOT EXISTS(SELECT 1 FROM application_form_fields WHERE section_id = v_education_id AND name = 'Currently Studying') THEN
        INSERT INTO application_form_fields (section_id, org_id, name, name_ar, field_type, is_default, is_required, is_enabled, sort_order) VALUES
        (v_education_id, org_record.org_id, 'Currently Studying', 'أدرس حالياً', 'checkbox', false, false, true, 6);
      END IF;
    END IF;

  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to add missing sections
SELECT add_missing_application_sections();

-- Clean up - drop the one-time function
DROP FUNCTION IF EXISTS add_missing_application_sections();
