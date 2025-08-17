-- Drop the previous guest policy and create a more comprehensive one
DROP POLICY IF EXISTS "Anyone can create guest user entries for bookings" ON public.invited_users;

-- Create a more permissive policy for guest booking creation
CREATE POLICY "Allow guest booking user creation"
ON public.invited_users
FOR INSERT
WITH CHECK (
  -- Allow if it's explicitly marked as a guest user
  is_guest_user = true 
  OR 
  -- Allow if auth.uid() is null (unauthenticated) and it's for booking purposes
  (auth.uid() IS NULL AND email IS NOT NULL AND full_name IS NOT NULL)
);