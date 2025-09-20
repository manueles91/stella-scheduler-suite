-- Allow employees to manage invited_users (except assigning admin role)
-- SELECT
CREATE POLICY IF NOT EXISTS "Employees can view invited users"
ON public.invited_users
FOR SELECT
USING (get_user_role(auth.uid()) = 'employee'::user_role);

-- INSERT (non-admin role, attributed to inviter)
CREATE POLICY IF NOT EXISTS "Employees can insert invited users"
ON public.invited_users
FOR INSERT
WITH CHECK (
  get_user_role(auth.uid()) = 'employee'::user_role
  AND invited_by = auth.uid()
  AND role <> 'admin'::user_role
);

-- UPDATE (non-admin role)
CREATE POLICY IF NOT EXISTS "Employees can update invited users (non-admin)"
ON public.invited_users
FOR UPDATE
USING (get_user_role(auth.uid()) = 'employee'::user_role)
WITH CHECK (role <> 'admin'::user_role);

-- DELETE (non-admin role)
CREATE POLICY IF NOT EXISTS "Employees can delete invited users (non-admin)"
ON public.invited_users
FOR DELETE
USING (
  get_user_role(auth.uid()) = 'employee'::user_role
  AND role <> 'admin'::user_role
);
