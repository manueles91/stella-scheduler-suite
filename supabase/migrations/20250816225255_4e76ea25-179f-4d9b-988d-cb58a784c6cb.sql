-- Fix generate_registration_token function to use pgcrypto properly
CREATE OR REPLACE FUNCTION public.generate_registration_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Use extensions.gen_random_bytes with explicit schema
  RETURN encode(extensions.gen_random_bytes(32), 'base64');
END;
$$;