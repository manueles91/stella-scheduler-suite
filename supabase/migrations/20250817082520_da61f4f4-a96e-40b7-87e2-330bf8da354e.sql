-- First, let's see what policies exist on invited_users and remove restrictive ones
DROP POLICY IF EXISTS "Allow guest booking user creation" ON public.invited_users;

-- Create a very permissive policy for guest bookings that covers all scenarios
CREATE POLICY "Comprehensive guest booking access"
ON public.invited_users
FOR ALL
USING (true)
WITH CHECK (true);

-- Also ensure reservations table allows guest booking creation
-- Drop existing restrictive policies that might conflict
DROP POLICY IF EXISTS "Anyone can create guest reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can create reservations" ON public.reservations;

-- Create comprehensive policies for reservations to allow guest bookings
CREATE POLICY "Allow all guest reservation operations"
ON public.reservations
FOR ALL
USING (
  -- Allow if user is authenticated and owns the reservation
  (auth.uid() IS NOT NULL AND client_id = auth.uid()) 
  OR 
  -- Allow if it's a guest booking
  (is_guest_booking = true)
  OR 
  -- Allow if user is admin or employee
  (auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'employee'))
    OR employee_id = auth.uid()
  ))
  OR
  -- Allow unauthenticated users for guest bookings
  (auth.uid() IS NULL AND is_guest_booking = true)
)
WITH CHECK (
  -- Same conditions for inserts/updates
  (auth.uid() IS NOT NULL AND client_id = auth.uid()) 
  OR 
  (is_guest_booking = true)
  OR 
  (auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'employee'))
    OR employee_id = auth.uid()
  ))
  OR
  (auth.uid() IS NULL AND is_guest_booking = true)
);