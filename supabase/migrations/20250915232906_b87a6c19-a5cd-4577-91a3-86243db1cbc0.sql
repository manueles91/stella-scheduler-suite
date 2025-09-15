-- Update RLS policies for admin_feedback table to allow employees and clients to provide feedback

-- Drop the existing overly restrictive policy
DROP POLICY IF EXISTS "Admins can manage all feedback" ON public.admin_feedback;

-- Create new policies for different user roles
CREATE POLICY "Admins can manage all feedback" 
ON public.admin_feedback 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Users can create their own feedback" 
ON public.admin_feedback 
FOR INSERT 
WITH CHECK (admin_id = auth.uid());

CREATE POLICY "Users can view their own feedback" 
ON public.admin_feedback 
FOR SELECT 
USING (admin_id = auth.uid() OR get_user_role(auth.uid()) = 'admin'::user_role);