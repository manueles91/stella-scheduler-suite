-- Create site_settings table for global assets
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url TEXT,
  landing_background_url TEXT,
  updated_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone can read, only admins can write
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'site_settings' AND policyname = 'Anyone can view site settings'
  ) THEN
    CREATE POLICY "Anyone can view site settings"
    ON public.site_settings
    FOR SELECT
    USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'site_settings' AND policyname = 'Admins can manage site settings'
  ) THEN
    CREATE POLICY "Admins can manage site settings"
    ON public.site_settings
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- Create a public storage bucket for site assets (logo & hero images)
INSERT INTO storage.buckets (id, name, public)
SELECT 'site-assets', 'site-assets', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'site-assets'
);

-- Storage policies for site-assets
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can view site assets'
  ) THEN
    CREATE POLICY "Public can view site assets"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'site-assets');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can manage site assets'
  ) THEN
    CREATE POLICY "Admins can manage site assets"
    ON storage.objects
    FOR ALL
    USING (
      bucket_id = 'site-assets' AND EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
      )
    )
    WITH CHECK (
      bucket_id = 'site-assets' AND EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
      )
    );
  END IF;
END $$;
