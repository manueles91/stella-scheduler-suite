-- Add avatar_url column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload profile images
CREATE POLICY IF NOT EXISTS "Allow admins to upload profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow public read access to profile images
CREATE POLICY IF NOT EXISTS "Public read access to profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

-- Allow admins to update profile images
CREATE POLICY IF NOT EXISTS "Allow admins to update profile images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-images' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to delete profile images
CREATE POLICY IF NOT EXISTS "Allow admins to delete profile images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-images' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);