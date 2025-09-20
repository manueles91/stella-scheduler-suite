-- Allow employees to manage invited_users (except assigning admin role)
-- Migration: 20250920162004_7ff954c7-9d7f-49ef-99b8-a33e0128e320.sql

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Employees can insert invited users" ON public.invited_users;
DROP POLICY IF EXISTS "Employees can update invited users (non-admin)" ON public.invited_users;
DROP POLICY IF EXISTS "Employees can delete invited users (non-admin)" ON public.invited_users;
DROP POLICY IF EXISTS "Employees can view invited users" ON public.invited_users;

-- Create comprehensive policies for employee management of invited users
CREATE POLICY "Employees can insert invited users" 
ON public.invited_users 
FOR INSERT 
WITH CHECK (
  (get_user_role(auth.uid()) = 'employee'::user_role) 
  AND (invited_by = auth.uid()) 
  AND (role <> 'admin'::user_role)
);

CREATE POLICY "Employees can update invited users (non-admin)" 
ON public.invited_users 
FOR UPDATE 
USING (get_user_role(auth.uid()) = 'employee'::user_role)
WITH CHECK (role <> 'admin'::user_role);

CREATE POLICY "Employees can delete invited users (non-admin)" 
ON public.invited_users 
FOR DELETE 
USING (
  (get_user_role(auth.uid()) = 'employee'::user_role) 
  AND (role <> 'admin'::user_role)
);

CREATE POLICY "Employees can view invited users" 
ON public.invited_users 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'employee'::user_role);