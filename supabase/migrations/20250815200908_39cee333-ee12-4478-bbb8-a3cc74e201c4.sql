-- Fix security linter issues introduced by previous migration

-- 1. Remove the problematic SECURITY DEFINER view that was flagged by linter
DROP VIEW IF EXISTS public.guest_reservations_view;

-- 2. Fix the function search path security issue
CREATE OR REPLACE FUNCTION public.check_guest_reservation_access(token text, reservation_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.reservations 
    WHERE id = reservation_id 
    AND registration_token = token 
    AND is_guest_booking = true
  );
$$;

-- 3. Improve the RLS policy to be more secure and specific
-- Remove the current policy and create a more restrictive one
DROP POLICY IF EXISTS "Guests can view specific reservation with valid token" ON public.reservations;

-- Create a more secure policy that properly restricts guest access
CREATE POLICY "Secure guest and user reservation access" 
ON public.reservations 
FOR SELECT 
USING (
  -- Authenticated users can see their own reservations
  (auth.uid() IS NOT NULL AND client_id = auth.uid())
  -- Employees can see their assigned reservations  
  OR (auth.uid() IS NOT NULL AND employee_id = auth.uid())
  -- Admins can see all reservations
  OR (get_user_role(auth.uid()) = 'admin')
  -- Guests can only see reservations through the application with proper token validation
  -- This removes the ability for direct database access to guest reservations
);

-- Note: Guest reservation access will need to be handled through application logic
-- using the check_guest_reservation_access function with proper token validation