-- Update admin_reservations_view to include combo reservations
DROP VIEW IF EXISTS admin_reservations_view;

CREATE VIEW admin_reservations_view AS
-- Individual service reservations
SELECT 
  r.id,
  r.appointment_date,
  r.start_time,
  r.end_time,
  r.client_id,
  r.employee_id,
  r.service_id,
  r.final_price_cents,
  r.status,
  r.notes,
  r.is_guest_booking,
  r.created_at,
  r.updated_at,
  r.customer_email AS client_email,
  r.customer_name AS client_name,
  s.name AS service_name,
  s.price_cents AS service_price_cents,
  s.duration_minutes AS service_duration,
  s.category_id,
  sc.name AS category_name,
  p.full_name AS client_full_name,
  p.phone AS client_phone,
  ep.full_name AS employee_full_name,
  'service'::text AS booking_type,
  NULL::uuid AS combo_id,
  NULL::text AS combo_name
FROM reservations r
LEFT JOIN services s ON r.service_id = s.id
LEFT JOIN service_categories sc ON s.category_id = sc.id
LEFT JOIN profiles p ON r.client_id = p.id
LEFT JOIN profiles ep ON r.employee_id = ep.id

UNION ALL

-- Combo reservations
SELECT 
  cr.id,
  cr.appointment_date,
  cr.start_time,
  cr.end_time,
  cr.client_id,
  cr.primary_employee_id AS employee_id,
  NULL::uuid AS service_id,
  cr.final_price_cents,
  cr.status,
  cr.notes,
  cr.is_guest_booking,
  cr.created_at,
  cr.updated_at,
  cr.customer_email AS client_email,
  cr.customer_name AS client_name,
  c.name AS service_name,
  cr.final_price_cents AS service_price_cents,
  EXTRACT(EPOCH FROM (cr.end_time - cr.start_time))/60 AS service_duration,
  NULL::uuid AS category_id,
  NULL::text AS category_name,
  p.full_name AS client_full_name,
  p.phone AS client_phone,
  ep.full_name AS employee_full_name,
  'combo'::text AS booking_type,
  cr.combo_id,
  c.name AS combo_name
FROM combo_reservations cr
LEFT JOIN combos c ON cr.combo_id = c.id
LEFT JOIN profiles p ON cr.client_id = p.id
LEFT JOIN profiles ep ON cr.primary_employee_id = ep.id;

-- Update employee_calendar_view to include combo bookings
DROP VIEW IF EXISTS employee_calendar_view;

CREATE VIEW employee_calendar_view AS
-- Individual service reservations
SELECT 
  r.id,
  r.appointment_date,
  r.start_time,
  r.end_time,
  r.client_id,
  r.employee_id,
  s.duration_minutes AS service_duration,
  r.status,
  r.notes,
  s.name AS service_name,
  COALESCE(p.full_name, r.customer_name) AS client_name,
  COALESCE(p.email, r.customer_email) AS client_email,
  p.phone AS client_phone,
  'service'::text AS booking_type,
  NULL::uuid AS combo_id,
  NULL::text AS combo_name
FROM reservations r
LEFT JOIN services s ON r.service_id = s.id
LEFT JOIN profiles p ON r.client_id = p.id

UNION ALL

-- Combo reservations
SELECT 
  cr.id,
  cr.appointment_date,
  cr.start_time,
  cr.end_time,
  cr.client_id,
  cr.primary_employee_id AS employee_id,
  EXTRACT(EPOCH FROM (cr.end_time - cr.start_time))/60 AS service_duration,
  cr.status,
  cr.notes,
  c.name AS service_name,
  COALESCE(p.full_name, cr.customer_name) AS client_name,
  COALESCE(p.email, cr.customer_email) AS client_email,
  p.phone AS client_phone,
  'combo'::text AS booking_type,
  cr.combo_id,
  c.name AS combo_name
FROM combo_reservations cr
LEFT JOIN combos c ON cr.combo_id = c.id
LEFT JOIN profiles p ON cr.client_id = p.id;