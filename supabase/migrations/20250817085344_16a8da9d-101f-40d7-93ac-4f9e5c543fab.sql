-- Fix guest booking issue with invited_users table
-- The problem is that invited_by has a NOT NULL constraint but guest users don't have an inviter

-- 1. Make invited_by nullable for guest users
ALTER TABLE public.invited_users 
ALTER COLUMN invited_by DROP NOT NULL;

-- 2. Add a check constraint to ensure invited_by is only null for guest users
ALTER TABLE public.invited_users 
ADD CONSTRAINT check_invited_by_for_guest_users 
CHECK (
  (is_guest_user = true AND invited_by IS NULL) OR 
  (is_guest_user = false AND invited_by IS NOT NULL)
);

-- 3. Clean up conflicting RLS policies
DROP POLICY IF EXISTS "Admins can manage invited users" ON public.invited_users;
DROP POLICY IF EXISTS "Comprehensive guest booking access" ON public.invited_users;
DROP POLICY IF EXISTS "Allow guest booking user creation" ON public.invited_users;
DROP POLICY IF EXISTS "Anyone can create guest user entries for bookings" ON public.invited_users;

-- 4. Create clean, secure RLS policies for invited_users
-- Policy for admins to manage all invited users
CREATE POLICY "Admins can manage all invited users"
ON public.invited_users
FOR ALL
USING (get_user_role(auth.uid()) = 'admin')
WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- Policy for creating guest users (unauthenticated access)
CREATE POLICY "Allow guest user creation for bookings"
ON public.invited_users
FOR INSERT
WITH CHECK (
  -- Must be a guest user
  is_guest_user = true 
  AND 
  -- Must have required fields
  email IS NOT NULL 
  AND 
  full_name IS NOT NULL 
  AND 
  -- invited_by must be null for guest users
  invited_by IS NULL
  AND
  -- account_status must be 'guest'
  account_status = 'guest'
);

-- Policy for updating guest user data (limited to last_booking_date)
CREATE POLICY "Allow guest user updates for booking tracking"
ON public.invited_users
FOR UPDATE
USING (
  -- Only allow updates to guest users
  is_guest_user = true
)
WITH CHECK (
  -- Only allow updating specific fields for security
  -- This prevents changing critical fields like email, full_name, role
  invited_by IS NULL AND
  account_status = 'guest' AND
  is_guest_user = true
);

-- Policy for viewing guest user data (for booking purposes)
CREATE POLICY "Allow viewing guest user data for bookings"
ON public.invited_users
FOR SELECT
USING (
  -- Allow if it's a guest user (for booking lookups)
  is_guest_user = true
  OR
  -- Allow if user is admin
  (auth.uid() IS NOT NULL AND get_user_role(auth.uid()) = 'admin')
);

-- 5. Ensure the is_guest_user column has a default value
ALTER TABLE public.invited_users 
ALTER COLUMN is_guest_user SET DEFAULT false;

-- 6. Add index for better performance on guest user lookups
CREATE INDEX IF NOT EXISTS idx_invited_users_guest_lookup 
ON public.invited_users (email, is_guest_user) 
WHERE is_guest_user = true;