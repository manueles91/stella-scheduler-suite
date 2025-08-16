-- Allow guests to view employee profiles for booking purposes
CREATE POLICY "Guests can view employee profiles" 
ON public.profiles 
FOR SELECT 
USING (role IN ('employee', 'admin'));