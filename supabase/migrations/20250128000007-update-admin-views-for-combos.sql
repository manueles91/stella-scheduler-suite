-- Update admin views to include combo reservations
-- This ensures combo bookings appear in admin dashboard, ingresos, and mi agenda

-- Drop existing views
DROP VIEW IF EXISTS public.admin_reservations_view;
DROP VIEW IF EXISTS public.employee_calendar_view;

-- Create updated admin_reservations_view that includes both individual and combo reservations
CREATE OR REPLACE VIEW public.admin_reservations_view AS
-- Individual service reservations
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
  sc.name as category_name,
  -- Type indicator
  'service' as booking_type,
  NULL as combo_id,
  NULL as combo_name
FROM public.reservations r
LEFT JOIN public.profiles cp ON r.client_id = cp.id
LEFT JOIN public.profiles ep ON r.employee_id = ep.id
LEFT JOIN public.services s ON r.service_id = s.id
LEFT JOIN public.service_categories sc ON s.category_id = sc.id
WHERE r.is_guest_booking = false OR r.is_guest_booking IS NULL

UNION ALL

-- Combo reservations
SELECT 
  cr.id,
  cr.appointment_date,
  cr.start_time,
  cr.end_time,
  cr.status,
  cr.notes,
  cr.client_id,
  cr.primary_employee_id as employee_id,
  NULL as service_id,
  cr.final_price_cents,
  cr.original_price_cents,
  cr.savings_cents,
  cr.created_at,
  cr.updated_at,
  -- Client information
  COALESCE(cp.full_name, cr.customer_name) as client_name,
  COALESCE(cp.email, cr.customer_email) as client_email,
  -- Employee information
  ep.full_name as employee_name,
  -- Service information (combo name)
  c.name as service_name,
  cr.final_price_cents as service_price_cents,
  -- Calculate total duration from combo services
  COALESCE((
    SELECT SUM(cs.quantity * s.duration_minutes)
    FROM combo_service_assignments csa
    JOIN services s ON csa.service_id = s.id
    WHERE csa.combo_reservation_id = cr.id
  ), 0) as duration_minutes,
  -- Category information (combo category)
  'Combo' as category_name,
  -- Type indicator
  'combo' as booking_type,
  cr.combo_id,
  c.name as combo_name
FROM public.combo_reservations cr
LEFT JOIN public.profiles cp ON cr.client_id = cp.id
LEFT JOIN public.profiles ep ON cr.primary_employee_id = ep.id
LEFT JOIN public.combos c ON cr.combo_id = c.id
WHERE cr.is_guest_booking = false OR cr.is_guest_booking IS NULL;

-- Create updated employee_calendar_view that includes both individual and combo reservations
CREATE OR REPLACE VIEW public.employee_calendar_view AS
-- Individual service reservations
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
  s.duration_minutes,
  -- Type indicator
  'service' as booking_type,
  NULL as combo_id,
  NULL as combo_name
FROM public.reservations r
LEFT JOIN public.profiles cp ON r.client_id = cp.id
LEFT JOIN public.services s ON r.service_id = s.id
WHERE r.employee_id = auth.uid() OR get_user_role(auth.uid()) = 'admin'

UNION ALL

-- Combo reservations where employee is primary or assigned to services
SELECT 
  cr.id,
  cr.appointment_date,
  cr.start_time,
  cr.end_time,
  cr.status,
  cr.notes,
  cr.primary_employee_id as employee_id,
  cr.client_id,
  NULL as service_id,
  -- Client information (limited for privacy)
  COALESCE(cp.full_name, cr.customer_name) as client_name,
  -- Service information (combo name)
  c.name as service_name,
  -- Calculate total duration from combo services
  COALESCE((
    SELECT SUM(cs.quantity * s.duration_minutes)
    FROM combo_service_assignments csa
    JOIN services s ON csa.service_id = s.id
    WHERE csa.combo_reservation_id = cr.id
  ), 0) as duration_minutes,
  -- Type indicator
  'combo' as booking_type,
  cr.combo_id,
  c.name as combo_name
FROM public.combo_reservations cr
LEFT JOIN public.profiles cp ON cr.client_id = cp.id
LEFT JOIN public.combos c ON cr.combo_id = c.id
WHERE (cr.primary_employee_id = auth.uid() OR get_user_role(auth.uid()) = 'admin')
  OR EXISTS (
    SELECT 1 FROM combo_service_assignments csa 
    WHERE csa.combo_reservation_id = cr.id 
    AND csa.assigned_employee_id = auth.uid()
  );

-- Grant access to the updated views
GRANT SELECT ON public.admin_reservations_view TO authenticated;
GRANT SELECT ON public.employee_calendar_view TO authenticated;

-- Add comments explaining the updated views
COMMENT ON VIEW public.admin_reservations_view IS 
'Updated admin view for dashboard analytics and management. Now includes both individual service reservations 
and combo reservations for comprehensive booking visibility.';

COMMENT ON VIEW public.employee_calendar_view IS 
'Updated employee calendar view showing both individual appointments and combo bookings. 
Employees see their assigned appointments and combo reservations where they are primary or assigned to services.';
