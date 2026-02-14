-- Create storage bucket for platform logos (used by super admin)
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Super admins can upload logos
CREATE POLICY "Super admins can upload logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos'
  AND public.is_super_admin(auth.uid())
);

-- Super admins can update logos
CREATE POLICY "Super admins can update logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos'
  AND public.is_super_admin(auth.uid())
);

-- Super admins can delete logos
CREATE POLICY "Super admins can delete logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos'
  AND public.is_super_admin(auth.uid())
);

-- Anyone can view logos (public)
CREATE POLICY "Anyone can view logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'logos');
