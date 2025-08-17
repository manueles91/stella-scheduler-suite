-- Apply the guest user management and registration token fix migrations

-- First migration: Fix the generate_registration_token function
CREATE OR REPLACE FUNCTION public.generate_registration_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Use extensions.gen_random_bytes with explicit schema
  RETURN encode(extensions.gen_random_bytes(32), 'base64');
END;
$function$;

-- Second migration: Add guest user management to invited_users and reservations
-- Add guest user fields to invited_users if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invited_users' AND column_name = 'is_guest_user') THEN
        ALTER TABLE public.invited_users ADD COLUMN is_guest_user boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invited_users' AND column_name = 'last_booking_date') THEN
        ALTER TABLE public.invited_users ADD COLUMN last_booking_date timestamp with time zone;
    END IF;
END $$;

-- Add guest_user_id to reservations if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'guest_user_id') THEN
        ALTER TABLE public.reservations ADD COLUMN guest_user_id uuid REFERENCES public.invited_users(id);
    END IF;
END $$;

-- Update RLS policies for guest user access
-- Update reservations policies to handle guest_user_id
DROP POLICY IF EXISTS "Anyone can create guest reservations" ON public.reservations;
CREATE POLICY "Anyone can create guest reservations"
ON public.reservations
FOR INSERT
WITH CHECK (
  (is_guest_booking = true AND customer_email IS NOT NULL) OR
  (guest_user_id IS NOT NULL AND is_guest_booking = true)
);

DROP POLICY IF EXISTS "Users can create reservations" ON public.reservations;
CREATE POLICY "Users can create reservations"
ON public.reservations
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND client_id = auth.uid()) OR
  (is_guest_booking = true AND client_id IS NULL AND customer_email IS NOT NULL) OR
  (is_guest_booking = true AND guest_user_id IS NOT NULL)
);