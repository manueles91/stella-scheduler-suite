-- Simplify token generation: use hex encoding (URL-safe, no padding)
CREATE OR REPLACE FUNCTION public.generate_registration_token()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- 32 bytes -> 64 hex chars; robust and simple
  RETURN encode(extensions.gen_random_bytes(32), 'hex');
END;
$function$;