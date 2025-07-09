-- Update policy to allow both admins and employees to upload service images
DROP POLICY IF EXISTS "Allow admins to upload service images" ON storage.objects;
CREATE POLICY "Allow admins and employees to upload service images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'service-images' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'employee')
  )
);

-- Update policy to allow both admins and employees to update service images
DROP POLICY IF EXISTS "Allow admins to update service images" ON storage.objects;
CREATE POLICY "Allow admins and employees to update service images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'service-images' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'employee')
  )
);

-- Update policy to allow both admins and employees to delete service images
DROP POLICY IF EXISTS "Allow admins to delete service images" ON storage.objects;
CREATE POLICY "Allow admins and employees to delete service images" ON storage.objects FOR DELETE USING (
  bucket_id = 'service-images' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'employee')
  )
);