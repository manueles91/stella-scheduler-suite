-- Add image_url column to services table
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for service images
INSERT INTO storage.buckets (id, name, public) VALUES ('service-images', 'service-images', true) ON CONFLICT (id) DO NOTHING;

-- Create policy to allow service image uploads for admins
CREATE POLICY "Allow admins to upload service images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'service-images' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create policy to allow public access to service images
CREATE POLICY "Allow public access to service images" ON storage.objects FOR SELECT USING (bucket_id = 'service-images');

-- Create policy to allow admins to update service images
CREATE POLICY "Allow admins to update service images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'service-images' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create policy to allow admins to delete service images
CREATE POLICY "Allow admins to delete service images" ON storage.objects FOR DELETE USING (
  bucket_id = 'service-images' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);