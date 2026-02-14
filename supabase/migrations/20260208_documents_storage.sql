-- Create storage bucket for candidate documents (assessments, test reports, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true, -- Public so documents can be viewed
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Anyone can view documents"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can update documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can delete documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');
