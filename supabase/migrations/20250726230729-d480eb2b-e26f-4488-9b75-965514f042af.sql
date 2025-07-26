-- Make client_id nullable to support guest bookings
ALTER TABLE public.reservations 
ALTER COLUMN client_id DROP NOT NULL;

-- Update RLS policies to handle guest bookings properly
DROP POLICY IF EXISTS "Clients can create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Clients can view own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Clients can update own reservations" ON public.reservations;

-- Create new policies that handle both authenticated and guest users
CREATE POLICY "Users can create reservations" 
ON public.reservations 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL AND client_id = auth.uid()) OR 
  (is_guest_booking = true AND client_id IS NULL AND customer_email IS NOT NULL)
);

CREATE POLICY "Users can view own reservations" 
ON public.reservations 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL AND client_id = auth.uid()) OR
  (get_user_role(auth.uid()) = 'admin') OR
  (employee_id = auth.uid())
);

CREATE POLICY "Users can update own reservations" 
ON public.reservations 
FOR UPDATE 
USING (
  (auth.uid() IS NOT NULL AND client_id = auth.uid()) OR
  (get_user_role(auth.uid()) = 'admin') OR
  (employee_id = auth.uid())
);