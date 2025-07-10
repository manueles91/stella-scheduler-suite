-- Ensure service-images bucket exists
INSERT INTO storage.buckets (id, name, public) VALUES ('service-images', 'service-images', true) ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admins to upload service images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins and employees to upload service images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to update service images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins and employees to update service images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to delete service images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins and employees to delete service images" ON storage.objects;

-- Create policies to allow both admins and employees to upload service images
CREATE POLICY "Allow admins and employees to upload service images" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'service-images' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'employee')
  )
);

-- Create policy to allow public access to service images
CREATE POLICY "Allow public access to service images" ON storage.objects 
FOR SELECT USING (bucket_id = 'service-images');

-- Create policy to allow admins and employees to update service images
CREATE POLICY "Allow admins and employees to update service images" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'service-images' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'employee')
  )
);

-- Create policy to allow admins and employees to delete service images
CREATE POLICY "Allow admins and employees to delete service images" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'service-images' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'employee')
  )
);