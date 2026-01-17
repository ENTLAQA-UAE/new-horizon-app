-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for resumes bucket
CREATE POLICY "Authenticated users can upload resumes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Authenticated users can view resumes in their org"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'resumes');

CREATE POLICY "Authenticated users can update their resumes"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'resumes');

CREATE POLICY "Authenticated users can delete resumes"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'resumes');

-- Create storage bucket for job thumbnails
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-thumbnails',
  'job-thumbnails',
  true, -- Public for careers page
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for job thumbnails bucket
CREATE POLICY "Anyone can view job thumbnails"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'job-thumbnails');

CREATE POLICY "Authenticated users can upload job thumbnails"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'job-thumbnails');

CREATE POLICY "Authenticated users can update job thumbnails"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'job-thumbnails');

CREATE POLICY "Authenticated users can delete job thumbnails"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'job-thumbnails');
