-- Add image_url column to services table if it doesn't exist
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS image_url TEXT;