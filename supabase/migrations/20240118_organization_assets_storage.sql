-- Create storage bucket for organization assets (logos, favicons)
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-assets', 'organization-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload to their organization's folder
CREATE POLICY "Users can upload organization assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT o.id::text FROM organizations o
    JOIN profiles p ON p.organization_id = o.id
    WHERE p.id = auth.uid()
  )
);

-- Policy to allow users to update/replace their organization's assets
CREATE POLICY "Users can update organization assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'organization-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT o.id::text FROM organizations o
    JOIN profiles p ON p.organization_id = o.id
    WHERE p.id = auth.uid()
  )
);

-- Policy to allow users to delete their organization's assets
CREATE POLICY "Users can delete organization assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'organization-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT o.id::text FROM organizations o
    JOIN profiles p ON p.organization_id = o.id
    WHERE p.id = auth.uid()
  )
);

-- Policy to allow public read access (for displaying logos on careers page, etc.)
CREATE POLICY "Anyone can view organization assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'organization-assets');
