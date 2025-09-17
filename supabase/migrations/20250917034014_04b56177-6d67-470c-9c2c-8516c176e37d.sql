-- Add RLS policy to allow anonymous users to read reservations for availability checking
-- This is needed for guest booking time slot availability to work properly

CREATE POLICY "Allow anonymous access for availability checking"
ON public.reservations
FOR SELECT
TO anon
USING (true);