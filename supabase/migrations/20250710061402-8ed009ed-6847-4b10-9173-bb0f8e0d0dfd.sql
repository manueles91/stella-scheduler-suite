-- Add missing RLS policies for employee_schedules table
-- Allow employees to create and update their own schedules

CREATE POLICY "Employees can create own schedules" 
ON public.employee_schedules 
FOR INSERT 
TO authenticated
WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Employees can update own schedules" 
ON public.employee_schedules 
FOR UPDATE 
TO authenticated
USING (employee_id = auth.uid());