-- Update admin_reservations_view to use stored customer_name field when available
DROP VIEW IF EXISTS admin_reservations_view CASCADE;

CREATE VIEW admin_reservations_view AS
-- Individual reservations
SELECT 
  r.id,
  r.client_id,
  r.employee_id,
  r.appointment_date,
  r.start_time,
  r.end_time,
  r.status,
  r.notes,
  r.created_at,
  r.updated_at,
  r.final_price_cents,
  r.customer_email,
  r.customer_name,
  r.created_by_admin,
  r.is_guest_booking,
  -- Use stored customer_name when available, fallback to client profile
  COALESCE(r.customer_name, cp.full_name, 'Cliente no especificado') as client_full_name,
  ep.full_name as employee_full_name,
  s.name as service_name,
  s.price_cents as service_price_cents,
  s.duration_minutes as service_duration,
  sc.name as category_name,
  'service' as booking_type,
  NULL as combo_id,
  NULL as combo_name
FROM reservations r
LEFT JOIN profiles cp ON r.client_id = cp.id
LEFT JOIN profiles ep ON r.employee_id = ep.id
LEFT JOIN services s ON r.service_id = s.id
LEFT JOIN service_categories sc ON s.category_id = sc.id

UNION ALL

-- Combo reservations
SELECT 
  cr.id,
  cr.client_id,
  cr.primary_employee_id as employee_id,
  cr.appointment_date,
  cr.start_time,
  cr.end_time,
  cr.status,
  cr.notes,
  cr.created_at,
  cr.updated_at,
  cr.final_price_cents,
  cr.customer_email,
  cr.customer_name,
  cr.created_by_admin,
  cr.is_guest_booking,
  -- Use stored customer_name when available, fallback to client profile
  COALESCE(cr.customer_name, cp.full_name, 'Cliente no especificado') as client_full_name,
  ep.full_name as employee_full_name,
  c.name as service_name,
  cr.final_price_cents as service_price_cents,
  (SELECT SUM(s.duration_minutes * cs.quantity) 
   FROM combo_services cs 
   JOIN services s ON cs.service_id = s.id 
   WHERE cs.combo_id = c.id) as service_duration,
  'Combo' as category_name,
  'combo' as booking_type,
  cr.combo_id,
  c.name as combo_name
FROM combo_reservations cr
LEFT JOIN profiles cp ON cr.client_id = cp.id
LEFT JOIN profiles ep ON cr.primary_employee_id = ep.id
LEFT JOIN combos c ON cr.combo_id = c.id;

-- Also update employee_calendar_view to use stored customer_name
DROP VIEW IF EXISTS employee_calendar_view CASCADE;

CREATE VIEW employee_calendar_view AS
-- Individual reservations
SELECT 
  r.id,
  r.client_id,
  r.employee_id,
  r.appointment_date,
  r.start_time,
  r.end_time,
  r.status,
  r.notes,
  -- Use stored customer_name when available, fallback to client profile  
  COALESCE(r.customer_name, cp.full_name, 'Cliente no especificado') as client_name,
  ep.full_name as employee_name,
  s.name as service_name,
  s.duration_minutes,
  'service' as booking_type,
  NULL as combo_id,
  NULL as combo_name,
  FALSE as isCombo
FROM reservations r
LEFT JOIN profiles cp ON r.client_id = cp.id
LEFT JOIN profiles ep ON r.employee_id = ep.id
LEFT JOIN services s ON r.service_id = s.id

UNION ALL

-- Combo reservations
SELECT 
  cr.id,
  cr.client_id,
  cr.primary_employee_id as employee_id,
  cr.appointment_date,
  cr.start_time,
  cr.end_time,
  cr.status,
  cr.notes,
  -- Use stored customer_name when available, fallback to client profile
  COALESCE(cr.customer_name, cp.full_name, 'Cliente no especificado') as client_name,
  ep.full_name as employee_name,
  c.name as service_name,
  (SELECT SUM(s.duration_minutes * cs.quantity) 
   FROM combo_services cs 
   JOIN services s ON cs.service_id = s.id 
   WHERE cs.combo_id = c.id) as duration_minutes,
  'combo' as booking_type,
  cr.combo_id,
  c.name as combo_name,
  TRUE as isCombo
FROM combo_reservations cr
LEFT JOIN profiles cp ON cr.client_id = cp.id
LEFT JOIN profiles ep ON cr.primary_employee_id = ep.id
LEFT JOIN combos c ON cr.combo_id = c.id;