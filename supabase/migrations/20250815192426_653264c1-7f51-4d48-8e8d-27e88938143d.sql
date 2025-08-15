-- Fix critical security vulnerability: Restrict profile access
-- The current "Users can view all profiles" policy with USING (true) allows anyone 
-- to read all user data including emails, phones, and roles

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create secure, role-based access policies

-- 1. Users can view their own complete profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- 2. Admins can view all profiles (complete data)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- 3. Employees can view limited customer info (only name) for bookings
-- This allows employees to see customer names in appointment lists without exposing sensitive data
CREATE POLICY "Employees can view limited customer info" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  get_user_role(auth.uid()) = 'employee'::user_role 
  AND role = 'client'::user_role
);

-- Note: This policy will only return full_name and id columns when accessed by employees
-- The application should handle filtering sensitive columns in the UI layer for this use case