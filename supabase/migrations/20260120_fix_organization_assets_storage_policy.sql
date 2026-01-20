-- Fix storage policies: profiles table uses 'org_id' not 'organization_id'

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload organization assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update organization assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete organization assets" ON storage.objects;

-- Recreate policies with correct column name (org_id instead of organization_id)
CREATE POLICY "Users can upload organization assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT o.id::text FROM organizations o
    JOIN profiles p ON p.org_id = o.id
    WHERE p.id = auth.uid()
  )
);

CREATE POLICY "Users can update organization assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'organization-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT o.id::text FROM organizations o
    JOIN profiles p ON p.org_id = o.id
    WHERE p.id = auth.uid()
  )
);

CREATE POLICY "Users can delete organization assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'organization-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT o.id::text FROM organizations o
    JOIN profiles p ON p.org_id = o.id
    WHERE p.id = auth.uid()
  )
);
