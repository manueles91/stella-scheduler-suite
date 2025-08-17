-- Create admin reservations view for better performance and data access
CREATE OR REPLACE VIEW admin_reservations_view AS
SELECT 
  r.id,
  r.appointment_date,
  r.start_time,
  r.end_time,
  r.status,
  r.client_id,
  r.employee_id,
  r.service_id,
  r.final_price_cents,
  r.created_at,
  r.updated_at,
  r.notes,
  r.customer_email AS client_email,
  r.customer_name AS client_name,
  r.is_guest_booking,
  -- Service information
  s.name AS service_name,
  s.price_cents AS service_price_cents,
  s.duration_minutes AS service_duration,
  -- Category information
  sc.name AS category_name,
  sc.id AS category_id,
  -- Client profile information (when available)
  cp.full_name AS client_full_name,
  cp.phone AS client_phone,
  -- Employee profile information (when available)
  ep.full_name AS employee_full_name
FROM reservations r
LEFT JOIN services s ON r.service_id = s.id
LEFT JOIN service_categories sc ON s.category_id = sc.id
LEFT JOIN profiles cp ON r.client_id = cp.id
LEFT JOIN profiles ep ON r.employee_id = ep.id;

-- Create employee calendar view for employee dashboard
CREATE OR REPLACE VIEW employee_calendar_view AS
SELECT 
  r.id,
  r.appointment_date,
  r.start_time,
  r.end_time,
  r.status,
  r.client_id,
  r.employee_id,
  r.notes,
  -- Service information
  s.name AS service_name,
  s.duration_minutes AS service_duration,
  -- Client information (prioritize guest info when available)
  COALESCE(r.customer_name, cp.full_name) AS client_name,
  COALESCE(r.customer_email, cp.email) AS client_email,
  cp.phone AS client_phone
FROM reservations r
LEFT JOIN services s ON r.service_id = s.id
LEFT JOIN profiles cp ON r.client_id = cp.id
WHERE r.status != 'cancelled';

-- Grant proper permissions on the views
GRANT SELECT ON admin_reservations_view TO authenticated;
GRANT SELECT ON employee_calendar_view TO authenticated;