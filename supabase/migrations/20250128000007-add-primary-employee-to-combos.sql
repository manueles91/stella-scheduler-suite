-- Add primary_employee_id to existing combos table
-- This field will be used to track which employee is primarily responsible for the combo

-- Add primary_employee_id column to combos table
ALTER TABLE public.combos 
ADD COLUMN primary_employee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_combos_primary_employee_id ON public.combos(primary_employee_id);

-- Update RLS policies to include primary employee access
-- Primary employees should be able to see combos they're responsible for
DROP POLICY IF EXISTS "Users can view all combos" ON public.combos;
CREATE POLICY "Comprehensive combo access policy" 
ON public.combos 
FOR SELECT 
USING (
  -- Admins can see all combos
  (auth.uid() IS NOT NULL AND get_user_role(auth.uid()) = 'admin')
  -- Primary employees can see combos they're responsible for
  OR (auth.uid() IS NOT NULL AND primary_employee_id = auth.uid())
  -- Anyone can see active combos
  OR (is_active = true)
);

-- Update combo creation policy to require primary employee
DROP POLICY IF EXISTS "Admins can create combos" ON public.combos;
CREATE POLICY "Combo creation policy" 
ON public.combos 
FOR INSERT 
WITH CHECK (
  -- Admins can create combos
  (auth.uid() IS NOT NULL AND get_user_role(auth.uid()) = 'admin')
  -- Primary employee must be specified
  AND (primary_employee_id IS NOT NULL)
);

-- Update combo update policy
DROP POLICY IF EXISTS "Admins can update combos" ON public.combos;
CREATE POLICY "Combo update policy" 
ON public.combos 
FOR UPDATE 
USING (
  -- Admins can update any combo
  (auth.uid() IS NOT NULL AND get_user_role(auth.uid()) = 'admin')
  -- Primary employees can update combos they're responsible for
  OR (auth.uid() IS NOT NULL AND primary_employee_id = auth.uid())
);

-- Update combo delete policy
DROP POLICY IF EXISTS "Admins can delete combos" ON public.combos;
CREATE POLICY "Combo delete policy" 
ON public.combos 
FOR DELETE 
USING (
  -- Only admins can delete combos
  (auth.uid() IS NOT NULL AND get_user_role(auth.uid()) = 'admin')
);

-- Grant permissions
GRANT ALL ON public.combos TO authenticated;
