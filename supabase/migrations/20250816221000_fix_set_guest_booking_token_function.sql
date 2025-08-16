-- Fix guest booking trigger to schema-qualify token generator
CREATE OR REPLACE FUNCTION public.set_guest_booking_token()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.is_guest_booking = true AND NEW.registration_token IS NULL THEN
    -- Use schema-qualified function to avoid search_path issues
    NEW.registration_token = public.generate_registration_token();
  END IF;
  RETURN NEW;
END;
$$;