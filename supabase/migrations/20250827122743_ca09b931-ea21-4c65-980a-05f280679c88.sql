-- Add pwa_icon_url column to site_settings table
ALTER TABLE public.site_settings 
ADD COLUMN pwa_icon_url TEXT;