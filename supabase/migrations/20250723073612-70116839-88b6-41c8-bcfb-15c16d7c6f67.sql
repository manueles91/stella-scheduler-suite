-- Add image_url column to service_categories table
ALTER TABLE public.service_categories ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update storage policies to allow category images in the service-images bucket
-- (We'll reuse the existing service-images bucket for categories too)
CREATE POLICY "Allow admins to upload category images" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'service-images' AND
  auth.uid() IS NOT NULL AND
  (name LIKE 'categories/%') AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Allow admins to update category images" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'service-images' AND
  auth.uid() IS NOT NULL AND
  (name LIKE 'categories/%') AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Allow admins to delete category images" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'service-images' AND
  auth.uid() IS NOT NULL AND
  (name LIKE 'categories/%') AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);