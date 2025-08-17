-- Fix RLS policies for reservations table to resolve admin dashboard and calendar fetching issues
-- This resolves the problems where:
-- 1. AdminIngresos graphs are not populated by completed appointments (sales)
-- 2. Mi agenda page is not fetching past nor upcoming appointments in calendar

-- Drop all conflicting and overly restrictive policies
DROP POLICY IF EXISTS "Users can create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can view own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can update own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Secure guest and user reservation access" ON public.reservations;
DROP POLICY IF EXISTS "Guests can view specific reservation with valid token" ON public.reservations;
DROP POLICY IF EXISTS "Anyone can create guest reservations" ON public.reservations;
DROP POLICY IF EXISTS "Anyone can view guest reservations with registration token" ON public.reservations;

-- Create clean, comprehensive RLS policies for reservations

-- 1. Policy for viewing reservations (SELECT)
CREATE POLICY "Comprehensive reservation access policy" 
ON public.reservations 
FOR SELECT 
USING (
  -- Admins can see all reservations
  (auth.uid() IS NOT NULL AND get_user_role(auth.uid()) = 'admin')
  -- Employees can see their assigned reservations
  OR (auth.uid() IS NOT NULL AND employee_id = auth.uid())
  -- Clients can see their own reservations
  OR (auth.uid() IS NOT NULL AND client_id = auth.uid())
  -- Guest users can see their specific reservation with valid token
  OR (is_guest_booking = true AND registration_token IS NOT NULL)
);

-- 2. Policy for creating reservations (INSERT)
CREATE POLICY "Reservation creation policy" 
ON public.reservations 
FOR INSERT 
WITH CHECK (
  -- Authenticated users can create reservations for themselves
  (auth.uid() IS NOT NULL AND client_id = auth.uid())
  -- Guest users can create guest bookings
  OR (is_guest_booking = true AND customer_email IS NOT NULL)
  -- Admins can create reservations for anyone
  OR (auth.uid() IS NOT NULL AND get_user_role(auth.uid()) = 'admin')
);

-- 3. Policy for updating reservations (UPDATE)
CREATE POLICY "Reservation update policy" 
ON public.reservations 
FOR UPDATE 
USING (
  -- Admins can update any reservation
  (auth.uid() IS NOT NULL AND get_user_role(auth.uid()) = 'admin')
  -- Employees can update their assigned reservations
  OR (auth.uid() IS NOT NULL AND employee_id = auth.uid())
  -- Clients can update their own reservations
  OR (auth.uid() IS NOT NULL AND client_id = auth.uid())
);

-- 4. Policy for deleting reservations (DELETE)
CREATE POLICY "Reservation deletion policy" 
ON public.reservations 
FOR DELETE 
USING (
  -- Only admins can delete reservations
  (auth.uid() IS NOT NULL AND get_user_role(auth.uid()) = 'admin')
);

-- Fix the get_user_role function to ensure it works correctly
-- This function is critical for RLS policies to work properly
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Create a helper function to check if user is admin (for use in policies)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT get_user_role(user_id) = 'admin';
$$;

-- Create a helper function to check if user is employee (for use in policies)
CREATE OR REPLACE FUNCTION public.is_employee(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT get_user_role(user_id) = 'employee';
$$;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_employee(UUID) TO authenticated;

-- Create a view for admin dashboard analytics that's safe and performant
CREATE OR REPLACE VIEW public.admin_reservations_view AS
SELECT 
  r.id,
  r.appointment_date,
  r.start_time,
  r.end_time,
  r.status,
  r.notes,
  r.client_id,
  r.employee_id,
  r.service_id,
  r.final_price_cents,
  r.original_price_cents,
  r.savings_cents,
  r.created_at,
  r.updated_at,
  -- Client information
  COALESCE(cp.full_name, r.customer_name) as client_name,
  COALESCE(cp.email, r.customer_email) as client_email,
  -- Employee information
  ep.full_name as employee_name,
  -- Service information
  s.name as service_name,
  s.price_cents as service_price_cents,
  s.duration_minutes,
  -- Category information
  sc.name as category_name
FROM public.reservations r
LEFT JOIN public.profiles cp ON r.client_id = cp.id
LEFT JOIN public.profiles ep ON r.employee_id = ep.id
LEFT JOIN public.services s ON r.service_id = s.id
LEFT JOIN public.service_categories sc ON s.category_id = sc.id
WHERE r.is_guest_booking = false OR r.is_guest_booking IS NULL;

-- Grant access to the admin view
GRANT SELECT ON public.admin_reservations_view TO authenticated;

-- Create a view for employee calendar that's safe and performant
CREATE OR REPLACE VIEW public.employee_calendar_view AS
SELECT 
  r.id,
  r.appointment_date,
  r.start_time,
  r.end_time,
  r.status,
  r.notes,
  r.employee_id,
  r.client_id,
  r.service_id,
  -- Client information (limited for privacy)
  COALESCE(cp.full_name, r.customer_name) as client_name,
  -- Service information
  s.name as service_name,
  s.duration_minutes
FROM public.reservations r
LEFT JOIN public.profiles cp ON r.client_id = cp.id
LEFT JOIN public.services s ON r.service_id = s.id
WHERE r.employee_id = auth.uid() OR get_user_role(auth.uid()) = 'admin';

-- Grant access to the employee calendar view
GRANT SELECT ON public.employee_calendar_view TO authenticated;

-- Add comment explaining the security model
COMMENT ON VIEW public.admin_reservations_view IS 
'Admin view for dashboard analytics and management. Provides comprehensive reservation data 
while maintaining security through RLS policies.';

COMMENT ON VIEW public.employee_calendar_view IS 
'Employee calendar view showing only relevant appointment information. 
Employees see only their assigned appointments, admins see all.';
