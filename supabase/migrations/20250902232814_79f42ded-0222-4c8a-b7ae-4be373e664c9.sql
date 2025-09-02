-- Fix security issues for loyalty functions by setting search_path

-- Update generate_loyalty_qr_token function with proper search_path
CREATE OR REPLACE FUNCTION public.generate_loyalty_qr_token()
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(extensions.gen_random_bytes(16), 'base64url');
END;
$$;

-- Update set_loyalty_qr_token function with proper search_path  
CREATE OR REPLACE FUNCTION public.set_loyalty_qr_token()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.qr_code_token IS NULL THEN
    NEW.qr_code_token = public.generate_loyalty_qr_token();
  END IF;
  RETURN NEW;
END;
$$;