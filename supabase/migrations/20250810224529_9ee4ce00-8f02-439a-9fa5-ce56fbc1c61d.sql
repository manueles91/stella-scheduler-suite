-- Enable pgcrypto in the extensions schema (safe if already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Update function to use schema-qualified gen_random_bytes so it works with empty search_path
CREATE OR REPLACE FUNCTION public.generate_registration_token()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN encode(extensions.gen_random_bytes(32), 'base64url');
END;
$function$;