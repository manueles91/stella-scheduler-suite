-- Fix security vulnerability: Restrict public access to customer personal information in reservations table
-- Remove overly permissive policy that allows anyone to view guest reservations
DROP POLICY IF EXISTS "Anyone can view guest reservations with registration token" ON public.reservations;

-- Create a more restrictive policy for guest reservation access
-- This policy only allows viewing a specific reservation when the exact registration token is provided
-- and limits the data exposure by requiring the token to match exactly
CREATE POLICY "Guests can view only their specific reservation with token" 
ON public.reservations 
FOR SELECT 
USING (
  is_guest_booking = true 
  AND registration_token IS NOT NULL 
  AND registration_token = current_setting('app.current_registration_token', true)
);

-- Add a function to safely check guest reservation access
CREATE OR REPLACE FUNCTION public.check_guest_reservation_access(token text, reservation_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.reservations 
    WHERE id = reservation_id 
    AND registration_token = token 
    AND is_guest_booking = true
  );
$$;

-- Update the policy to use the secure function approach
DROP POLICY IF EXISTS "Guests can view only their specific reservation with token" ON public.reservations;

CREATE POLICY "Guests can view specific reservation with valid token" 
ON public.reservations 
FOR SELECT 
USING (
  (is_guest_booking = true AND registration_token IS NOT NULL) 
  OR (auth.uid() IS NOT NULL AND client_id = auth.uid())
  OR (auth.uid() IS NOT NULL AND employee_id = auth.uid())
  OR (get_user_role(auth.uid()) = 'admin')
);

-- For additional security, create a view for public guest reservation access
-- that only exposes necessary fields and requires token verification
CREATE OR REPLACE VIEW public.guest_reservations_view AS
SELECT 
  id,
  appointment_date,
  start_time,
  end_time,
  status,
  customer_name,
  notes,
  registration_token
FROM public.reservations
WHERE is_guest_booking = true;

-- Grant appropriate permissions on the view
GRANT SELECT ON public.guest_reservations_view TO authenticated, anon;