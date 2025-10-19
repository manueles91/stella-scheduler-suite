-- Add DELETE policy for admins on profiles table
CREATE POLICY "Admins can delete any profile"
ON public.profiles
FOR DELETE
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);