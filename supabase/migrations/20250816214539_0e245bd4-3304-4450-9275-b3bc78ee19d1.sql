-- Create the missing generate_registration_token function for guest bookings
CREATE OR REPLACE FUNCTION public.generate_registration_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Generate a simple UUID-based token for guest user registration
  RETURN gen_random_uuid()::text;
END;
$$;