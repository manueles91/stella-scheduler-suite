-- Add missing generate_registration_token function
CREATE OR REPLACE FUNCTION public.generate_registration_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;